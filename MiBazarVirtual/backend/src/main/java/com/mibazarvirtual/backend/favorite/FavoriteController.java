package com.mibazarvirtual.backend.favorite;

import com.mibazarvirtual.backend.common.dto.ApiResponse;
import com.mibazarvirtual.backend.favorite.FavoriteService.FavoriteCheckResponse;
import com.mibazarvirtual.backend.favorite.FavoriteService.FavoriteToggleResponse;
import com.mibazarvirtual.backend.security.AuthenticatedUserResolver;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse<FavoriteToggleResponse>> toggleFavorite(
            @PathVariable Long productId,
            Authentication authentication
    ) {
        Long userId = authenticatedUserResolver.currentUserId(authentication);
        FavoriteToggleResponse response = favoriteService.toggleFavorite(userId, productId);
        return ResponseEntity.ok(ApiResponse.ok(response, response.message()));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FavoriteProductDTO>>> getFavorites(Authentication authentication) {
        Long userId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(favoriteService.getFavorites(userId), "Favoritos"));
    }

    @GetMapping("/{productId}/check")
    public ResponseEntity<ApiResponse<FavoriteCheckResponse>> isFavorite(
            @PathVariable Long productId,
            Authentication authentication
    ) {
        Long userId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(
                new FavoriteCheckResponse(favoriteService.isFavorite(userId, productId)),
                "Estado de favorito"
        ));
    }
}
