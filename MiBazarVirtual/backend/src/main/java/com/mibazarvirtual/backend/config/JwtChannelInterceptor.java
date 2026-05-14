// src/main/java/com/mibazarvirtual/backend/config/JwtChannelInterceptor.java
package com.mibazarvirtual.backend.config;

import com.mibazarvirtual.backend.security.JwtTokenService;
import com.mibazarvirtual.backend.security.UserPrincipal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenService jwtTokenService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() != StompCommand.CONNECT) {
            return message;
        }

        try {
            String token = firstNativeHeader(accessor, "Authorization");
            if (token == null) {
                token = firstNativeHeader(accessor, "token");
            }

            UserPrincipal principal = jwtTokenService.authenticate(token);
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + principal.role()))
                    );

            accessor.setUser(authentication);
            SecurityContextHolder.getContext().setAuthentication(authentication);
            return message;
        } catch (RuntimeException exception) {
            log.warn("Rejected WebSocket CONNECT frame: {}", exception.getMessage());
            throw new MessageDeliveryException("Unauthorized");
        }
    }

    private String firstNativeHeader(StompHeaderAccessor accessor, String name) {
        List<String> values = accessor.getNativeHeader(name);
        return values == null || values.isEmpty() ? null : values.get(0);
    }
}
