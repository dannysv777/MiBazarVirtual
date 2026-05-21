package com.mibazarvirtual.backend.push;

import com.mibazarvirtual.backend.common.dto.ApiResponse;
import com.mibazarvirtual.backend.push.dto.PushTokenResponse;
import com.mibazarvirtual.backend.push.dto.RegisterPushTokenRequest;
import com.mibazarvirtual.backend.security.AuthenticatedUserResolver;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/push-tokens")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class PushTokenController {

    private final PushNotificationService pushNotificationService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @PostMapping
    public ResponseEntity<ApiResponse<PushTokenResponse>> register(
            @Valid @RequestBody RegisterPushTokenRequest request,
            Authentication authentication
    ) {
        Long userId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(pushNotificationService.registerToken(userId, request), "Push token registered"));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deactivate(
            @RequestBody Map<String, String> request,
            Authentication authentication
    ) {
        Long userId = authenticatedUserResolver.currentUserId(authentication);
        pushNotificationService.deactivateToken(userId, request.get("token"));
        return ResponseEntity.ok(ApiResponse.ok(null, "Push token removed"));
    }
}
