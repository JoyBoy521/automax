package com.automax.mall.vo;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CarSkuVO {
    // 来自 SKU 表
    private Long id;
    private String vinCode;
    private BigDecimal mileage;
    private BigDecimal showPrice;
    private Integer status;
    private String images;

    // 来自 SPU 表 (联表获取)
    private String spuName;     // 全称：2021款 宝马 3系...
    private String brand;       // 品牌
    private String series;      // 车系
    private String gearbox;     // 变速箱

    // 来自 Store 表 (联表获取)
    private String storeName;   // 门店名称
    private String city;        // 所在城市
    private String detailAddress;
    private String contactPhone;
    private BigDecimal longitude;
    private BigDecimal latitude;
    private String firstRegDate;
    private String emissionStd;
    private Integer carScore;
    private String majorRisks; // MyBatisPlus 会自动将 JSON 映射为 String
    private String flaws;
    private String title; // 🌟 必须加这个
}
