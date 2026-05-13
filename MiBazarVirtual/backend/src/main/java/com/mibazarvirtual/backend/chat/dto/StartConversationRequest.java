// src/main/java/com/mibazarvirtual/backend/chat/dto/StartConversationRequest.java
package com.mibazarvirtual.backend.chat.dto;

import jakarta.validation.constraints.NotNull;

public record StartConversationRequest(
        @NotNull Long productId,
        @NotNull Long sellerId
) {
}
