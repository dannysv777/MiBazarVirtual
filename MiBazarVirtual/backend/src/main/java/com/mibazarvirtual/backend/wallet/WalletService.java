package com.mibazarvirtual.backend.wallet;

import com.mibazarvirtual.backend.entity.Order;
import com.mibazarvirtual.backend.entity.User;
import com.mibazarvirtual.backend.repository.OrderRepository;
import com.mibazarvirtual.backend.repository.UserRepository;
import com.mibazarvirtual.backend.wallet.dto.AddCardRequest;
import com.mibazarvirtual.backend.wallet.dto.BankAccountDTO;
import com.mibazarvirtual.backend.wallet.dto.BankAccountRequest;
import com.mibazarvirtual.backend.wallet.dto.SavedCardDTO;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Year;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WalletService {

    private static final BigDecimal PLATFORM_FEE_RATE = new BigDecimal("0.03");

    private final SavedCardRepository savedCardRepository;
    private final SellerBankAccountRepository sellerBankAccountRepository;
    private final OrderPaymentRepository orderPaymentRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public List<SavedCardDTO> getCards(Long userId) {
        return savedCardRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                .stream()
                .map(SavedCardDTO::from)
                .toList();
    }

    @Transactional
    public SavedCardDTO addCard(Long userId, AddCardRequest request) {
        if (request.expiryYear() < Year.now().getValue()) {
            throw new IllegalArgumentException("expiryYear must be current year or later");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
        boolean firstCard = !savedCardRepository.existsByUserId(userId);

        SavedCard card = new SavedCard();
        card.setUser(user);
        card.setCardAlias(request.alias().trim());
        card.setLastFour(request.lastFour());
        card.setCardBrand(request.brand().trim().toUpperCase());
        card.setExpiryMonth(request.expiryMonth().byteValue());
        card.setExpiryYear(request.expiryYear().shortValue());
        card.setIsDefault(firstCard);

        return SavedCardDTO.from(savedCardRepository.save(card));
    }

    @Transactional
    public void removeCard(Long userId, Long cardId) {
        SavedCard card = savedCardRepository.findByIdAndUserId(cardId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Card not found: " + cardId));
        boolean wasDefault = Boolean.TRUE.equals(card.getIsDefault());
        savedCardRepository.delete(card);

        if (wasDefault) {
            savedCardRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                    .stream()
                    .findFirst()
                    .ifPresent(nextCard -> nextCard.setIsDefault(true));
        }
    }

    @Transactional
    public SavedCardDTO setDefaultCard(Long userId, Long cardId) {
        SavedCard card = savedCardRepository.findByIdAndUserId(cardId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Card not found: " + cardId));
        savedCardRepository.clearDefaultForUser(userId);
        card.setIsDefault(true);
        return SavedCardDTO.from(card);
    }

    @Transactional(readOnly = true)
    public BankAccountDTO getBankAccount(Long sellerId) {
        return sellerBankAccountRepository.findBySellerId(sellerId)
                .map(BankAccountDTO::from)
                .orElse(null);
    }

    @Transactional
    public BankAccountDTO saveBankAccount(Long sellerId, BankAccountRequest request) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + sellerId));
        if (seller.getRole() != User.Role.SELLER) {
            throw new AccessDeniedException("Only sellers can manage bank accounts");
        }

        SellerBankAccount account = sellerBankAccountRepository.findBySellerId(sellerId)
                .orElseGet(SellerBankAccount::new);
        account.setSeller(seller);
        account.setBankName(request.bankName().trim());
        account.setAccountNumber(request.accountNumber().trim());
        account.setAccountHolder(request.accountHolder().trim());
        account.setAccountType(request.accountType());

        return BankAccountDTO.from(sellerBankAccountRepository.save(account));
    }

    @Transactional
    public OrderPayment createPaymentRecord(Long orderId, BigDecimal amount, String method) {
        if (orderPaymentRepository.existsByOrderId(orderId)) {
            return orderPaymentRepository.findByOrderId(orderId)
                    .orElseThrow(() -> new EntityNotFoundException("Payment not found for order: " + orderId));
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + orderId));
        BigDecimal safeAmount = amount == null ? BigDecimal.ZERO : amount;
        BigDecimal platformFee = safeAmount.multiply(PLATFORM_FEE_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal deliveryFee = order.getDeliveryFee() == null ? BigDecimal.ZERO : order.getDeliveryFee();
        BigDecimal sellerPayout = safeAmount.subtract(platformFee).subtract(deliveryFee).max(BigDecimal.ZERO);

        OrderPayment payment = new OrderPayment();
        payment.setOrder(order);
        payment.setAmount(safeAmount);
        payment.setPlatformFee(platformFee);
        payment.setSellerPayout(sellerPayout);
        payment.setPaymentMethod(OrderPayment.PaymentMethod.valueOf(method));
        payment.setPaymentStatus(OrderPayment.PaymentStatus.PENDING);
        return orderPaymentRepository.save(payment);
    }
}
