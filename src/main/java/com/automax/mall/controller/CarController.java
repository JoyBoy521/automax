package com.automax.mall.controller;

import com.automax.mall.entity.CarSku;
import com.automax.mall.mapper.CarSkuMapper;
import com.automax.mall.vo.CarSkuVO;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal; // 🌟 必须导入这个包
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cars")
@CrossOrigin
public class CarController {

    @Autowired
    private CarSkuMapper carSkuMapper;

    /**
     * 🌟 修复版列表接口：解决 BigDecimal 比较类型错误问题
     */
    @GetMapping("/list")
    public Map<String, Object> getCarList(
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String orderField
    ) {
        // 1. 获取包含品牌信息的 VO 列表
        List<CarSkuVO> list = carSkuMapper.selectCarList();

        // 2. 预处理价格边界，减少循环内重复创建对象
        BigDecimal min = minPrice != null ? BigDecimal.valueOf(minPrice) : null;
        BigDecimal max = maxPrice != null ? BigDecimal.valueOf(maxPrice) : null;

        // 3. 使用 Stream 进行过滤
        List<CarSkuVO> filteredList = list.stream()
                .filter(car -> car.getStatus() != null && car.getStatus() == 2) // 只看在售
                .filter(car -> {
                    // 品牌过滤逻辑
                    if (brand == null || brand.isEmpty()) return true;
                    boolean brandMatch = car.getBrand() != null && car.getBrand().contains(brand);
                    boolean nameMatch = car.getSpuName() != null && car.getSpuName().contains(brand);
                    return brandMatch || nameMatch;
                })
                .filter(car -> {
                    // 🌟 修复：使用 compareTo 进行 BigDecimal 比较
                    if (min == null || car.getShowPrice() == null) return true;
                    return car.getShowPrice().compareTo(min) >= 0; // showPrice >= minPrice
                })
                .filter(car -> {
                    // 🌟 修复：使用 compareTo 进行 BigDecimal 比较
                    if (max == null || car.getShowPrice() == null) return true;
                    return car.getShowPrice().compareTo(max) <= 0; // showPrice <= maxPrice
                })
                .collect(Collectors.toList());

        // 4. 排序处理
        if ("price_asc".equals(orderField)) {
            filteredList.sort((a, b) -> a.getShowPrice().compareTo(b.getShowPrice()));
        } else if ("mileage_asc".equals(orderField)) {
            filteredList.sort((a, b) -> a.getMileage().compareTo(b.getMileage()));
        }

        return Map.of("code", 200, "data", filteredList, "success", true);
    }

    @GetMapping("/detail/{id}")
    public Map<String, Object> getCarDetail(@PathVariable Long id) {
        CarSkuVO car = carSkuMapper.selectCarDetailById(id);
        return Map.of("code", 200, "data", car, "success", true);
    }
}