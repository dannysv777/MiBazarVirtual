package com.mibazarvirtual.backend.notification;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mibazarvirtual.backend.entity.Message;
import com.mibazarvirtual.backend.entity.Order;
import com.mibazarvirtual.backend.entity.Product;
import com.mibazarvirtual.backend.entity.Review;
import com.mibazarvirtual.backend.entity.Store;
import com.mibazarvirtual.backend.entity.User;
import com.mibazarvirtual.backend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    public static final String ORDER_CONFIRMED = "ORDER_CONFIRMED";
    public static final String ORDER_IN_PROGRESS = "ORDER_IN_PROGRESS";
    public static final String ORDER_DELIVERED = "ORDER_DELIVERED";
    public static final String ORDER_CANCELLED = "ORDER_CANCELLED";
    public static final String NEW_MESSAGE = "NEW_MESSAGE";
    public static final String NEW_ORDER_RECEIVED = "NEW_ORDER_RECEIVED";
    public static final String REVIEW_RECEIVED = "REVIEW_RECEIVED";
    public static final String PRODUCT_BACK_IN_STOCK = "PRODUCT_BACK_IN_STOCK";

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public Notification createNotification(
            Long userId,
            String type,
            String title,
            String body,
            Map<String, Object> data
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setData(toJson(data));
        return notificationRepository.save(notification);
    }

    public void notifyOrderConfirmed(Order order) {
        Store store = order.getStore();
        createNotification(
                order.getBuyer().getId(),
                ORDER_CONFIRMED,
                "Pedido confirmado",
                store.getName() + " confirmo tu pedido #" + order.getId(),
                Map.of("orderId", order.getId(), "type", ORDER_CONFIRMED)
        );
    }

    public void notifyOrderInProgress(Order order) {
        createNotification(
                order.getBuyer().getId(),
                ORDER_IN_PROGRESS,
                "Tu pedido esta en camino",
                "Tu pedido de " + order.getStore().getName() + " esta en camino",
                Map.of("orderId", order.getId(), "type", ORDER_IN_PROGRESS)
        );
    }

    public void notifyOrderDelivered(Order order) {
        createNotification(
                order.getBuyer().getId(),
                ORDER_DELIVERED,
                "Pedido entregado",
                "Recibiste tu pedido de " + order.getStore().getName() + ". Como estuvo?",
                Map.of("orderId", order.getId(), "canReview", true, "type", ORDER_DELIVERED)
        );
    }

    public void notifyOrderCancelled(Order order, String reason) {
        createNotification(
                order.getBuyer().getId(),
                ORDER_CANCELLED,
                "Pedido cancelado",
                "Tu pedido #" + order.getId() + " fue cancelado",
                Map.of("orderId", order.getId(), "reason", reason == null ? "" : reason, "type", ORDER_CANCELLED)
        );
    }

    public void notifyNewOrderReceived(Order order) {
        BigDecimal total = order.getTotal() == null ? BigDecimal.ZERO : order.getTotal();
        createNotification(
                order.getStore().getUser().getId(),
                NEW_ORDER_RECEIVED,
                "Nuevo pedido",
                order.getBuyer().getFullName() + " realizo un pedido por Q" + total,
                Map.of("orderId", order.getId(), "type", NEW_ORDER_RECEIVED)
        );
    }

    public void notifyNewMessage(Message message, Long recipientId) {
        String content = message.getContent() == null ? "" : message.getContent();
        String preview = content.length() > 50 ? content.substring(0, 50) + "..." : content;
        createNotification(
                recipientId,
                NEW_MESSAGE,
                "Nuevo mensaje",
                message.getSender().getUsername() + ": " + preview,
                Map.of("conversationId", message.getConversation().getId(), "type", NEW_MESSAGE)
        );
    }

    public void notifyReviewReceived(Review review) {
        createNotification(
                review.getStore().getUser().getId(),
                REVIEW_RECEIVED,
                "Nueva calificacion",
                "Recibiste una calificacion de " + review.getRating() + " estrellas",
                Map.of("storeId", review.getStore().getId(), "rating", review.getRating(), "type", REVIEW_RECEIVED)
        );
    }

    public void notifyProductBackInStock(List<Long> userIds, Product product) {
        userIds.forEach(userId -> createNotification(
                userId,
                PRODUCT_BACK_IN_STOCK,
                "Volvio a stock",
                product.getName() + " ya esta disponible de nuevo",
                Map.of("productId", product.getId(), "type", PRODUCT_BACK_IN_STOCK)
        ));
    }

    @Transactional(readOnly = true)
    public Page<NotificationDTO> getNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(notification -> NotificationDTO.from(notification, objectMapper));
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    @Transactional
    public void markOneAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Notification not found: " + notificationId));
        notification.setIsRead(true);
    }

    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        notificationRepository.deleteByIdAndUserId(notificationId, userId);
    }

    private String toJson(Map<String, Object> data) {
        if (data == null || data.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException exception) {
            log.warn("Could not serialize notification data", exception);
            return null;
        }
    }
}
