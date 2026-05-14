// src/main/java/com/mibazarvirtual/backend/reviews/dto/ReviewResponse.java
package com.mibazarvirtual.backend.reviews.dto;

import com.mibazarvirtual.backend.entity.Review;
import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        String buyerUsername,
        Integer rating,
        String comment,
        LocalDateTime createdAt
) {
    public static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getBuyer().getUsername(),
                review.getRating().intValue(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
