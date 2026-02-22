package com.automax.mall.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 门店实体类
 * 关联数据库 car_store 表
 */
@Data
@TableName("car_store")
public class CarStore {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String storeName;
    private String address;
    private Double lng;
    private Double lat;
    private String phone;
    private LocalDateTime createTime;
    @com.baomidou.mybatisplus.annotation.TableField(exist = false)
    private String managerName;

    @com.baomidou.mybatisplus.annotation.TableField(exist = false)
    private String managerPhone;
}