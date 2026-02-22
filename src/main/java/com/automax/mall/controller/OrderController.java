package com.automax.mall.controller;

import com.automax.mall.entity.TradeOrder;
import com.automax.mall.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin
public class OrderController {

    @Autowired
    private OrderService orderService;

    /**
     * C端：客户锁车下单
     */
    @PostMapping("/lock")
    public Map<String, Object> createOrder(@RequestBody Map<String, Object> params) {
        try {
            Long skuId = Long.valueOf(params.get("skuId").toString());
            boolean success = orderService.lockCar(skuId);
            return Map.of(
                    "code", success ? 200 : 500,
                    "success", success,
                    "msg", success ? "锁车成功，请尽快支付" : "下手慢了，车辆已被抢订"
            );
        } catch (Exception e) {
            return Map.of("code", 500, "success", false, "msg", "系统异常");
        }
    }

    /**
     * B端：获取所有订单列表（供管理员管理）
     */
    @GetMapping("/admin/list")
    public Map<String, Object> getAdminOrderList() {
        List<TradeOrder> list = orderService.list();
        return Map.of("code", 200, "data", list, "success", true);
    }

    /**
     * B端：管理员确认成交（线下到店付完款后）
     */
    @PutMapping("/admin/{id}/confirm")
    public Map<String, Object> confirmOrder(@PathVariable Long id) {
        boolean success = orderService.confirmOrder(id);
        return Map.of(
                "code", success ? 200 : 500,
                "success", success,
                "msg", success ? "确认成交成功，车辆已下架" : "操作失败，请检查订单状态"
        );
    }

    /**
     * B端：管理员取消订单（释放库存）
     */
    @PutMapping("/admin/{id}/cancel")
    public Map<String, Object> cancelOrderAdmin(@PathVariable Long id) {
        boolean success = orderService.cancelOrderAdmin(id);
        return Map.of(
                "code", success ? 200 : 500,
                "success", success,
                "msg", success ? "预定已取消，车辆已重新上架" : "操作失败"
        );
    }

    /**
     * C端：用户主动取消订单
     */
    @PutMapping("/cancel/{id}")
    public Map<String, Object> cancelOrder(@PathVariable Long id) {
        boolean success = orderService.cancelOrderAdmin(id); // 复用取消逻辑
        return Map.of(
                "code", success ? 200 : 500,
                "success", success,
                "msg", success ? "订单已取消，车辆已重新上架" : "无法取消该订单"
        );
    }
}