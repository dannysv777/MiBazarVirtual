// src/main/java/com/mibazarvirtual/backend/stats/SellerStatsController.java
package com.mibazarvirtual.backend.stats;

import com.mibazarvirtual.backend.common.dto.ApiResponse;
import com.mibazarvirtual.backend.security.AuthenticatedUserResolver;
import com.mibazarvirtual.backend.stats.dto.SellerStatsResponse;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seller/stats")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SELLER')")
public class SellerStatsController {

    private final StatsService statsService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @Operation(summary = "Get seller stats", description = "Returns dashboard counters and revenue for the authenticated seller.")
    @GetMapping
    public ResponseEntity<ApiResponse<SellerStatsResponse>> stats(Authentication authentication) {
        Long sellerId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(statsService.getSellerStats(sellerId), "Seller stats"));
    }
}
