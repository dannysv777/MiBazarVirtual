package com.mibazarvirtual.backend;

import java.time.Instant;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping({"/", "/api"})
    public ResponseEntity<Map<String, Object>> home() {
        return ResponseEntity.ok(Map.of(
                "app", "MiBazarVirtual API",
                "status", "running",
                "health", "/actuator/health",
                "products", "/api/products",
                "stores", "/api/stores",
                "categories", "/api/categories",
                "timestamp", Instant.now()
        ));
    }
}
