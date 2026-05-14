// src/main/java/com/mibazarvirtual/backend/profile/dto/UpdateProfileRequest.java
package com.mibazarvirtual.backend.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 120) String fullName,
        @Size(max = 20) String phone
) {
}
