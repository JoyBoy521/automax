package com.automax.mall.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 🌟 Web 配置类：负责注册拦截器和放行规则
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private LoginInterceptor loginInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 注册拦截器
        registry.addInterceptor(loginInterceptor)
                .addPathPatterns("/api/**") // 拦截所有 API 请求
                .excludePathPatterns(
                        "/api/auth/login",
                        "/api/auth/register",
                        "/api/user/register",
                        "/api/ws/**",           // 🌟 放行 WebSocket
                        "/api/leads/submit",    // C 端提交卖车线索无需登录
                        "/api/cars/spu/list",
                        "/api/admin/cars/spu/list", // 🌟 放行 SPU 列表
                        "/api/cars/list",       // 🌟 核心：放行 C 端列表
                        "/api/cars/detail/**"    // 🌟 核心：放行 C 端详情
                );
    }
}
