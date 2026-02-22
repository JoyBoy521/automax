package com.automax.mall.utils;

import com.automax.mall.entity.SysUser;

public class UserContext {
    private static final ThreadLocal<SysUser> threadLocal = new ThreadLocal<>();

    public static void setUser(SysUser user) { threadLocal.set(user); }
    public static SysUser getUser() { return threadLocal.get(); }
    public static void clear() { threadLocal.remove(); }
}