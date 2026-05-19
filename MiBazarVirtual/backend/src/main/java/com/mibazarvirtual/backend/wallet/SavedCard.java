package com.mibazarvirtual.backend.wallet;

import com.mibazarvirtual.backend.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "saved_cards")
@Getter
@Setter
@NoArgsConstructor
public class SavedCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "card_alias", nullable = false, length = 50)
    private String cardAlias;

    @Column(name = "last_four", nullable = false, columnDefinition = "CHAR(4)")
    private String lastFour;

    @Column(name = "card_brand", nullable = false, length = 20)
    private String cardBrand;

    @Column(name = "expiry_month", nullable = false)
    private Byte expiryMonth;

    @Column(name = "expiry_year", nullable = false)
    private Short expiryYear;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
