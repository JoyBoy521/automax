package com.automax.mall.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("trade_order")
public class TradeOrder {
        @TableId(type = IdType.AUTO)
        private Long id;

        private String orderNo;
        private Long userId;

        // 【新增】：对应数据库的 store_id 字段
        private Long storeId;

        private Long skuId;

        private Integer status; // 1-已锁车, 2-已成交
        private LocalDateTime createTime;
        @com.baomidou.mybatisplus.annotation.TableField("pay_amount")
        private BigDecimal payAmount;  // 实际支付金额(意向金)

        private BigDecimal totalAmount; // 车辆成交总价
        private LocalDateTime appointmentTime;
        private String appointmentRemark;
        private LocalDateTime appointmentUpdateTime;

        // 前端路由参数统一使用 carId，避免 skuId 命名歧义
        @TableField(exist = false)
        private Long carId;

        @TableField(exist = false)
        private String carBrand;

        @TableField(exist = false)
        private String carName;

        @TableField(exist = false)
        private String carCover;

        @TableField(exist = false)
        private String displayOrderNo;

        @TableField(exist = false)
        private String storeName;

        @TableField(exist = false)
        private String storeAddress;

        @TableField(exist = false)
        private String storePhone;
}
