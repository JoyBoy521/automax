package com.automax.mall.controller;

import com.automax.mall.entity.CarLead;
import com.automax.mall.entity.CarSku;
import com.automax.mall.entity.CarStore;
import com.automax.mall.entity.SysUser;
import com.automax.mall.entity.TradeOrder;
import com.automax.mall.mapper.CarLeadMapper;
import com.automax.mall.mapper.CarSkuMapper;
import com.automax.mall.mapper.CarStoreMapper;
import com.automax.mall.mapper.TradeOrderMapper;
import com.automax.mall.utils.UserContext;
import com.automax.mall.vo.CarSkuVO;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/dashboard")
@CrossOrigin
public class AdminDashboardController {

    @Autowired
    private CarSkuMapper carSkuMapper;
    @Autowired
    private TradeOrderMapper orderMapper;
    @Autowired
    private CarLeadMapper leadMapper;
    @Autowired
    private CarStoreMapper carStoreMapper;

    @GetMapping("/stats")
    public Map<String, Object> getDashboardStats(
            @RequestParam(required = false) Long storeId,
            @RequestParam(defaultValue = "revenue") String metric
    ) {
        SysUser currentUser = UserContext.getUser();
        if (currentUser == null) {
            return Map.of("code", 401, "success", false, "msg", "请先登录");
        }

        boolean isAdmin = "ADMIN".equals(currentUser.getRole());
        Long scopedStoreId = isAdmin ? storeId : currentUser.getStoreId();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth()).atTime(LocalTime.MAX);

        List<TradeOrder> scopedOrders = queryOrders(scopedStoreId);
        List<CarSku> scopedSkus = querySkus(scopedStoreId);
        List<CarLead> scopedLeads = queryLeads(scopedStoreId);

        Map<String, Object> result = new HashMap<>();
        result.put("stats", buildStats(scopedOrders, scopedSkus, scopedLeads, monthStart, monthEnd, now));
        result.put("inventoryAgeData", buildInventoryAge(scopedSkus, now));
        result.put("brandData", buildBrandData(scopedSkus));
        boolean multiStoreTrend = isAdmin && scopedStoreId == null;
        if (multiStoreTrend) {
            List<Map<String, Object>> ranking = buildStoreRanking(monthStart, monthEnd);
            List<Map<String, Object>> topStores = ranking.stream().limit(5).collect(Collectors.toList());
            result.put("trendData", buildMultiStoreTrend(topStores, metric));
            result.put("trendStores", topStores.stream().map(s -> Map.of(
                    "storeId", s.get("storeId"),
                    "storeName", s.get("storeName"),
                    "dataKey", "s" + s.get("storeId")
            )).collect(Collectors.toList()));
            result.put("trendMode", "multi");
        } else {
            result.put("trendData", buildTrend(scopedOrders, scopedLeads, metric));
            result.put("trendStores", List.of());
            result.put("trendMode", "single");
        }
        result.put("selectedMetric", normalizeMetric(metric));
        result.put("availableMetrics", List.of(
                Map.of("key", "revenue", "label", "意向金趋势"),
                Map.of("key", "orders", "label", "订单趋势"),
                Map.of("key", "leads", "label", "收车量趋势")
        ));
        result.put("reminders", buildReminders(scopedOrders, scopedSkus, scopedLeads));

        Map<String, Object> scope = new HashMap<>();
        scope.put("isAdmin", isAdmin);
        scope.put("canSwitchStore", isAdmin);
        scope.put("selectedStoreId", scopedStoreId);
        result.put("scope", scope);

        if (isAdmin) {
            result.put("storeOptions", carStoreMapper.selectList(new QueryWrapper<CarStore>()
                    .select("id", "store_name")
                    .orderByAsc("id")));
            result.put("storeRanking", buildStoreRanking(monthStart, monthEnd));
        } else {
            result.put("storeRanking", List.of(buildMyStoreRankingItem(currentUser.getStoreId(), monthStart, monthEnd)));
        }

