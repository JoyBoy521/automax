package com.automax.mall.task;

import com.automax.mall.config.AdminWebSocketServer;
import com.automax.mall.entity.CarSku;
import com.automax.mall.entity.TradeOrder;
import com.automax.mall.mapper.CarSkuMapper;
import com.automax.mall.mapper.TradeOrderMapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Component
public class OrderTimeoutTask {

    private static final Logger log = LoggerFactory.getLogger(OrderTimeoutTask.class);

    @Autowired
    private StringRedisTemplate redisTemplate;
    @Autowired
    private TradeOrderMapper orderMapper;
    @Autowired
    private CarSkuMapper carSkuMapper;

    // 🌟 核心修复 1：通过注入自身代理对象，解决 Spring 同类方法调用导致 @Transactional 失效的问题
    @Autowired
    @Lazy
    private OrderTimeoutTask self;

    private static final String ORDER_TIMEOUT_KEY = "automax:order:timeout";

    /**
     * 任务一：高频 Redis 扫描 (每 5 秒执行一次)
     * 负责处理绝大多数正常超时的订单，性能高，不给数据库造成压力
     */
    @Scheduled(fixedDelay = 5000)
    public void scanExpiredOrdersFromRedis() {
        long now = System.currentTimeMillis();
        // 抓出所有 Score（过期时间）小于等于现在的订单号
        Set<String> expiredNos = redisTemplate.opsForZSet().rangeByScore(ORDER_TIMEOUT_KEY, 0, now);

        if (expiredNos != null && !expiredNos.isEmpty()) {
            for (String orderNo : expiredNos) {
                try {
                    // 调用代理对象的方法，确保事务生效
                    boolean success = self.handleTimeout(orderNo);

                    if (success) {
                        // 🌟 实时通知：通过 WebSocket 推送带图标的消息
                        String noticeJson = String.format(
                                "{\"type\":\"TIMEOUT\", \"title\":\"库存释放通知\", \"body\":\"订单 %s 15分钟未支付，系统已自动释放车辆库存。\"}",
                                orderNo
                        );
                        AdminWebSocketServer.sendNotice(noticeJson);
                    }
                } catch (Exception e) {
                    log.error("Redis 订单超时处理异常, 订单号: {}", orderNo, e);
                } finally {
                    // 🌟 核心修复 2：无论成功与否，都要从 Redis 移除。
                    // 避免因为某条脏数据报错，导致死循环一直卡在 Redis 里。
                    // 如果真失败了，下面的 DB 兜底任务会接管它。
                    redisTemplate.opsForZSet().remove(ORDER_TIMEOUT_KEY, orderNo);
                }
            }
        }
    }

    /**
     * 任务二：低频 MySQL 兜底扫描 (每 5 分钟执行一次)
     * 🌟 核心修复 3：防范单点故障。如果 Redis 宕机、键被误删，这步能把死库存救回来
     */
    @Scheduled(fixedDelay = 300000)
    public void scanExpiredOrdersFromDb() {
        // 查询 DB 中所有状态仍为 1 (已锁单)，且 expire_time 已经过期的订单
        QueryWrapper<TradeOrder> wrapper = new QueryWrapper<>();
        wrapper.eq("status", 1)
                .lt("expire_time", LocalDateTime.now());

        List<TradeOrder> deadOrders = orderMapper.selectList(wrapper);
        if (deadOrders != null && !deadOrders.isEmpty()) {
            log.warn("触发 DB 兜底扫描，发现 {} 个异常未释放的订单", deadOrders.size());
            for (TradeOrder order : deadOrders) {
                try {
                    self.handleTimeout(order.getOrderNo());
                } catch (Exception e) {
                    log.error("DB 兜底订单超时处理异常, 订单号: {}", order.getOrderNo(), e);
                }
            }
        }
    }

    /**
     * 核心超时处理逻辑：强制保证数据库操作的原子性和数据一致性
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean handleTimeout(String orderNo) {
        TradeOrder order = orderMapper.selectOne(new QueryWrapper<TradeOrder>().eq("order_no", orderNo));

        // 只有处于 1-已锁单 状态的订单才有资格被取消
        if (order != null && order.getStatus() == 1) {

            // 🌟 核心修复 4：不要 select 后在内存中 if 判断再 update，直接用 UpdateWrapper 实现 SQL 级别的条件更新 (乐观锁思想)
            // 相当于: UPDATE trade_order SET status = 5 WHERE id = ? AND status = 1
            UpdateWrapper<TradeOrder> orderUpdate = new UpdateWrapper<>();
            orderUpdate.eq("id", order.getId())
                    .eq("status", 1)
                    .set("status", 5); // 5 代表超时自动取消
            int orderRows = orderMapper.update(null, orderUpdate);

            // 只有当订单成功变更为 5 的时候，才去释放车辆（防止极高并发下别人刚付完款，你正好把订单关了）
            if (orderRows > 0) {
                UpdateWrapper<CarSku> skuUpdate = new UpdateWrapper<>();
                skuUpdate.eq("id", order.getSkuId())
                        .eq("status", 3) // 3-已预定
                        .set("status", 2); // 2-改回在售
                carSkuMapper.update(null, skuUpdate);

                log.info("【防超卖闭环】订单 {} 超时取消成功，关联 SKU:{} 库存已释放至在售状态", orderNo, order.getSkuId());
                return true;
            }
        }
        return false;
    }
}