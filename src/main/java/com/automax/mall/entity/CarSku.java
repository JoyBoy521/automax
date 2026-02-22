package com.automax.mall.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("car_sku")
public class CarSku {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String title;    // 🌟 新增：车辆标题
    private String vinCode;
    private Long spuId;
    private Long storeId;
    private BigDecimal mileage;
    private BigDecimal showPrice;
    private Integer status;

    private String images;
    private String firstRegDate;
    private String emissionStd;
    private Integer carScore;
    private String majorRisks;
    private String flaws;

    @Version
    private Integer version;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    // 🌟 新增：动态阶梯定金
    private BigDecimal depositAmount;
    // 🌟 新增：第三方权威检测报告（如查博士链接）
    private String thirdPartyReport;
}