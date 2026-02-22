package com.automax.mall.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Autowired
    private LoginInterceptor loginInterceptor;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    // 🌟 新增：注册权限拦截器
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(loginInterceptor)
                .addPathPatterns("/api/**") // 拦截所有接口
                .excludePathPatterns(
                        "/api/auth/login",
                        "/api/cars/list",
                        "/api/cars/detail/**",
                        "/api/cars/spu/list", // 建议把这个也放行，以免有的地方查字典被拦
                        "/api/leads/submit" ,  // 🌟 关键：放行“我要卖车”提交接口！
                        "/api/ws/**"// 🌟 必须加上这一行，放行 WebSocket 握手

                );
    }
}