package com.mibazarvirtual.backend.favorite;

import com.mibazarvirtual.backend.entity.Product;
import com.mibazarvirtual.backend.entity.User;
import com.mibazarvirtual.backend.exception.ProductNotFoundException;
import com.mibazarvirtual.backend.repository.ProductRepository;
import com.mibazarvirtual.backend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public FavoriteToggleResponse toggleFavorite(Long userId, Long productId) {
        if (favoriteRepository.existsByUserIdAndProductId(userId, productId)) {
            favoriteRepository.deleteByUserIdAndProductId(userId, productId);
            return new FavoriteToggleResponse(false, "Eliminado de favoritos");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

        if (product.getStatus() == Product.Status.DELETED) {
            throw new ProductNotFoundException(productId);
        }

        favoriteRepository.save(new Favorite(user, product));
        log.info("User {} added product {} to favorites", userId, productId);
        return new FavoriteToggleResponse(true, "Agregado a favoritos");
    }

    @Transactional(readOnly = true)
    public List<FavoriteProductDTO> getFavorites(Long userId) {
        return favoriteRepository.findByUserId(userId).stream()
                .map(Favorite::getProduct)
                .filter(product -> product.getStatus() != Product.Status.DELETED)
                .map(FavoriteProductDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isFavorite(Long userId, Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ProductNotFoundException(productId);
        }
        return favoriteRepository.existsByUserIdAndProductId(userId, productId);
    }

    public record FavoriteToggleResponse(boolean isFavorite, String message) {
    }

    public record FavoriteCheckResponse(boolean isFavorite) {
    }
}
