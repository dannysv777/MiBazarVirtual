// src/main/java/com/mibazarvirtual/backend/chat/dto/SendMessageRequest.java
package com.mibazarvirtual.backend.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SendMessageRequest(
        @NotNull Long conversationId,
        @NotBlank String content
) {
}
