package com.automax.mall.service;

import com.automax.mall.config.LoginInterceptor;
import com.automax.mall.entity.CarSku;
import com.automax.mall.entity.TradeOrder;
import com.automax.mall.mapper.CarSkuMapper;
import com.automax.mall.mapper.TradeOrderMapper;
import org.apache.catalina.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.redis.core.StringRedisTemplate;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.automax.mall.utils.UserContext;
import com.automax.mall.entity.SysUser;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    @Autowired private CarSkuMapper carSkuMapper;
    @Autowired private TradeOrderMapper orderMapper;
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
            redisTemplate.opsForZSet().add(ORDER_TIMEOUT_KEY, order.getOrderNo(), timeoutAt);
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
        if (order != null && (order.getStatus() == 1)) {
            order.setStatus(3); // 3-已取消
            orderMapper.updateById(order);

            // 释放车辆库存，回归在售状态
            CarSku sku = carSkuMapper.selectById(order.getSkuId());
            if (sku != null) {
                sku.setStatus(2); // 2-在售
                carSkuMapper.updateById(sku);
            }
            return true;
        }
        return false;
    }

    public List<TradeOrder> list() {
        // 1. 获取当前登录的系统用户
        SysUser currentUser = UserContext.getUser();
        QueryWrapper<TradeOrder> wrapper = new QueryWrapper<>();

        // 2. 核心隔离逻辑：
        // 如果不是 ADMIN（超级管理员），则强制只能看自己门店的订单数据
        if (currentUser != null && !"ADMIN".equals(currentUser.getRole())) {
            // STAFF 或 MANAGER 只能看自己 store_id 关联的数据
            wrapper.eq("store_id", currentUser.getStoreId());
        }

        // 3. 无论什么权限，都按时间倒序排列
        wrapper.orderByDesc("create_time");

        return orderMapper.selectList(wrapper);
    }
    public TradeOrder getById(Long id) { return orderMapper.selectById(id); }
    public void updateById(TradeOrder order) { orderMapper.updateById(order); }
}