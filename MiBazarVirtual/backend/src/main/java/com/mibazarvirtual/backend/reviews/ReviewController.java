// src/main/java/com/mibazarvirtual/backend/reviews/ReviewController.java
package com.mibazarvirtual.backend.reviews;

import com.mibazarvirtual.backend.common.dto.ApiResponse;
import com.mibazarvirtual.backend.reviews.dto.CreateReviewRequest;
import com.mibazarvirtual.backend.reviews.dto.ReviewResponse;
import com.mibazarvirtual.backend.security.AuthenticatedUserResolver;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @Operation(summary = "Create order review", description = "Allows a buyer to review one of their delivered orders.")
    @PostMapping("/api/orders/{orderId}/review")
    @PreAuthorize("hasRole('BUYER')")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @PathVariable Long orderId,
            @Valid @RequestBody CreateReviewRequest request,
            Authentication authentication
    ) {
        Long buyerId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(
                reviewService.createReview(orderId, buyerId, request),
                "Review created"
        ));
    }

    @Operation(summary = "List store reviews", description = "Returns paginated public reviews for a store.")
    @GetMapping("/api/stores/{storeId}/reviews")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getStoreReviews(
            @PathVariable Long storeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(
                reviewService.getStoreReviews(storeId, pageable),
                "Store reviews"
        ));
    }
}
