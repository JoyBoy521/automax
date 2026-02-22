package com.automax.mall.task;

import com.automax.mall.config.AdminWebSocketServer;
import com.automax.mall.entity.CarSku;
import com.automax.mall.entity.TradeOrder;
import com.automax.mall.mapper.CarSkuMapper;
import com.automax.mall.mapper.TradeOrderMapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

    @Component
    public class OrderTimeoutTask {
        @Autowired
        private StringRedisTemplate redisTemplate;
        @Autowired private TradeOrderMapper orderMapper;
        @Autowired private CarSkuMapper carSkuMapper;

        @Scheduled(fixedDelay = 5000)
        public void scanExpiredOrders() {
            long now = System.currentTimeMillis();
            // 抓出所有 Score（过期时间）小于等于现在的订单号
            Set<String> expiredNos = redisTemplate.opsForZSet().rangeByScore("automax:order:timeout", 0, now);

            if (expiredNos != null && !expiredNos.isEmpty()) {
                for (String orderNo : expiredNos) {
                    // 1. 数据库逻辑：订单状态设为 5 (超时关闭)，释放车辆库存
                    handleTimeout(orderNo);

                    // 2. 🌟 实时通知：通过 WebSocket 推送带图标的消息
                    String noticeJson = String.format(
                            "{\"type\":\"TIMEOUT\", \"title\":\"库存释放通知\", \"body\":\"订单 %s 15分钟未支付，系统已自动释放车辆库存。\"}",
                            orderNo
                    );
                    AdminWebSocketServer.sendNotice(noticeJson);

                    // 3. 从 Redis 移除
                    redisTemplate.opsForZSet().remove("automax:order:timeout", orderNo);
                }
            }
        }

        @Transactional
        public void handleTimeout(String orderNo) {
            TradeOrder order = orderMapper.selectOne(new QueryWrapper<TradeOrder>().eq("order_no", orderNo));
            if (order != null && order.getStatus() == 1) {
                order.setStatus(5); // 5 代表超时自动取消
                orderMapper.updateById(order);

                CarSku sku = carSkuMapper.selectById(order.getSkuId());
                if (sku != null) {
                    sku.setStatus(2); // 2 改回在售
                    carSkuMapper.updateById(sku);
                }
            }
        }
    }

