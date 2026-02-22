package com.automax.mall.controller;

import com.automax.mall.dto.LeadSubmitDTO;
import com.automax.mall.service.CarLeadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/leads")
public class LeadController {

    @Autowired
    private CarLeadService carLeadService;

    @PostMapping("/submit")
    public Map<String, Object> submitSellCarLead(@RequestBody LeadSubmitDTO dto) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (dto.getUserPhone() == null || dto.getIntentionModel() == null) {
                response.put("code", 400);
                response.put("msg", "手机号和车型不能为空");
                return response;
            }

            carLeadService.submitLead(dto);

            response.put("code", 200);
            response.put("msg", "提交成功");
        } catch (Exception e) {
            e.printStackTrace();
            response.put("code", 500);
            response.put("msg", "系统异常");
        }
        return response;
    }
}