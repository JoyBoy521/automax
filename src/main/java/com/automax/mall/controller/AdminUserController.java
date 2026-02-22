package com.automax.mall.controller;

import com.automax.mall.entity.SysUser;
import com.automax.mall.mapper.SysUserMapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin // 🌟 解决跨域问题
public class AdminUserController {

    @Autowired
    private SysUserMapper sysUserMapper;

    /**
     * 获取后台员工列表
     */
    @GetMapping("/list")
    public Map<String, Object> list() {
        // 🌟 细节：给前端返回用户列表时，为了安全，过滤掉密码字段，并把 C端的普通买家(CUSTOMER) 排除在外
        QueryWrapper<SysUser> queryWrapper = new QueryWrapper<>();
        queryWrapper.select(SysUser.class, info -> !info.getColumn().equals("password"))
                .ne("role", "CUSTOMER") // 排除买家
                .orderByDesc("create_time");

        List<SysUser> users = sysUserMapper.selectList(queryWrapper);
        return Map.of("code", 200, "success", true, "data", users);
    }

    /**
     * 更新员工角色与归属门店
     */
    @PostMapping("/updateRole")
    public Map<String, Object> updateRole(@RequestBody Map<String, Object> params) {
        Long userId = Long.valueOf(params.get("userId").toString());
        String role = params.get("role").toString();

        // 门店ID可能为空（未分配门店）
        Long storeId = null;
        if (params.get("storeId") != null && !params.get("storeId").toString().isEmpty()) {
            storeId = Long.valueOf(params.get("storeId").toString());
        }

        // 🌟 核心防御：如果是在页面上把他设为 MANAGER，执行防多店长冲突机制
        if ("MANAGER".equals(role) && storeId != null) {
            SysUser oldManager = sysUserMapper.selectOne(
                    new QueryWrapper<SysUser>()
                            .eq("store_id", storeId)
                            .eq("role", "MANAGER")
            );
            // 降级原店长（如果不是同一个人）
            if (oldManager != null && !oldManager.getId().equals(userId)) {
                oldManager.setRole("STAFF");
                sysUserMapper.updateById(oldManager);
            }
        }

        // 更新目标员工
        SysUser user = sysUserMapper.selectById(userId);
        if (user != null) {
            user.setRole(role);
            user.setStoreId(storeId);
            sysUserMapper.updateById(user);
            return Map.of("code", 200, "success", true, "msg", "权限更新成功");
        }

        return Map.of("code", 404, "success", false, "msg", "用户不存在");
    }

    @PostMapping("/save")
    public Map<String, Object> saveUser(@RequestBody SysUser user) {
        // 1. 新增时的默认逻辑
        if (user.getId() == null) {
            // 校验账号是否重复
            SysUser exist = sysUserMapper.selectOne(new QueryWrapper<SysUser>().eq("username", user.getUsername()));
            if (exist != null) {
                return Map.of("code", 400, "success", false, "msg", "该员工账号已存在");
            }
            // 默认初始密码为 123456
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                user.setPassword("123456");
            }
            if (user.getRole() == null) user.setRole("STAFF");
        } else {
            // 🌟 如果是编辑，且前端没有传密码，为了防止把原来密码覆盖为空，从数据库查一下老密码
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                SysUser oldData = sysUserMapper.selectById(user.getId());
                user.setPassword(oldData.getPassword());
            }
        }

        // 2. 🌟 核心防御：如果分配为 MANAGER，执行防多店长冲突机制
        if ("MANAGER".equals(user.getRole()) && user.getStoreId() != null) {
            SysUser oldManager = sysUserMapper.selectOne(
                    new QueryWrapper<SysUser>()
                            .eq("store_id", user.getStoreId())
                            .eq("role", "MANAGER")
            );
            // 将原店长降级（如果不是同一个人的话）
            if (oldManager != null && !oldManager.getId().equals(user.getId())) {
                oldManager.setRole("STAFF");
                sysUserMapper.updateById(oldManager);
            }
        }

        // 3. 执行数据库保存
        if (user.getId() == null) {
            sysUserMapper.insert(user);
            return Map.of("code", 200, "success", true, "msg", "新员工录入成功");
        } else {
            sysUserMapper.updateById(user);
            return Map.of("code", 200, "success", true, "msg", "员工档案已更新");
        }
    }
}