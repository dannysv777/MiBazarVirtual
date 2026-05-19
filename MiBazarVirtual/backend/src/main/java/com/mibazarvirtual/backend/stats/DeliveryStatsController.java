package com.mibazarvirtual.backend.stats;

import com.mibazarvirtual.backend.common.dto.ApiResponse;
import com.mibazarvirtual.backend.security.AuthenticatedUserResolver;
import com.mibazarvirtual.backend.stats.dto.DeliveryStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/delivery/stats")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DELIVERY')")
public class DeliveryStatsController {

    private final StatsService statsService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @GetMapping
    public ResponseEntity<ApiResponse<DeliveryStatsResponse>> stats(Authentication authentication) {
        Long deliveryWorkerId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(statsService.getDeliveryStats(deliveryWorkerId), "Delivery stats"));
    }
}
