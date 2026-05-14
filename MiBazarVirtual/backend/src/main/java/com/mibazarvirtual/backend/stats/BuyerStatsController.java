// src/main/java/com/mibazarvirtual/backend/stats/BuyerStatsController.java
package com.mibazarvirtual.backend.stats;

import com.mibazarvirtual.backend.common.dto.ApiResponse;
import com.mibazarvirtual.backend.security.AuthenticatedUserResolver;
import com.mibazarvirtual.backend.stats.dto.BuyerStatsResponse;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/buyer/stats")
@RequiredArgsConstructor
@PreAuthorize("hasRole('BUYER')")
public class BuyerStatsController {

    private final StatsService statsService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @Operation(summary = "Get buyer stats", description = "Returns order, spending and conversation stats for the authenticated buyer.")
    @GetMapping
    public ResponseEntity<ApiResponse<BuyerStatsResponse>> stats(Authentication authentication) {
        Long buyerId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(statsService.getBuyerStats(buyerId), "Buyer stats"));
    }
}
