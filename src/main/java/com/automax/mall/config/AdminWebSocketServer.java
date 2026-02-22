package com.automax.mall.config;

import jakarta.websocket.*;
import jakarta.websocket.server.ServerEndpoint;
import org.springframework.stereotype.Component;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
@ServerEndpoint("/api/ws/admin")
public class AdminWebSocketServer {
    // 存放所有在线的后台管理会话
    private static CopyOnWriteArraySet<AdminWebSocketServer> webSocketSet = new CopyOnWriteArraySet<>();
    private Session session;

    @OnOpen
    public void onOpen(Session session) {
        this.session = session;
        webSocketSet.add(this);
        System.out.println("【WebSocket】管理员已连接，当前在线人数：" + webSocketSet.size());
    }

    @OnClose
    public void onClose() {
        webSocketSet.remove(this);
        System.out.println("【WebSocket】管理员断开连接，当前在线人数：" + webSocketSet.size());
    }

    @OnError
    public void onError(Throwable error) {
        error.printStackTrace();
    }

    // 核心：给所有在线管理员推送 JSON 格式的消息
    public static void sendNotice(String jsonMessage) {
        for (AdminWebSocketServer server : webSocketSet) {
            try {
                if (server.session.isOpen()) {
                    server.session.getBasicRemote().sendText(jsonMessage);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}