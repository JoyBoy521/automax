package com.automax.mall.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class LeadSubmitDTO {
    private String userPhone;
    private String city;
    private String intentionModel;
    private BigDecimal mileage;
    private BigDecimal expectedPrice;
}