// src/main/java/com/mibazarvirtual/backend/reviews/ReviewService.java
package com.mibazarvirtual.backend.reviews;

import com.mibazarvirtual.backend.entity.Order;
import com.mibazarvirtual.backend.entity.Review;
import com.mibazarvirtual.backend.entity.Store;
import com.mibazarvirtual.backend.exception.AlreadyReviewedException;
import com.mibazarvirtual.backend.exception.OrderNotDeliveredException;
import com.mibazarvirtual.backend.exception.OrderNotFoundException;
import com.mibazarvirtual.backend.exception.UnauthorizedReviewException;
import com.mibazarvirtual.backend.repository.OrderRepository;
import com.mibazarvirtual.backend.repository.ReviewRepository;
import com.mibazarvirtual.backend.reviews.dto.CreateReviewRequest;
import com.mibazarvirtual.backend.reviews.dto.ReviewResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public ReviewResponse createReview(Long orderId, Long buyerId, CreateReviewRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
        if (!order.getBuyer().getId().equals(buyerId)) {
            throw new UnauthorizedReviewException();
        }
        if (order.getStatus() != Order.Status.DELIVERED) {
            throw new OrderNotDeliveredException();
        }
        if (reviewRepository.existsByOrderId(orderId)) {
            throw new AlreadyReviewedException();
        }

        Review review = new Review();
        review.setOrder(order);
        review.setBuyer(order.getBuyer());
        review.setStore(order.getStore());
        review.setRating(request.rating().byteValue());
        review.setComment(request.comment());

        Review saved = reviewRepository.save(review);
        recalculateStoreRating(order.getStore());
        log.info("Created review {} for order {}", saved.getId(), orderId);
        return ReviewResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getStoreReviews(Long storeId, Pageable pageable) {
        return reviewRepository.findByStoreIdOrderByCreatedAtDesc(storeId, pageable)
                .map(ReviewResponse::from);
    }

    private void recalculateStoreRating(Store store) {
        BigDecimal average = reviewRepository.averageRatingByStoreId(store.getId())
                .setScale(2, RoundingMode.HALF_UP);
        long totalReviews = reviewRepository.countByStoreId(store.getId());
        store.setRatingAvg(average);
        store.setRatingCount((int) totalReviews);
    }
}
