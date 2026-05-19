package com.mibazarvirtual.backend.chat.dto;

import jakarta.validation.constraints.NotNull;

public record StartDirectConversationRequest(
        @NotNull Long recipientId,
        Long orderId
) {
}
