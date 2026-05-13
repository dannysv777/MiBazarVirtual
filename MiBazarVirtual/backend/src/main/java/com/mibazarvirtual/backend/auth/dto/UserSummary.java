package com.mibazarvirtual.backend.auth.dto;

import com.mibazarvirtual.backend.entity.User;

public record UserSummary(
        Long id,
        String username,
        String email,
        String fullName,
        User.Role role
) {
    public static UserSummary from(User user) {
        return new UserSummary(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole()
        );
    }
}
