package com.automax.mall.mapper;

import com.automax.mall.entity.CarSku;
import com.automax.mall.vo.CarSkuVO;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;
import java.util.Map;

@Mapper
public interface CarSkuMapper extends BaseMapper<CarSku> {

    @Select("SELECT " +
            "k.*, " + // 使用 k.* 自动查询所有字段，包括 title, first_reg_date, flaws 等
            "p.spu_name, p.brand, p.series, p.gearbox, p.engine, p.year_model, p.guide_price, " +
            "s.store_name, s.city, s.detail_address, s.contact_phone, s.longitude, s.latitude " +
            "FROM car_sku k " +
            "LEFT JOIN car_spu p ON k.spu_id = p.id " +
            "LEFT JOIN sys_store s ON k.store_id = s.id " +
            "WHERE k.status != 4")
    List<CarSkuVO> selectCarList(); // 修改为与 Controller 一致的方法名

    @Select("SELECT " +
            "k.*, " + // 🌟 包含 title 和所有动态字段
            "p.spu_name, p.brand, p.series, p.gearbox, p.engine, p.year_model, p.guide_price, " +
            "s.store_name, s.city, s.detail_address, s.contact_phone, s.longitude, s.latitude " +
            "FROM car_sku k " +
            "LEFT JOIN car_spu p ON k.spu_id = p.id " +
            "LEFT JOIN sys_store s ON k.store_id = s.id " +
            "WHERE k.id = #{id}")
    CarSkuVO selectCarDetailById(Long id);
    @Select("SELECT COALESCE(p.brand, '未知') AS name, COUNT(1) AS count " +
            "FROM car_sku k " +
            "LEFT JOIN car_spu p ON k.spu_id = p.id " +
            "WHERE k.status IN (1, 2) " +
            "GROUP BY p.brand " +
            "ORDER BY count DESC " +
            "LIMIT 5")
    List<Map<String, Object>> selectTopBrandInventory();
}
