package com.automax.mall.controller;

import com.automax.mall.entity.CarLead;
import com.automax.mall.service.CarLeadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/leads")
public class AdminLeadController {

    @Autowired
    private CarLeadService carLeadService;

    // 获取线索列表
    @GetMapping("/list")
    public List<CarLead> getLeadList() {
        return carLeadService.getAllLeads();
    }

    // 更改线索状态
    @PutMapping("/{id}/status")
    public String updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        carLeadService.updateLeadStatus(id, status);
        return "状态更新成功";
    }
}