package com.automax.mall.controller;

import com.automax.mall.dto.CarAddDTO;
import com.automax.mall.service.AdminCarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/cars")
@CrossOrigin
public class AdminCarController {

    @Autowired
    private AdminCarService adminCarService;

    /**
     * 🌟 修复后的动态 SPU 接口
     */
    @GetMapping("/spu/list")
    public Map<String, Object> getSpuList() {
        return Map.of("code", 200, "success", true, "data", adminCarService.getAllSpus());
    }

    @PostMapping("/add")
    public Map<String, Object> addCar(@RequestBody CarAddDTO carAddDTO) {
        try {
            adminCarService.addCar(carAddDTO);
            return Map.of("code", 200, "success", true, "msg", "车辆档案上架成功！");
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("code", 500, "success", false, "msg", "上架失败：" + e.getMessage());
        }
    }
}