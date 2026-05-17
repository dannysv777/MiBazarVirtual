// src/main/java/com/mibazarvirtual/backend/config/WebSocketConfig.java
package com.mibazarvirtual.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtChannelInterceptor jwtChannelInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // /topic es el canal de salida: el backend publica aqui y los clientes se suscriben.
        registry.enableSimpleBroker("/topic");
        // /app es el canal de entrada: el frontend envia eventos como /app/chat.sendMessage.
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // /ws es el punto de conexion WebSocket. SockJS permite fallback si WebSocket puro falla.
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Antes de aceptar mensajes STOMP, validamos el JWT que llega en el CONNECT.
        registration.interceptors(jwtChannelInterceptor);
    }
}
