package com.automax.mall.service;

import com.automax.mall.config.AdminWebSocketServer;
import com.automax.mall.config.LoginInterceptor;
import com.automax.mall.entity.CarSku;
import com.automax.mall.entity.TradeOrder;
import com.automax.mall.mapper.CarSkuMapper;
import com.automax.mall.mapper.TradeOrderMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.redis.core.StringRedisTemplate;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.automax.mall.utils.UserContext;
import com.automax.mall.entity.SysUser;
import com.automax.mall.vo.CarSkuVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class OrderService {
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    @Autowired private CarSkuMapper carSkuMapper;
    @Autowired private TradeOrderMapper orderMapper;
    @Autowired private ObjectMapper objectMapper;
    private static final String ORDER_TIMEOUT_KEY = "automax:order:timeout";
    @Autowired
    private StringRedisTemplate redisTemplate;
    /**
     * 锁车下单逻辑
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean lockCar(Long skuId) {
        CarSku sku = carSkuMapper.selectById(skuId);
        // 只有状态为 2(在售) 的车才能预定
        if (sku == null || sku.getStatus() != 2) return false;

        // 1. 更新车辆状态为 3(已预定)
        sku.setStatus(3);
        int rows = carSkuMapper.updateById(sku);

        if (rows > 0) {
            // 2. 生成订单记录
            TradeOrder order = new TradeOrder();
            order.setOrderNo("AUTO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

            // 🌟 核心改进：从拦截器获取当前登录用户ID
            Long userId = LoginInterceptor.userHolder.get();
            order.setUserId(userId != null ? userId : 1L);

            order.setStoreId(sku.getStoreId());
            order.setSkuId(skuId);
            order.setPayAmount(sku.getDepositAmount() != null ? sku.getDepositAmount() : new BigDecimal("500.00"));
// 设置车辆总价 (从 sku 的展示价格获取)
            order.setTotalAmount(sku.getShowPrice());
            order.setStatus(1); // 1-已锁单

            orderMapper.insert(order);

            // 🌟 进阶：存入 Redis ZSet
            // 分数 (Score) 设置为：当前时间毫秒数 + 15分钟的毫秒数
            long timeoutAt = System.currentTimeMillis() + 15 * 60 * 1000;
            // Redis 仅用于超时加速队列，失败时不应影响主交易链路
            try {
                redisTemplate.opsForZSet().add(ORDER_TIMEOUT_KEY, order.getOrderNo(), timeoutAt);
            } catch (Exception e) {
                log.warn("写入 Redis 超时队列失败，已降级为仅依赖数据库兜底扫描. orderNo={}", order.getOrderNo(), e);
            }
            pushOrderNotice(
                    "order",
                    "新预定订单待跟进",
                    String.format("订单 %s 已锁车成功，请尽快联系客户确认到店。", buildDisplayOrderNo(order)),
                    "/admin/orders",
                    "high",
                    "去订单页处理"
            );
            return true;
        }
        return false;
    }

    /**
     * 🌟 B端核心：管理员确认成交
     * 逻辑：订单 1(锁单) -> 2(成交)；车辆 3(预定) -> 4(已售出)
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean confirmOrder(Long orderId) {
        TradeOrder order = orderMapper.selectById(orderId);
        if (order != null && order.getStatus() == 1) {
            order.setStatus(2); // 成交
            orderMapper.updateById(order);

            // 同步将车辆置为已售出
            CarSku sku = carSkuMapper.selectById(order.getSkuId());
            if (sku != null) {
                sku.setStatus(4); // 4-已售出
                carSkuMapper.updateById(sku);
            }
            return true;
        }
        return false;
    }

    /**
     * 🌟 B端核心：取消订单/释放库存
     * 逻辑：订单 -> 3(已取消)；车辆 -> 2(重新在售)
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean cancelOrderAdmin(Long orderId) {
        TradeOrder order = orderMapper.selectById(orderId);
        if (order != null && (order.getStatus() == 1 || order.getStatus() == 2 || order.getStatus() == 3)) {
            order.setStatus(6); // 6-已退款
            orderMapper.updateById(order);

            // 释放车辆库存，回归在售状态
            CarSku sku = carSkuMapper.selectById(order.getSkuId());
            if (sku != null) {
                sku.setStatus(2); // 2-在售
                carSkuMapper.updateById(sku);
            }
            pushOrderNotice(
                    "order",
                    "订单已退款并释放库存",
                    String.format("订单 %s 已由后台退款退车，库存已回到在售。", buildDisplayOrderNo(order)),
                    "/admin/orders",
                    "medium",
                    "去订单页复核"
            );
            return true;
        }
        return false;
    }

    /**
     * C端：用户只能取消自己的锁单订单
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean cancelOrderByUser(Long orderId, Long userId) {
        if (userId == null) {
            return false;
        }
        TradeOrder order = orderMapper.selectById(orderId);
        if (order == null) {
            return false;
        }
        if (!userId.equals(order.getUserId())) {
            return false;
        }
        if (order.getStatus() != 1) {
            return false;
        }
        order.setStatus(6); // 6-已退款
        orderMapper.updateById(order);

        // 释放车辆库存，回归在售状态
        CarSku sku = carSkuMapper.selectById(order.getSkuId());
        if (sku != null) {
            sku.setStatus(2); // 2-在售
            carSkuMapper.updateById(sku);
        }
        pushOrderNotice(
                "order",
                "用户已发起退款",
                String.format("订单 %s 已由用户取消并退款，请及时回访确认。", buildDisplayOrderNo(order)),
                "/admin/orders",
                "medium",
                "去订单页复核"
        );
        return true;
    }

    /**
     * B端：统一状态流转入口
     * 1->2: 结清尾款
     * 2->3: 开始过户
     * 3->4: 交易完成（车辆已售）
     * 1/2/3->6: 退款退车（释放库存）
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean updateStatusByAdmin(Long orderId, Integer newStatus) {
        TradeOrder order = orderMapper.selectById(orderId);
        if (order == null || newStatus == null) {
            return false;
        }
        Integer current = order.getStatus();
        if (current == null) {
            return false;
        }

        if (newStatus == 2 && current == 1) {
            order.setStatus(2);
            orderMapper.updateById(order);
            return true;
        }
        if (newStatus == 3 && current == 2) {
            order.setStatus(3);
            orderMapper.updateById(order);
            return true;
        }
        if (newStatus == 4 && current == 3) {
            order.setStatus(4);
            orderMapper.updateById(order);
            CarSku sku = carSkuMapper.selectById(order.getSkuId());
            if (sku != null) {
                sku.setStatus(4); // 已售
                carSkuMapper.updateById(sku);
            }
            return true;
        }
        if (newStatus == 6 && (current == 1 || current == 2 || current == 3)) {
            order.setStatus(6);
            orderMapper.updateById(order);
            CarSku sku = carSkuMapper.selectById(order.getSkuId());
            if (sku != null) {
                sku.setStatus(2); // 释放回在售
                carSkuMapper.updateById(sku);
            }
            pushOrderNotice(
                    "order",
                    "订单已退款并释放库存",
                    String.format("订单 %s 状态已更新为退款，库存已回到在售。", buildDisplayOrderNo(order)),
                    "/admin/orders",
                    "medium",
                    "去订单页复核"
            );
            return true;
        }
        return false;
    }

    public List<TradeOrder> list() {
        return list(null);
    }

    public List<TradeOrder> list(Long storeId) {
        // 1. 获取当前登录的系统用户
        SysUser currentUser = UserContext.getUser();
        QueryWrapper<TradeOrder> wrapper = new QueryWrapper<>();

        // 2. 数据隔离逻辑：
        // 非 ADMIN 永远只能看自己门店；ADMIN 可按 storeId 筛选
        if (currentUser != null && !"ADMIN".equals(currentUser.getRole())) {
            wrapper.eq("store_id", currentUser.getStoreId());
        } else if (storeId != null) {
            wrapper.eq("store_id", storeId);
        }

        // 3. 无论什么权限，都按时间倒序排列
        wrapper.orderByDesc("create_time");

        List<TradeOrder> orders = orderMapper.selectList(wrapper);
        for (TradeOrder order : orders) {
            order.setDisplayOrderNo(buildDisplayOrderNo(order));
        }
        return orders;
    }

    /**
     * C端：查询当前登录用户自己的订单
     */
    public List<TradeOrder> listMyOrders(Long userId) {
        if (userId == null) {
            return List.of();
        }
        QueryWrapper<TradeOrder> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId).orderByDesc("create_time");
        List<TradeOrder> orders = orderMapper.selectList(wrapper);
        for (TradeOrder order : orders) {
            enrichOrderForC(order);
        }
        return orders;
    }

    /**
     * C端：查询当前登录用户的订单详情
     */
    public TradeOrder getMyOrderDetail(Long orderId, Long userId) {
        if (orderId == null || userId == null) {
            return null;
        }
        TradeOrder order = orderMapper.selectById(orderId);
        if (order == null || !userId.equals(order.getUserId())) {
            return null;
        }
        enrichOrderForC(order);
        return order;
    }

    /**
     * C端：保存当前用户预约到店信息
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean saveMyAppointment(Long orderId, Long userId, LocalDateTime appointmentTime, String appointmentRemark) {
        if (orderId == null || userId == null || appointmentTime == null) {
            return false;
        }
        TradeOrder order = orderMapper.selectById(orderId);
        if (order == null || !userId.equals(order.getUserId())) {
            return false;
        }
        order.setAppointmentTime(appointmentTime);
        order.setAppointmentRemark(appointmentRemark);
        order.setAppointmentUpdateTime(LocalDateTime.now());
        return orderMapper.updateById(order) > 0;
    }

    private void enrichOrderForC(TradeOrder order) {
        if (order == null) {
            return;
        }
        // 订单表字段是 sku_id，但 C 端详情路由使用 carId 命名
        order.setCarId(order.getSkuId());
        // 为 C 端订单页面补齐车型摘要信息
        CarSkuVO car = carSkuMapper.selectCarDetailById(order.getSkuId());
        if (car != null) {
            order.setCarBrand(car.getBrand());
            order.setCarName(car.getSpuName() != null ? car.getSpuName() : car.getTitle());
            order.setCarCover(extractCoverImage(car.getImages()));
            order.setStoreName(car.getStoreName());
            order.setStoreAddress(car.getDetailAddress());
            order.setStorePhone(car.getContactPhone());
        }
        order.setDisplayOrderNo(buildDisplayOrderNo(order));
    }

    private String buildDisplayOrderNo(TradeOrder order) {
        String raw = order.getOrderNo();
        if (raw != null && !raw.trim().isEmpty()) {
            String normalized = raw.trim();
            if (normalized.matches("(?i)^no\\.?\\s*\\d+$")) {
                return String.format("AMX-%06d", order.getId());
            }
            return normalized;
        }
        return String.format("AMX-%06d", order.getId());
    }

    private String extractCoverImage(String images) {
        if (images == null || images.isBlank() || "null".equalsIgnoreCase(images.trim())) {
            return null;
        }
        String normalized = images.trim();
        if (!normalized.startsWith("[")) {
            return normalized;
        }
        int firstQuote = normalized.indexOf('"');
        if (firstQuote < 0) {
            return null;
        }
        int secondQuote = normalized.indexOf('"', firstQuote + 1);
        if (secondQuote < 0) {
            return null;
        }
        String first = normalized.substring(firstQuote + 1, secondQuote).trim();
        return first.isEmpty() ? null : first;
    }

    private void pushOrderNotice(String type, String title, String body, String link, String level, String actionText) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", type);
            payload.put("title", title);
            payload.put("body", body);
            payload.put("link", link);
            payload.put("level", level);
            payload.put("actionText", actionText);
            payload.put("ts", System.currentTimeMillis());
            AdminWebSocketServer.sendNotice(objectMapper.writeValueAsString(payload));
        } catch (Exception e) {
            log.warn("推送后台订单通知失败: title={}", title, e);
        }
    }

    public TradeOrder getById(Long id) { return orderMapper.selectById(id); }
    public void updateById(TradeOrder order) { orderMapper.updateById(order); }
}
