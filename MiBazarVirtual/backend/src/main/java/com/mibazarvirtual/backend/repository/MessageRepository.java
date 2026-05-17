// src/main/java/com/mibazarvirtual/backend/repository/MessageRepository.java
package com.mibazarvirtual.backend.repository;

import com.mibazarvirtual.backend.entity.Message;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    // Historial paginado para no traer demasiados mensajes de golpe.
    Page<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId, Pageable pageable);

    // Pendientes dentro de una conversacion especifica, ignorando los mensajes enviados por el usuario actual.
    int countByConversationIdAndReadFalseAndSenderIdNot(Long conversationId, Long senderId);

    // Pendientes globales para el badge de mensajes/notificaciones.
    @Query("""
            select count(m)
            from Message m
            where (m.conversation.buyer.id = :userId or m.conversation.seller.id = :userId)
              and m.sender.id <> :userId
              and m.read = false
            """)
    int countUnreadForUser(@Param("userId") Long userId);

    Message findTopByConversationIdOrderByCreatedAtDesc(Long conversationId);

    // Limpieza automatica de mensajes antiguos.
    long deleteByCreatedAtBefore(LocalDateTime cutoff);

    // Marca como leidos solo los mensajes recibidos, no los que envio el mismo usuario.
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update Message m
            set m.read = true
            where m.conversation.id = :conversationId
              and m.sender.id <> :userId
              and m.read = false
            """)
    int updateMessagesAsRead(@Param("conversationId") Long conversationId, @Param("userId") Long userId);
}
