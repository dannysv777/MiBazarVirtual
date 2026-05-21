package com.mibazarvirtual.backend.push.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterPushTokenRequest(
        @NotBlank @Size(max = 255) String token,
        @Size(max = 20) String tokenType,
        @Size(max = 20) String platform,
        @Size(max = 120) String deviceId
) {
}
