// src/main/java/com/mibazarvirtual/backend/profile/ProfileController.java
package com.mibazarvirtual.backend.profile;

import com.mibazarvirtual.backend.common.dto.ApiResponse;
import com.mibazarvirtual.backend.profile.dto.ProfileResponse;
import com.mibazarvirtual.backend.profile.dto.UpdateProfileRequest;
import com.mibazarvirtual.backend.security.AuthenticatedUserResolver;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @Operation(summary = "Get profile", description = "Returns the authenticated user's profile.")
    @GetMapping
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfile(Authentication authentication) {
        Long userId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(profileService.getProfile(userId), "Profile"));
    }

    @Operation(summary = "Update profile", description = "Updates full name and phone for the authenticated user.")
    @PutMapping
    public ResponseEntity<ApiResponse<ProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication
    ) {
        Long userId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(profileService.updateProfile(userId, request), "Profile updated"));
    }
}
