package com.proyectobase.backend.config;

import com.proyectobase.backend.service.UserSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * Filtro que intercepta las peticiones autenticadas para sincronizar el usuario con la DB local.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserSessionFilter implements WebFilter {

    private final UserSyncService userSyncService;

    @Override
    @NonNull
    public Mono<Void> filter(@NonNull ServerWebExchange exchange, @NonNull WebFilterChain chain) {
        // Obtenemos el contexto de seguridad reactivo
        return ReactiveSecurityContextHolder.getContext()
                .filter(context -> context.getAuthentication() instanceof JwtAuthenticationToken)
                .map(context -> (JwtAuthenticationToken) context.getAuthentication())
                .flatMap(auth -> {
                    Jwt jwt = auth.getToken();
                    return userSyncService.syncUser(jwt);
                })
                .then(chain.filter(exchange))
                .doOnError(e -> log.error("Error synchronizing user session", e));
    }
}
