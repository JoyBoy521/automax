package com.automax.mall.controller;

import com.automax.mall.entity.SysUser;
import com.automax.mall.mapper.SysUserMapper;
import com.automax.mall.utils.JwtUtils;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    @Autowired
    private SysUserMapper userMapper;

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        // 从数据库查询用户
        SysUser user = userMapper.selectOne(new QueryWrapper<SysUser>().eq("username", username));

        // 简单明文比对（毕设够用了，如果想加分可以之后加 BCrypt）
        if (user != null && user.getPassword().equals(password)) {
            // 🌟 签发 Token，包含 userId, username, role
            String token = JwtUtils.createToken(user.getId(), user.getUsername(), user.getRole());
            return Map.of(
                    "code", 200,
                    "success", true,
                    "token", token,
                    "role", user.getRole(),
                    "username", user.getUsername()
            );
        }
        return Map.of("code", 401, "success", false, "msg", "用户名或密码错误");
    }
}