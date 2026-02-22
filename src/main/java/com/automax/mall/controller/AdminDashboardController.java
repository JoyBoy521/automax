package com.automax.mall.controller;

import com.automax.mall.entity.CarLead;
import com.automax.mall.entity.CarSku;
import com.automax.mall.entity.CarStore;
import com.automax.mall.entity.TradeOrder;
import com.automax.mall.mapper.CarLeadMapper;
import com.automax.mall.mapper.CarSkuMapper;
import com.automax.mall.mapper.CarStoreMapper;
import com.automax.mall.mapper.TradeOrderMapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalTime;
import java.math.RoundingMode;

@RestController
@RequestMapping("/api/admin/dashboard")
@CrossOrigin // 🌟 解决跨域
public class AdminDashboardController {

    @Autowired private CarSkuMapper carSkuMapper;
    @Autowired private TradeOrderMapper orderMapper;
    @Autowired private CarLeadMapper leadMapper;
    private Map<String, Object> buildReminder(long id, String title, String type, String desc, String link, String actionText, String level) {
        return Map.of(
                "id", id,
                "title", title,
                "type", type,
                "desc", desc,
                "link", link,
                "actionText", actionText,
                "level", level
        );
    }

    @GetMapping("/stats")
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> result = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth()).atTime(LocalTime.MAX);
        // ================= 1. 顶部四大核心指标 =================
        Map<String, Object> stats = new HashMap<>();



        // 计算总交易意向金流水
        List<TradeOrder> allOrders = orderMapper.selectList(null);
        BigDecimal monthlyRevenue = allOrders.stream()
                .filter(o -> o.getCreateTime() != null
                        && !o.getCreateTime().isBefore(monthStart)
                        && !o.getCreateTime().isAfter(monthEnd)
                        && Integer.valueOf(2).equals(o.getStatus()))
                .map(o -> o.getTotalAmount() != null ? o.getTotalAmount() : o.getPayAmount())
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long monthlyLeads = leadMapper.selectCount(
                new QueryWrapper<CarLead>()
                        .between("create_time", monthStart, monthEnd)
        );

        // 🌟 库龄分析逻辑（修复 NPE 隐患）
        List<CarSku> allSkus = carSkuMapper.selectList(new QueryWrapper<CarSku>().in("status", 1, 2));
        int staleCount = 0;
        int healthyCount = 0;
        int warningCount = 0;
        for (CarSku sku : allSkus) {
            // 💡 核心修复：增加 null 判断，如果数据库没有存创建时间，则跳过或设为0
            if (sku.getCreateTime() != null) {
                long days = ChronoUnit.DAYS.between(sku.getCreateTime(), now);
                if (days <= 30) {
                    healthyCount++;
                } else if (days <= 60) {
                    warningCount++;
                } else {
                    staleCount++;
                }
            }
        }
        stats.put("inventoryCount", allSkus.size());

        stats.put("newLeads", monthlyLeads);
        stats.put("totalRevenue", monthlyRevenue.setScale(0, RoundingMode.HALF_UP));
        stats.put("staleWarning", staleCount); // 滞销预警数
        result.put("stats", stats);

        // ================= 2. 品牌库存分布 (🌟 补全) =================
        // 这里提供前端 BarChart 需要的品牌数据
        result.put("brandData", carSkuMapper.selectTopBrandInventory());

        // ================= 3. 库龄健康分布（真实计算） =================
        List<Map<String, Object>> inventoryAgeData = List.of(
                Map.of("name", "健康", "value", healthyCount),
                Map.of("name", "预警", "value", warningCount),
                Map.of("name", "滞销", "value", staleCount)
        );
        result.put("inventoryAgeData", inventoryAgeData);


        // ================= 3. 待办与预警提醒 (🌟 升级为带链接的 Reminders) =================
        List<Map<String, Object>> reminders = new ArrayList<>();

        // A. 滞销提醒
        if(staleCount > 0) {
            reminders.add(buildReminder(
                    1,
                    staleCount + " 辆车库存严重滞销",
                    "stale",
                    "入库已超过 60 天，资金占用严重，建议立即调优。",
                    "/admin",
                    "去处理滞销车辆",
                    "high"
            ));
        }

        // B. 订单核销提醒
        long pendingOrders = orderMapper.selectCount(new QueryWrapper<TradeOrder>().eq("status", 1));
        if(pendingOrders > 0) {
            reminders.add(buildReminder(
                    2,
                    "有 " + pendingOrders + " 笔订单待核销",
                    "order",
                    "客户已支付意向金，请尽快联系线下看车并确认尾款。",
                    "/admin/orders",
                    "去订单页处理",
                    "high"
            ));
        }

        // C. 新线索提醒
        long rawLeads = leadMapper.selectCount(new QueryWrapper<CarLead>().eq("status", 1));
        if(rawLeads > 0) {
            reminders.add(buildReminder(
                    3,
                    "有 " + rawLeads + " 条新的收车请求待审核",
                    "lead",
                    "请尽快进入收车审核管理分配跟进人并启动评估。",
                    "/admin/leads",
                    "去收车审核处理",
                    "medium"
            ));
        }
        // D. 日常经营任务（无预警时也给管理员明确入口）
        reminders.add(buildReminder(
                4,
                "巡检今日新增在售车辆",
                "stale",
                "检查新上架车辆资料完整度与图片质量，避免影响转化。",
                "/admin",
                "去车辆列表巡检",
                "low"
        ));
        reminders.add(buildReminder(
                5,
                "复核本月成交订单台账",
                "order",
                "确保订单状态、支付金额与门店跟进记录一致。",
                "/admin/orders",
                "去订单台账复核",
                "low"
        ));

        result.put("reminders", reminders);

        // ================= 4. 7日趋势分析 (意向金 + 模拟成交) =================
        List<Map<String, Object>> trendData = new ArrayList<>();

        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);


            // 真实统计当天的意向金流水
            BigDecimal dailyMoney = allOrders.stream()
                    .filter(o -> o.getCreateTime() != null && o.getCreateTime().toLocalDate().equals(date))
                    .map(TradeOrder::getPayAmount)
                    .filter(java.util.Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> trendItem = new HashMap<>();
            trendItem.put("name", date.format(DateTimeFormatter.ofPattern("MM-dd")));
            trendItem.put("revenue", dailyMoney.setScale(0, RoundingMode.HALF_UP));
            trendData.add(trendItem);
        }
        result.put("trendData", trendData);

        return Map.of("code", 200, "success", true, "data", result);
    }
}