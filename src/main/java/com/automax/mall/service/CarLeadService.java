package com.automax.mall.service;

import com.automax.mall.dto.LeadSubmitDTO;
import com.automax.mall.entity.CarLead;
import com.automax.mall.mapper.CarLeadMapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CarLeadService {

    @Autowired
    private CarLeadMapper carLeadMapper;

    public void submitLead(LeadSubmitDTO dto) {
        CarLead lead = new CarLead();
        // 自动将 DTO 里的数据拷贝到 Entity 里
        BeanUtils.copyProperties(dto, lead);

        lead.setStatus(0); // 默认 0-待跟进
        lead.setCreateTime(LocalDateTime.now());

        carLeadMapper.insert(lead);
    }
    public List<CarLead> getAllLeads() {
        QueryWrapper<CarLead> queryWrapper = new QueryWrapper<>();
        queryWrapper.orderByDesc("create_time");
        return carLeadMapper.selectList(queryWrapper);
    }

    // 🌟 新增：B端更新线索跟进状态
    public void updateLeadStatus(Long id, Integer status) {
        CarLead lead = new CarLead();
        lead.setId(id);
        lead.setStatus(status);
        carLeadMapper.updateById(lead);
    }
}