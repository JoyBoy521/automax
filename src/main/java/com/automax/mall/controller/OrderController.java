package com.automax.mall.controller;

import com.automax.mall.entity.TradeOrder;
import com.automax.mall.service.OrderService;
import com.automax.mall.config.LoginInterceptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin
public class OrderController {
    private static final Logger log = LoggerFactory.getLogger(OrderController.class);

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
            log.error("锁车下单异常, params={}", params, e);
            return Map.of("code", 500, "success", false, "msg", "系统异常");
        }
    }

    /**
     * B端：获取所有订单列表（供管理员管理）
     */
    @GetMapping("/admin/list")
    public Map<String, Object> getAdminOrderList(@RequestParam(required = false) Long storeId) {
        List<TradeOrder> list = orderService.list(storeId);
        return Map.of("code", 200, "data", list, "success", true);
    }

    /**
     * C端：获取当前登录用户订单
     */
    @GetMapping("/my/list")
    public Map<String, Object> getMyOrderList() {
        Long userId = LoginInterceptor.userHolder.get();
        List<TradeOrder> list = orderService.listMyOrders(userId);
        return Map.of("code", 200, "data", list, "success", true);
    }

    /**
     * C端：获取当前用户的单个订单详情
     */
    @GetMapping("/my/{id}")
    public Map<String, Object> getMyOrderDetail(@PathVariable Long id) {
        Long userId = LoginInterceptor.userHolder.get();
        TradeOrder order = orderService.getMyOrderDetail(id, userId);
        if (order == null) {
            return Map.of("code", 404, "success", false, "msg", "订单不存在或无权限查看");
        }
        return Map.of("code", 200, "data", order, "success", true);
    }

    /**
     * C端：保存预约到店信息
     */
    @PutMapping("/my/{id}/appointment")
    public Map<String, Object> saveMyAppointment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> params
    ) {
        Long userId = LoginInterceptor.userHolder.get();
        if (userId == null) {
            return Map.of("code", 401, "success", false, "msg", "请先登录");
        }
        Object appointmentTimeRaw = params.get("appointmentTime");
        if (appointmentTimeRaw == null) {
            return Map.of("code", 400, "success", false, "msg", "预约时间不能为空");
        }

        try {
            LocalDateTime appointmentTime = LocalDateTime.parse(appointmentTimeRaw.toString());
            String appointmentRemark = params.get("appointmentRemark") == null ? null : params.get("appointmentRemark").toString();
            boolean success = orderService.saveMyAppointment(id, userId, appointmentTime, appointmentRemark);
            return Map.of(
                    "code", success ? 200 : 500,
                    "success", success,
                    "msg", success ? "预约信息已保存" : "保存失败，请检查订单归属或状态"
            );
        } catch (DateTimeParseException e) {
            return Map.of("code", 400, "success", false, "msg", "预约时间格式错误");
        }
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
        Long userId = LoginInterceptor.userHolder.get();
        boolean success = orderService.cancelOrderByUser(id, userId);
        return Map.of(
                "code", success ? 200 : 500,
                "success", success,
                "msg", success ? "订单已取消，车辆已重新上架" : "无法取消该订单，请检查订单状态或归属"
        );
    }

    /**
     * B端：统一状态流转接口（供后台订单管理页使用）
     */
    @PutMapping("/admin/{id}/status")
    public Map<String, Object> updateOrderStatus(@PathVariable Long id, @RequestParam Integer status) {
        boolean success = orderService.updateStatusByAdmin(id, status);
        return Map.of(
                "code", success ? 200 : 500,
                "success", success,
                "msg", success ? "订单状态更新成功" : "状态流转不合法或订单不存在"
        );
    }
}
