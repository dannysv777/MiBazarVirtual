// src/main/java/com/mibazarvirtual/backend/chat/ChatService.java
package com.mibazarvirtual.backend.chat;

import com.mibazarvirtual.backend.chat.dto.ConversationDTO;
import com.mibazarvirtual.backend.chat.dto.MessageDTO;
import com.mibazarvirtual.backend.entity.Conversation;
import com.mibazarvirtual.backend.entity.Message;
import com.mibazarvirtual.backend.entity.Product;
import com.mibazarvirtual.backend.entity.User;
import com.mibazarvirtual.backend.exception.ConversationNotFoundException;
import com.mibazarvirtual.backend.exception.UnauthorizedParticipantException;
import com.mibazarvirtual.backend.notification.NotificationService;
import com.mibazarvirtual.backend.repository.ConversationRepository;
import com.mibazarvirtual.backend.repository.MessageRepository;
import com.mibazarvirtual.backend.repository.ProductRepository;
import com.mibazarvirtual.backend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final NotificationService notificationService;

    @Transactional
    public ConversationDTO startOrGetConversation(Long buyerId, Long sellerId, Long productId) {
        // En la app actual se reutiliza el chat mas reciente entre comprador y vendedor.
        // El productId se usa al crear una conversacion nueva para conservar el contexto inicial.
        Conversation conversation = conversationRepository
                .findFirstByBuyerIdAndSellerIdOrderByUpdatedAtDesc(buyerId, sellerId)
                .orElseGet(() -> createConversation(buyerId, sellerId, productId));

        return toConversationDTO(conversation, buyerId);
    }

    @Transactional
    public MessageDTO sendMessage(Long conversationId, Long senderId, String content) {
        Conversation conversation = getConversationOrThrow(conversationId);
        // Seguridad de negocio: aunque alguien conozca el id del chat, solo comprador/vendedor pueden escribir.
        validateParticipant(conversation, senderId);

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + senderId));

        // Primero persistimos el mensaje; despues WebSocket lo difunde desde el controlador.
        Message message = messageRepository.save(new Message(conversation, sender, content.trim()));
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
        notificationService.notifyNewMessage(message, getRecipientId(conversation, senderId));

        return toMessageDTO(message);
    }

    @Transactional(readOnly = true)
    public List<ConversationDTO> getConversations(Long userId) {
        return conversationRepository.findByBuyerIdOrSellerIdOrderByUpdatedAtDesc(userId, userId).stream()
                .map(conversation -> toConversationDTO(conversation, userId))
                .toList();
    }

    @Transactional
    public List<MessageDTO> getMessages(Long conversationId, Long userId, Pageable pageable) {
        Conversation conversation = getConversationOrThrow(conversationId);
        validateParticipant(conversation, userId);

        // El historial se devuelve de antiguo a reciente para que el cliente pinte la conversacion natural.
        List<MessageDTO> messages = messageRepository
                .findByConversationIdOrderByCreatedAtAsc(conversationId, pageable)
                .map(this::toMessageDTO)
                .toList();
        // Al entrar a la conversacion, los mensajes del otro participante dejan de contar como pendientes.
        markAsRead(conversationId, userId);
        return messages;
    }

    @Transactional
    public void markAsRead(Long conversationId, Long userId) {
        Conversation conversation = getConversationOrThrow(conversationId);
        validateParticipant(conversation, userId);
        messageRepository.updateMessagesAsRead(conversationId, userId);
    }

    @Transactional(readOnly = true)
    public int getUnreadCount(Long userId) {
        return messageRepository.countUnreadForUser(userId);
    }

    private Conversation createConversation(Long buyerId, Long sellerId, Long productId) {
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new EntityNotFoundException("Buyer not found: " + buyerId));
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new EntityNotFoundException("Seller not found: " + sellerId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product not found: " + productId));
        Long productSellerId = product.getStore().getUser().getId();
        // Evita que el cliente abra un chat fingiendo que otro vendedor es dueño del producto.
        if (!productSellerId.equals(sellerId)) {
            throw new UnauthorizedParticipantException("Seller " + sellerId + " does not own product " + productId);
        }

        return conversationRepository.save(new Conversation(buyer, seller, product));
    }

    private Conversation getConversationOrThrow(Long conversationId) {
        return conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ConversationNotFoundException(conversationId));
    }

    private void validateParticipant(Conversation conversation, Long userId) {
        boolean participant = conversation.getBuyer().getId().equals(userId)
                || conversation.getSeller().getId().equals(userId);
        if (!participant) {
            throw new UnauthorizedParticipantException(conversation.getId(), userId);
        }
    }

    private Long getRecipientId(Conversation conversation, Long senderId) {
        return conversation.getBuyer().getId().equals(senderId)
                ? conversation.getSeller().getId()
                : conversation.getBuyer().getId();
    }

    private ConversationDTO toConversationDTO(Conversation conversation, Long currentUserId) {
        Message lastMessage = messageRepository.findTopByConversationIdOrderByCreatedAtDesc(conversation.getId());
        // Para la bandeja mostramos "la otra persona", sin que el frontend tenga que calcularlo.
        User otherParticipant = conversation.getBuyer().getId().equals(currentUserId)
                ? conversation.getSeller()
                : conversation.getBuyer();

        return new ConversationDTO(
                conversation.getId(),
                conversation.getBuyer().getId(),
                conversation.getSeller().getId(),
                conversation.getProduct().getId(),
                conversation.getProduct().getName(),
                lastMessage == null ? null : lastMessage.getContent(),
                lastMessage == null ? null : lastMessage.getCreatedAt(),
                messageRepository.countByConversationIdAndReadFalseAndSenderIdNot(conversation.getId(), currentUserId),
                otherParticipant.getUsername()
        );
    }

    private MessageDTO toMessageDTO(Message message) {
        return new MessageDTO(
                message.getConversation().getId(),
                message.getSender().getId(),
                message.getSender().getUsername(),
                message.getContent(),
                message.getCreatedAt(),
                message.isRead()
        );
    }
}
