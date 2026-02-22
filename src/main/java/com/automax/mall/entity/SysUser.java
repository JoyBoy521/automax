package com.automax.mall.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_user") // 🌟 核心修复：指向真实的表名 sys_user
public class SysUser {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String username;
    private String password;
    private String role; // ADMIN, MANAGER, STAFF, CUSTOMER
    private Long storeId; // 员工所属门店
    private LocalDateTime createTime;


    // 🌟 下面这两个字段数据库里没有，但是为了给前端展示用的
    @TableField(exist = false)
    private String managerName;
    private String phone;
    @TableField(exist = false)
    private String managerPhone;
}