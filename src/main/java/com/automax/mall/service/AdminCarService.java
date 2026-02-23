package com.automax.mall.service;

import com.automax.mall.dto.CarAddDTO;
import com.automax.mall.entity.CarLead;
import com.automax.mall.entity.CarSku;
import com.automax.mall.entity.SysUser;
import com.automax.mall.mapper.CarSkuMapper;
import com.automax.mall.mapper.TradeOrderMapper;
import com.automax.mall.utils.UserContext;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class AdminCarService {

    @Autowired
    private CarSkuMapper carSkuMapper;

    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private com.automax.mall.mapper.CarLeadMapper carLeadMapper;
    @Autowired
    private TradeOrderMapper tradeOrderMapper;

    public List<CarSku> listCars(SysUser currentUser, Long storeId) {
        QueryWrapper<CarSku> wrapper = new QueryWrapper<>();
        if (currentUser != null && !"ADMIN".equals(currentUser.getRole())) {
            wrapper.eq("store_id", currentUser.getStoreId());
        } else if (storeId != null) {
            wrapper.eq("store_id", storeId);
        }
        wrapper.orderByDesc("create_time");
        return carSkuMapper.selectList(wrapper);
    }
    /**
     * 🌟 亮点：动态获取数据库车型列表
     * 解决你提到的“车型全称是静态”的问题
     */
    public List<Map<String, Object>> getAllSpus() {
        // 直接从 car_spu 表中查询 ID、车型名称和品牌
        return carSkuMapper.selectMaps(
                new QueryWrapper<CarSku>()
                        .select("id", "spu_name as name", "brand")
                        .setEntityClass(CarSku.class)
                        .last("FROM car_spu")
        );
    }

    @Transactional(rollbackFor = Exception.class)
    public void addCar(CarAddDTO dto) throws JsonProcessingException {
        SysUser currentUser = UserContext.getUser();
        CarSku car = new CarSku();

        // 1. 设置 ID (用于编辑模式)
        if (dto.getId() != null) {
            car.setId(dto.getId());
        }

        // 2. 基础信息赋值
        // 🌟 品牌处理：如果前端传了品牌，我们将其存入 title 字段，确保首页能够显示出来
        String brandPrefix = (dto.getBrand() != null && !dto.getBrand().isEmpty()) ? dto.getBrand() : "";
        car.setTitle(brandPrefix + " " + (dto.getTitle() != null ? dto.getTitle() : ""));

        car.setVinCode(dto.getVinCode());
        car.setSpuId(dto.getSpuId());
        if (currentUser != null && !"ADMIN".equals(currentUser.getRole())) {
            car.setStoreId(currentUser.getStoreId());
        } else {
            car.setStoreId(dto.getStoreId() != null ? dto.getStoreId() : 1L);
        }
        car.setMileage(dto.getMileage());
        car.setShowPrice(dto.getShowPrice());
        car.setStatus(2); // 默认在售
        car.setFirstRegDate(dto.getFirstRegDate());
        car.setEmissionStd(dto.getEmissionStd());
        car.setThirdPartyReport(dto.getThirdPartyReport());

        // 3. 序列化动态 JSON 字段 (保留原功能)
        car.setImages(objectMapper.writeValueAsString(dto.getImages()));
        car.setMajorRisks(objectMapper.writeValueAsString(dto.getMajorRisks()));
        car.setFlaws(objectMapper.writeValueAsString(dto.getFlaws()));

        // 4. 🌟 智能打分算法 (保留原功能)
        int baseScore = 100;
        List<Map<String, String>> flaws = dto.getFlaws();
        if (flaws != null && !flaws.isEmpty()) {
            for (Map<String, String> flaw : flaws) {
                String desc = flaw.getOrDefault("desc", "");
                if (desc.contains("凹陷") || desc.contains("破损") || desc.contains("钣金") || desc.contains("变形")) {
                    baseScore -= 6;
                } else if (desc.contains("更换")) {
                    baseScore -= 4;
                } else {
                    baseScore -= 2;
                }
            }
        }
        car.setCarScore(Math.max(60, baseScore));

        // 5. 🌟 核心修复：定金逻辑必须在执行 SQL 之前完成，否则存不进去
        if (dto.getDepositAmount() != null && dto.getDepositAmount().compareTo(BigDecimal.ZERO) > 0) {
            car.setDepositAmount(dto.getDepositAmount());
        } else if (dto.getShowPrice() != null) {
            double price = dto.getShowPrice().doubleValue();
            if (price < 10.0) {
                car.setDepositAmount(new BigDecimal("500.00"));
            } else if (price < 30.0) {
                car.setDepositAmount(new BigDecimal("2000.00"));
            } else {
                car.setDepositAmount(new BigDecimal("5000.00"));
            }
        }

        // 6. 执行持久化
        if (car.getId() == null) {
            carSkuMapper.insert(car);
        } else {
            carSkuMapper.updateById(car);
        }
        if (dto.getLeadId() != null) {
            CarLead lead = new CarLead();
            lead.setId(dto.getLeadId());
            lead.setStatus(4); // 4 = 成功收购入库
            carLeadMapper.updateById(lead); // 别忘了注入 carLeadMapper
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public String deleteCar(Long carId) {
        SysUser currentUser = UserContext.getUser();
        if (currentUser == null) {
            return "请先登录";
        }
        CarSku car = carSkuMapper.selectById(carId);
        if (car == null) {
            return "车辆不存在或已删除";
        }
        if (!"ADMIN".equals(currentUser.getRole())) {
            if (currentUser.getStoreId() == null || !currentUser.getStoreId().equals(car.getStoreId())) {
                return "无权删除其他门店车辆";
            }
        }

        Long orderCount = tradeOrderMapper.selectCount(
                new QueryWrapper<com.automax.mall.entity.TradeOrder>()
                        .eq("sku_id", carId)
                        .in("status", 1, 2, 3, 4)
        );
        if (orderCount != null && orderCount > 0) {
            return "该车辆已有关联订单，不能删除";
        }

        carSkuMapper.deleteById(carId);
        return null;
    }
}
