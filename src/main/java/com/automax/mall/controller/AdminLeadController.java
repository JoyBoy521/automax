package com.automax.mall.controller;

import com.automax.mall.entity.CarLead;
import com.automax.mall.service.CarLeadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/leads")
public class AdminLeadController {

    @Autowired
    private CarLeadService carLeadService;

    // 获取线索列表
    @GetMapping("/list")
    public Map<String, Object> getLeadList(@RequestParam(required = false) Long storeId) {
        List<CarLead> list = carLeadService.getAllLeads(storeId);
        return Map.of("code", 200, "success", true, "data", list);
    }

    // 更改线索状态
    @PutMapping("/{id}/status")
    public Map<String, Object> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        carLeadService.updateLeadStatus(id, status);
        return Map.of("code", 200, "success", true, "msg", "状态更新成功");
    }
}
