// src/main/java/com/mibazarvirtual/backend/repository/ConversationRepository.java
package com.mibazarvirtual.backend.repository;

import com.mibazarvirtual.backend.entity.Conversation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    Optional<Conversation> findByBuyerIdAndSellerIdAndProductId(Long buyerId, Long sellerId, Long productId);

    // Recupera el hilo mas reciente entre dos usuarios para continuar una conversacion existente.
    Optional<Conversation> findFirstByBuyerIdAndSellerIdOrderByUpdatedAtDesc(Long buyerId, Long sellerId);

    // Bandeja de entrada: conversaciones donde el usuario participa como comprador o vendedor.
    List<Conversation> findByBuyerIdOrSellerIdOrderByUpdatedAtDesc(Long buyerId, Long sellerId);

    long countByBuyerIdOrSellerId(Long buyerId, Long sellerId);
}
