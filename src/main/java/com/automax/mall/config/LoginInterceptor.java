package com.automax.mall.config;

import com.automax.mall.entity.SysUser;
import com.automax.mall.mapper.SysUserMapper;
import com.automax.mall.utils.JwtUtils;
import com.automax.mall.utils.UserContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;

@Component
public class LoginInterceptor implements HandlerInterceptor {
    public static ThreadLocal<Long> userHolder = new ThreadLocal<>();
    @Autowired
    private SysUserMapper sysUserMapper;

    @Override

    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equals(request.getMethod())) return true;

        String token = request.getHeader("Authorization");
        try {
            Claims claims = JwtUtils.parseToken(token);
            String role = normalizeRole(claims.get("role", String.class));
            Long userId = claims.get("userId", Long.class);
            String uri = request.getRequestURI();

            // 1) 后台接口权限 (/api/admin/**)
            if (uri.startsWith("/api/admin/")) {
                if (!hasAnyRole(role, "ADMIN", "MANAGER", "STAFF")) {
                    response.setStatus(403);
                    return false;
                }

                // 门店管理仅超级管理员
                if (uri.startsWith("/api/admin/stores/") && !hasAnyRole(role, "ADMIN")) {
                    response.setStatus(403);
                    return false;
                }

                // 人员管理：仅 ADMIN / MANAGER
                if (uri.startsWith("/api/admin/users/")
                        && !hasAnyRole(role, "ADMIN", "MANAGER")) {
                    response.setStatus(403);
                    return false;
                }
            }

            // 2) 订单接口权限
            if (uri.startsWith("/api/orders/lock")
                    || uri.startsWith("/api/orders/my/")
                    || uri.startsWith("/api/orders/cancel/")) {
                if (!hasAnyRole(role, "CUSTOMER", "ADMIN")) {
                    response.setStatus(403);
                    return false;
                }
            }

            if (uri.startsWith("/api/orders/admin/")) {
                if (!hasAnyRole(role, "ADMIN", "MANAGER", "STAFF")) {
                    response.setStatus(403);
                    return false;
                }
            }

            // 3) 存储用户上下文
            userHolder.set(userId);
            SysUser current = sysUserMapper.selectById(userId);
            if (current == null) {
                current = new SysUser();
                current.setId(userId);
                current.setRole(role);
            } else {
                current.setRole(normalizeRole(current.getRole()));
            }
            UserContext.setUser(current);
            return true;
        } catch (Exception e) {
            response.setStatus(401);
            return false;
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        userHolder.remove();
        UserContext.clear();
    }

    private boolean hasAnyRole(String role, String... allowed) {
        if (role == null) {
            return false;
        }
        return Set.of(allowed).contains(role);
    }

    private String normalizeRole(String role) {
        if ("USER".equals(role)) {
            return "STAFF";
        }
        return role;
    }
}
