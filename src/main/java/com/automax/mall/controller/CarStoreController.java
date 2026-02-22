package com.automax.mall.controller;

import com.automax.mall.entity.CarStore;
import com.automax.mall.mapper.CarStoreMapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.automax.mall.entity.SysUser;
import com.automax.mall.mapper.SysUserMapper;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/stores")
@CrossOrigin // 🌟 解决跨域问题
public class CarStoreController {
    @Autowired private CarStoreMapper carStoreMapper;
    @Autowired private SysUserMapper sysUserMapper; // 🌟 注入用户 Mapper


    /**
     * 获取所有门店列表
     */
    @GetMapping("/list")
    public Map<String, Object> list() {
        List<CarStore> stores = carStoreMapper.selectList(new QueryWrapper<CarStore>().orderByDesc("create_time"));
        return Map.of("code", 200, "success", true, "data", stores);
    }

    /**
     * 保存或更新门店信息
     */
    @PostMapping("/save")
    public Map<String, Object> save(@RequestBody CarStore store) {
        if (store.getId() == null) {
            carStoreMapper.insert(store);
        } else {
            carStoreMapper.updateById(store);
        }
        return Map.of("code", 200, "success", true, "msg", "门店信息已同步");
    }

    /**
     * 删除门店
     */
    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        carStoreMapper.deleteById(id);
        return Map.of("code", 200, "success", true, "msg", "门店已移除");
    }

    @GetMapping("/candidates")
    public Map<String, Object> getCandidates() {
        QueryWrapper<SysUser> query = new QueryWrapper<>();
        query.eq("role", "STAFF"); // 只有员工才能被提拔为店长
        return Map.of("code", 200, "success", true, "data", sysUserMapper.selectList(query));
    }

    /**
     * 🌟 核心：任命店长
     */
    @PostMapping("/bind-manager")
    public Map<String, Object> bindManager(@RequestBody Map<String, Object> params) {
        Long storeId = Long.valueOf(params.get("storeId").toString());
        Long userId = Long.valueOf(params.get("userId").toString());

        SysUser user = sysUserMapper.selectById(userId);
        if (user != null) {
            user.setRole("MANAGER"); // 提拔为店长
            user.setStoreId(storeId); // 绑定到对应门店
            sysUserMapper.updateById(user);
            return Map.of("code", 200, "success", true, "msg", "店长任命成功");
        }
        return Map.of("code", 404, "success", false, "msg", "未找到该人员");
    }
}