// src/main/java/com/mibazarvirtual/backend/entity/Conversation.java
package com.mibazarvirtual.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(
        name = "conversations",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "unique_conversation",
                        columnNames = {"buyer_id", "seller_id", "product_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Conversation {

    // Una conversacion representa el hilo entre comprador y vendedor sobre un producto inicial.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Enumerated(EnumType.STRING)
    @jakarta.persistence.Column(name = "conversation_type", nullable = false, length = 30)
    private Type conversationType = Type.PRODUCT;

    @jakarta.persistence.Column(name = "order_id")
    private Long orderId;

    // Hibernate asigna estas fechas automaticamente; updatedAt se usa para ordenar la bandeja.
    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Conversation(User buyer, User seller, Product product) {
        this.buyer = buyer;
        this.seller = seller;
        this.product = product;
        this.conversationType = Type.PRODUCT;
    }

    public enum Type {
        PRODUCT, DIRECT, DELIVERY_ORDER
    }
}
