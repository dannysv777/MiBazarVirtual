// src/main/java/com/mibazarvirtual/backend/security/UserPrincipal.java
package com.mibazarvirtual.backend.security;

import java.security.Principal;

public record UserPrincipal(Long id, String username, String role) implements Principal {
    @Override
    public String getName() {
        return username;
    }
}
