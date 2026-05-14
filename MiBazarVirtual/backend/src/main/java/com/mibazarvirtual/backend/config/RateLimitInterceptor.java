// src/main/java/com/mibazarvirtual/backend/config/RateLimitInterceptor.java
package com.mibazarvirtual.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final long WINDOW_MILLIS = 60_000;
    private final Map<String, Counter> counters = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        int limit = resolveLimit(path);
        if (limit == 0 || !"POST".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String key = clientIp(request) + ":" + path;
        long now = Instant.now().toEpochMilli();
        Counter counter = counters.compute(key, (ignored, existing) -> {
            if (existing == null || now - existing.windowStartMillis >= WINDOW_MILLIS) {
                return new Counter(now, 1);
            }
            existing.count++;
            return existing;
        });

        if (counter.count <= limit) {
            return true;
        }

        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), Map.of(
                "status", 429,
                "error", "Too Many Requests",
                "message", "Demasiados intentos. Espera un momento.",
                "timestamp", Instant.now().toString()
        ));
        return false;
    }

    private int resolveLimit(String path) {
        if ("/api/auth/login".equals(path)) {
            return 10;
        }
        if ("/api/auth/register".equals(path)) {
            return 5;
        }
        return 0;
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static class Counter {
        private final long windowStartMillis;
        private int count;

        private Counter(long windowStartMillis, int count) {
            this.windowStartMillis = windowStartMillis;
            this.count = count;
        }
    }
}
