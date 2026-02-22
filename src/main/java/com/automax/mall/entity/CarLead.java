package com.automax.mall.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("car_lead")
public class CarLead {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String userPhone;
    private String city;
    private String intentionModel;
    private BigDecimal mileage;
    private BigDecimal expectedPrice;
    private Long storeId;
    private Integer status;
    private LocalDateTime createTime;
}