// src/main/java/com/mibazarvirtual/backend/profile/dto/ProfileResponse.java
package com.mibazarvirtual.backend.profile.dto;

import com.mibazarvirtual.backend.entity.User;
import java.time.LocalDateTime;

public record ProfileResponse(
        Long id,
        String username,
        String email,
        String fullName,
        String phone,
        String profileImage,
        String role,
        LocalDateTime createdAt
) {
    public static ProfileResponse from(User user) {
        return new ProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getProfileImage(),
                user.getRole().name(),
                user.getCreatedAt()
        );
    }
}
