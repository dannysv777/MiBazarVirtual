package com.mibazarvirtual.backend.push.dto;

import com.mibazarvirtual.backend.push.PushToken;

public record PushTokenResponse(
        Long id,
        String tokenType,
        String platform,
        boolean active
) {
    public static PushTokenResponse from(PushToken token) {
        return new PushTokenResponse(
                token.getId(),
                token.getTokenType().name(),
                token.getPlatform(),
                token.isActive()
        );
    }
}
