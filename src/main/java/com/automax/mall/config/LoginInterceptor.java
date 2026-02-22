package com.automax.mall.config;

import com.automax.mall.utils.JwtUtils;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class LoginInterceptor implements HandlerInterceptor {
    public static ThreadLocal<Long> userHolder = new ThreadLocal<>();

    @Override

    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equals(request.getMethod())) return true;

        String token = request.getHeader("Authorization");
        try {
            Claims claims = JwtUtils.parseToken(token);
            String role = claims.get("role", String.class);
            String uri = request.getRequestURI();

            // 🌟 1. 内部管理接口权限判断 (/api/admin/**)
            if (uri.contains("/api/admin/")) {
                // 只有 ADMIN (超管), MANAGER (店长), STAFF (员工) 允许进入
                if (!"ADMIN".equals(role) && !"MANAGER".equals(role) && !"STAFF".equals(role) && !"USER".equals(role)) {
                    response.setStatus(403);
                    return false;
                }
            }

            // 🌟 2. 客户专有接口权限判断 (如下单)
            else if (uri.contains("/api/orders/save")) {
                // 只有 CUSTOMER (或者你之前的 ADMIN 客户角色) 允许下单
                if (!"CUSTOMER".equals(role) && !"ADMIN".equals(role)) {
                    response.setStatus(403);
                    return false;
                }
            }

            // 🌟 3. 存储用户信息 (建议存入你之前建的 SysUser 对象)
            userHolder.set(claims.get("userId", Long.class));
            return true;
        } catch (Exception e) {
            response.setStatus(401);
            return false;
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        userHolder.remove();
    }
}