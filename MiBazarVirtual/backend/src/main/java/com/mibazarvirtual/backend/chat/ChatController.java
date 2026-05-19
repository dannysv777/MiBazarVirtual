// src/main/java/com/mibazarvirtual/backend/chat/ChatController.java
package com.mibazarvirtual.backend.chat;

import com.mibazarvirtual.backend.chat.dto.ConversationDTO;
import com.mibazarvirtual.backend.chat.dto.MessageDTO;
import com.mibazarvirtual.backend.chat.dto.SendMessageRequest;
import com.mibazarvirtual.backend.chat.dto.StartConversationRequest;
import com.mibazarvirtual.backend.chat.dto.StartDirectConversationRequest;
import com.mibazarvirtual.backend.chat.dto.TypingNotification;
import com.mibazarvirtual.backend.security.AuthenticatedUserResolver;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    // Evento en tiempo real: el frontend envia a /app/chat.sendMessage.
    // Guardamos el mensaje y luego lo publicamos a todos los suscritos a esa conversacion.
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Valid SendMessageRequest request, Principal principal) {
        Long senderId = authenticatedUserResolver.currentUserId((Authentication) principal);
        MessageDTO message = chatService.sendMessage(request.conversationId(), senderId, request.content());
        messagingTemplate.convertAndSend("/topic/conversation/" + request.conversationId(), message);
    }

    // Evento liviano de "esta escribiendo"; no se guarda en base de datos.
    @MessageMapping("/chat.typing")
    public void typing(@Valid TypingNotification notification) {
        messagingTemplate.convertAndSend(
                "/topic/conversation/" + notification.conversationId() + "/typing",
                notification
        );
    }

    // REST: crea o recupera una conversacion antes de abrir la pantalla del chat.
    @PostMapping("/start")
    public ResponseEntity<ConversationDTO> startConversation(
            @Valid @RequestBody StartConversationRequest request,
            Authentication authentication
    ) {
        Long buyerId = authenticatedUserResolver.currentUserId(authentication);
        ConversationDTO conversation = chatService.startOrGetConversation(
                buyerId,
                request.sellerId(),
                request.productId()
        );
        return ResponseEntity.ok(conversation);
    }

    @PostMapping("/start-direct")
    public ResponseEntity<ConversationDTO> startDirectConversation(
            @Valid @RequestBody StartDirectConversationRequest request,
            Authentication authentication
    ) {
        Long senderId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(chatService.startOrGetDirectConversation(
                senderId,
                request.recipientId(),
                request.orderId()
        ));
    }

    // REST: lista las conversaciones del usuario para la bandeja de mensajes.
    @GetMapping
    public ResponseEntity<List<ConversationDTO>> getConversations(Authentication authentication) {
        Long userId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(chatService.getConversations(userId));
    }

    // REST: carga el historial paginado; al abrirlo marcamos como leidos los mensajes recibidos.
    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<List<MessageDTO>> getMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size,
            Authentication authentication
    ) {
        Long userId = authenticatedUserResolver.currentUserId(authentication);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(chatService.getMessages(conversationId, userId, pageable));
    }

    // REST: contador global que alimenta badges/notificaciones en el frontend.
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Integer>> getUnreadCount(Authentication authentication) {
        Long userId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(Map.of("unreadCount", chatService.getUnreadCount(userId)));
    }
}
