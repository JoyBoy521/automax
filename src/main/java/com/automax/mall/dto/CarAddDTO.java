package com.automax.mall.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class CarAddDTO {
    private Long id;
    private String brand;    // 🌟 新增：用于接收前端录入的品牌
    private String title;
    private String vinCode;
    private Long spuId;
    private Long storeId;
    private BigDecimal mileage;
    private BigDecimal showPrice;
    private String firstRegDate;
    private String emissionStd;
    private List<String> images;
    private List<String> majorRisks;
    private List<Map<String, String>> flaws;
    private BigDecimal depositAmount;
    private String thirdPartyReport;
    private Long leadId; // 接收前端传来的线索ID
}