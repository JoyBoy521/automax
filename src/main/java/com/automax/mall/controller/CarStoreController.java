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

    @Autowired
    private CarStoreMapper carStoreMapper;

    @Autowired
    private SysUserMapper sysUserMapper; // 🌟 注入用户 Mapper

    /**
     * 获取所有门店列表 (🌟 升级版：带店长信息)
     */
    @GetMapping("/list")
    public Map<String, Object> list() {
        // 1. 查出所有门店
        List<CarStore> stores = carStoreMapper.selectList(new QueryWrapper<CarStore>().orderByDesc("create_time"));

        // 2. 遍历门店，组装店长信息 (毕设门店数量少，直接循环查库性能完全没问题)
        for (CarStore store : stores) {
            SysUser manager = sysUserMapper.selectOne(
                    new QueryWrapper<SysUser>()
                            .eq("store_id", store.getId())
                            .eq("role", "MANAGER")
            );

            if (manager != null) {
                store.setManagerName(manager.getUsername());
                store.setManagerPhone(manager.getPhone());
            } else {
                store.setManagerName("暂无店长");
                store.setManagerPhone("-");
            }
        }

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
        // 进阶优化：如果门店被删除，可以把该店的员工 store_id 置空，防止产生幽灵员工
        SysUser dummy = new SysUser();
        dummy.setStoreId(null);
        sysUserMapper.update(dummy, new QueryWrapper<SysUser>().eq("store_id", id));

        carStoreMapper.deleteById(id);
        return Map.of("code", 200, "success", true, "msg", "门店已移除");
    }

    /**
     * 获取可提拔为店长的候选人列表
     */
    @GetMapping("/candidates")
    public Map<String, Object> getCandidates() {
        QueryWrapper<SysUser> query = new QueryWrapper<>();
        query.eq("role", "STAFF"); // 只有员工才能被提拔为店长
        return Map.of("code", 200, "success", true, "data", sysUserMapper.selectList(query));
    }

    /**
     * 🌟 核心：任命店长 (升级版：防冲突机制)
     */
    @PostMapping("/bind-manager")
    public Map<String, Object> bindManager(@RequestBody Map<String, Object> params) {
        Long storeId = Long.valueOf(params.get("storeId").toString());
        Long userId = Long.valueOf(params.get("userId").toString());

        // 🌟 1. 核心防御：查出该门店现有的店长（如果有的话），将其自动降级为 STAFF
        SysUser oldManager = sysUserMapper.selectOne(
                new QueryWrapper<SysUser>()
                        .eq("store_id", storeId)
                        .eq("role", "MANAGER")
        );
        if (oldManager != null) {
            oldManager.setRole("STAFF");
            sysUserMapper.updateById(oldManager);
        }

        // 🌟 2. 任命新店长
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