        return Map.of("code", 200, "success", true, "data", result);
    }

    private List<TradeOrder> queryOrders(Long storeId) {
        QueryWrapper<TradeOrder> wrapper = new QueryWrapper<>();
        if (storeId != null) {
            wrapper.eq("store_id", storeId);
        }
        return orderMapper.selectList(wrapper);
    }

    private List<CarSku> querySkus(Long storeId) {
        QueryWrapper<CarSku> wrapper = new QueryWrapper<>();
        if (storeId != null) {
            wrapper.eq("store_id", storeId);
        }
        return carSkuMapper.selectList(wrapper);
    }

    private List<CarLead> queryLeads(Long storeId) {
        QueryWrapper<CarLead> wrapper = new QueryWrapper<>();
        if (storeId != null) {
            wrapper.eq("store_id", storeId);
        }
        return leadMapper.selectList(wrapper);
    }

    private Map<String, Object> buildStats(
            List<TradeOrder> orders,
            List<CarSku> skus,
            List<CarLead> leads,
            LocalDateTime monthStart,
            LocalDateTime monthEnd,
            LocalDateTime now
    ) {
        BigDecimal monthlyRevenue = orders.stream()
                .filter(o -> o.getCreateTime() != null
                        && !o.getCreateTime().isBefore(monthStart)
                        && !o.getCreateTime().isAfter(monthEnd)
                        && Integer.valueOf(2).equals(o.getStatus()))
                .map(o -> o.getTotalAmount() != null ? o.getTotalAmount() : o.getPayAmount())
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long monthlyLeads = leads.stream()
                .filter(l -> l.getCreateTime() != null
                        && !l.getCreateTime().isBefore(monthStart)
                        && !l.getCreateTime().isAfter(monthEnd))
                .count();

        int staleCount = 0;
        for (CarSku sku : skus) {
            if (sku.getCreateTime() == null) {
                continue;
            }
            long days = ChronoUnit.DAYS.between(sku.getCreateTime(), now);
            if (days > 60) {
                staleCount++;
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("inventoryCount", skus.stream().filter(s -> s.getStatus() != null && (s.getStatus() == 1 || s.getStatus() == 2)).count());
        stats.put("newLeads", monthlyLeads);
        stats.put("totalRevenue", monthlyRevenue.setScale(0, RoundingMode.HALF_UP));
        stats.put("staleWarning", staleCount);
        return stats;
    }

    private List<Map<String, Object>> buildInventoryAge(List<CarSku> skus, LocalDateTime now) {
        int healthy = 0;
        int warning = 0;
        int stale = 0;
        for (CarSku sku : skus) {
            if (sku.getStatus() == null || (sku.getStatus() != 1 && sku.getStatus() != 2) || sku.getCreateTime() == null) {
                continue;
            }
            long days = ChronoUnit.DAYS.between(sku.getCreateTime(), now);
            if (days <= 30) {
                healthy++;
            } else if (days <= 60) {
                warning++;
            } else {
                stale++;
            }
        }
        return List.of(
                Map.of("name", "健康", "value", healthy),
                Map.of("name", "预警", "value", warning),
                Map.of("name", "滞销", "value", stale)
        );
    }

    private List<Map<String, Object>> buildBrandData(List<CarSku> scopedSkus) {
        Map<String, Long> counter = new HashMap<>();
        for (CarSku sku : scopedSkus) {
            if (sku.getStatus() == null || (sku.getStatus() != 1 && sku.getStatus() != 2)) {
                continue;
            }
            CarSkuVO detail = carSkuMapper.selectCarDetailById(sku.getId());
            String brand = detail != null && detail.getBrand() != null ? detail.getBrand() : "未知";
            counter.put(brand, counter.getOrDefault(brand, 0L) + 1);
        }
        return counter.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(5)
                .map(e -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("name", e.getKey());
                    row.put("count", e.getValue());
                    return row;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildTrend(List<TradeOrder> orders, List<CarLead> leads, String metric) {
        String mode = normalizeMetric(metric);
        List<Map<String, Object>> trend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", date.toString().substring(5));
            if ("orders".equals(mode)) {
                long count = orders.stream()
                        .filter(o -> o.getCreateTime() != null && o.getCreateTime().toLocalDate().equals(date))
                        .count();
                row.put("revenue", count);
            } else if ("leads".equals(mode)) {
                long count = leads.stream()
                        .filter(l -> l.getCreateTime() != null && l.getCreateTime().toLocalDate().equals(date))
                        .count();
                row.put("revenue", count);
            } else {
                BigDecimal daily = orders.stream()
                        .filter(o -> o.getCreateTime() != null && o.getCreateTime().toLocalDate().equals(date))
                        .map(TradeOrder::getPayAmount)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                row.put("revenue", daily.setScale(0, RoundingMode.HALF_UP));
            }
            trend.add(row);
        }
        return trend;
    }

    private List<Map<String, Object>> buildMultiStoreTrend(List<Map<String, Object>> topStores, String metric) {
        String mode = normalizeMetric(metric);
        List<TradeOrder> allOrders = orderMapper.selectList(null);
        List<CarLead> allLeads = leadMapper.selectList(null);
        List<Map<String, Object>> trend = new ArrayList<>();

        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", date.toString().substring(5));

            for (Map<String, Object> store : topStores) {
                Long storeId = ((Number) store.get("storeId")).longValue();
                String key = "s" + storeId;
                if ("orders".equals(mode)) {
                    long count = allOrders.stream()
                            .filter(o -> Objects.equals(o.getStoreId(), storeId))
                            .filter(o -> o.getCreateTime() != null && o.getCreateTime().toLocalDate().equals(date))
                            .count();
                    row.put(key, count);
                } else if ("leads".equals(mode)) {
                    long count = allLeads.stream()
                            .filter(l -> Objects.equals(l.getStoreId(), storeId))
                            .filter(l -> l.getCreateTime() != null && l.getCreateTime().toLocalDate().equals(date))
                            .count();
                    row.put(key, count);
                } else {
                    BigDecimal daily = allOrders.stream()
                            .filter(o -> Objects.equals(o.getStoreId(), storeId))
                            .filter(o -> o.getCreateTime() != null && o.getCreateTime().toLocalDate().equals(date))
                            .map(TradeOrder::getPayAmount)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    row.put(key, daily.setScale(0, RoundingMode.HALF_UP));
                }
            }
            trend.add(row);
        }
        return trend;
    }

    private List<Map<String, Object>> buildReminders(List<TradeOrder> orders, List<CarSku> skus, List<CarLead> leads) {
        long stale = skus.stream().filter(s -> s.getCreateTime() != null
                && s.getStatus() != null
                && (s.getStatus() == 1 || s.getStatus() == 2)
                && ChronoUnit.DAYS.between(s.getCreateTime(), LocalDateTime.now()) > 60).count();
        long pendingOrders = orders.stream().filter(o -> Integer.valueOf(1).equals(o.getStatus())).count();
        long rawLeads = leads.stream().filter(l -> Integer.valueOf(0).equals(l.getStatus())).count();

        List<Map<String, Object>> reminders = new ArrayList<>();
        if (stale > 0) {
            reminders.add(Map.of(
                    "id", 1,
                    "title", stale + " 辆车库存滞销预警",
                    "type", "stale",
                    "desc", "库存超过 60 天，建议优先调价或加速渠道曝光。",
                    "link", "/admin",
                    "actionText", "处理库存",
                    "level", "high"
            ));
        }
        if (pendingOrders > 0) {
            reminders.add(Map.of(
                    "id", 2,
                    "title", "有 " + pendingOrders + " 笔订单待跟进",
                    "type", "order",
                    "desc", "客户已付定金，请及时联系到店与尾款流程。",
                    "link", "/admin/orders",
                    "actionText", "去处理订单",
                    "level", "high"
            ));
        }
        if (rawLeads > 0) {
            reminders.add(Map.of(
                    "id", 3,
                    "title", "有 " + rawLeads + " 条收车线索待处理",
                    "type", "lead",
                    "desc", "建议先分配跟进人并更新评估状态。",
                    "link", "/admin/leads",
                    "actionText", "去处理线索",
                    "level", "medium"
            ));
        }
        if (reminders.isEmpty()) {
            reminders.add(Map.of(
                    "id", 4,
                    "title", "当前无高优先级预警",
                    "type", "order",
                    "desc", "可执行日常巡检：库存资料完整性、订单履约复核。",
                    "link", "/admin/dashboard",
                    "actionText", "查看看板",
                    "level", "low"
            ));
        }
        return reminders;
    }

    private List<Map<String, Object>> buildStoreRanking(LocalDateTime monthStart, LocalDateTime monthEnd) {
        List<CarStore> stores = carStoreMapper.selectList(new QueryWrapper<CarStore>().select("id", "store_name"));
        List<TradeOrder> allOrders = orderMapper.selectList(null);
        List<CarSku> allSkus = carSkuMapper.selectList(null);
        List<CarLead> allLeads = leadMapper.selectList(null);

        return stores.stream().map(store -> {
            Long sid = store.getId();
            BigDecimal revenue = allOrders.stream()
                    .filter(o -> Objects.equals(o.getStoreId(), sid)
                            && o.getCreateTime() != null
                            && !o.getCreateTime().isBefore(monthStart)
                            && !o.getCreateTime().isAfter(monthEnd)
                            && Integer.valueOf(2).equals(o.getStatus()))
                    .map(o -> o.getTotalAmount() != null ? o.getTotalAmount() : o.getPayAmount())
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            long orders = allOrders.stream().filter(o -> Objects.equals(o.getStoreId(), sid)).count();
            long inventory = allSkus.stream().filter(s -> Objects.equals(s.getStoreId(), sid) && s.getStatus() != null && (s.getStatus() == 1 || s.getStatus() == 2)).count();
            long leads = allLeads.stream()
                    .filter(l -> Objects.equals(l.getStoreId(), sid)
                            && l.getCreateTime() != null
                            && !l.getCreateTime().isBefore(monthStart)
                            && !l.getCreateTime().isAfter(monthEnd))
                    .count();
            Map<String, Object> row = new HashMap<>();
            row.put("storeId", sid);
            row.put("storeName", store.getStoreName());
            row.put("revenue", revenue.setScale(0, RoundingMode.HALF_UP));
            row.put("orderCount", orders);
            row.put("inventoryCount", inventory);
            row.put("leadCount", leads);
            return row;
        }).sorted((a, b) -> {
            BigDecimal r1 = (BigDecimal) a.get("revenue");
            BigDecimal r2 = (BigDecimal) b.get("revenue");
            return r2.compareTo(r1);
        }).collect(Collectors.toList());
    }

    private Map<String, Object> buildMyStoreRankingItem(Long storeId, LocalDateTime monthStart, LocalDateTime monthEnd) {
        if (storeId == null) {
            return Map.of("storeId", null, "storeName", "未分配门店", "revenue", BigDecimal.ZERO, "orderCount", 0, "inventoryCount", 0, "leadCount", 0);
        }
        List<Map<String, Object>> ranking = buildStoreRanking(monthStart, monthEnd);
        return ranking.stream()
                .filter(r -> Objects.equals(r.get("storeId"), storeId))
                .findFirst()
                .orElse(Map.of("storeId", storeId, "storeName", "门店", "revenue", BigDecimal.ZERO, "orderCount", 0, "inventoryCount", 0, "leadCount", 0));
    }

    private String normalizeMetric(String metric) {
        if ("orders".equals(metric) || "leads".equals(metric)) {
            return metric;
        }
        return "revenue";
    }
}
