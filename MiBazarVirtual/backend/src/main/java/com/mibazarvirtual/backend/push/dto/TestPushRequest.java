package com.mibazarvirtual.backend.push.dto;

import jakarta.validation.constraints.Size;

public record TestPushRequest(
        @Size(max = 150) String title,
        @Size(max = 500) String body
) {
}
