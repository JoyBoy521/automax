package com.automax.mall.service;

import com.automax.mall.dto.LeadSubmitDTO;
import com.automax.mall.entity.CarLead;
import com.automax.mall.entity.SysUser;
import com.automax.mall.mapper.CarLeadMapper;
import com.automax.mall.utils.UserContext;
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
    public List<CarLead> getAllLeads(Long storeId) {
        SysUser currentUser = UserContext.getUser();
        QueryWrapper<CarLead> queryWrapper = new QueryWrapper<>();
        if (currentUser != null && !"ADMIN".equals(currentUser.getRole())) {
            if (currentUser.getStoreId() == null) {
                queryWrapper.isNull("store_id");
            } else {
                queryWrapper.and(w -> w.eq("store_id", currentUser.getStoreId()).or().isNull("store_id"));
            }
        } else if (storeId != null) {
            queryWrapper.eq("store_id", storeId);
        }
        queryWrapper.orderByDesc("create_time");
        return carLeadMapper.selectList(queryWrapper);
    }

    // 🌟 新增：B端更新线索跟进状态
    public void updateLeadStatus(Long id, Integer status) {
        CarLead current = carLeadMapper.selectById(id);
        if (current == null) {
            return;
        }

        SysUser currentUser = UserContext.getUser();
        if (currentUser != null && !"ADMIN".equals(currentUser.getRole())) {
            if (currentUser.getStoreId() == null) {
                return;
            }
            // 非管理员只能更新本店线索；若线索未分配门店，默认归属当前门店
            if (current.getStoreId() == null) {
                current.setStoreId(currentUser.getStoreId());
            } else if (!currentUser.getStoreId().equals(current.getStoreId())) {
                return;
            }
        }

        current.setStatus(status);
        carLeadMapper.updateById(current);
    }
}
