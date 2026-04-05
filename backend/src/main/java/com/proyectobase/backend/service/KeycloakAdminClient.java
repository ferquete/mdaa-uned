package com.proyectobase.backend.service;

import com.proyectobase.backend.config.AppProperties;
import com.proyectobase.backend.config.KeycloakProperties;
import com.proyectobase.backend.web.dto.RegisterUserRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * Cliente de administración de Keycloak para crear nuevos usuarios de forma reactiva.
 */
@Service
public class KeycloakAdminClient {

    private final WebClient webClient;
    private final KeycloakProperties keycloakProperties;
    private final AppProperties appProperties;

    public KeycloakAdminClient(WebClient.Builder webClientBuilder, 
                               KeycloakProperties keycloakProperties, 
                               AppProperties appProperties) {
        this.keycloakProperties = keycloakProperties;
        this.appProperties = appProperties;
        this.webClient = webClientBuilder.baseUrl(keycloakProperties.authServerUrl()).build();
    }

    /**
     * Registra un usuario nuevo en Keycloak.
     */
    public Mono<Void> registerUser(RegisterUserRequest request) {
        return getAdminAccessToken()
                .flatMap(token -> createUserInKeycloak(token, request));
    }

    @SuppressWarnings("unchecked")
    private Mono<String> getAdminAccessToken() {
        return webClient.post()
                .uri("/realms/{realm}/protocol/openid-connect/token", keycloakProperties.realm())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData("grant_type", "client_credentials")
                        .with("client_id", keycloakProperties.clientId())
                        .with("client_secret", keycloakProperties.clientSecret()))
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> (String) response.get("access_token"));
    }

    private Mono<Void> createUserInKeycloak(String accessToken, RegisterUserRequest request) {
        Map<String, Object> userRepresentation = Map.of(
                "firstName", request.firstName(),
                "lastName", request.lastName(),
                "email", request.email(),
                "username", request.email(),
                "enabled", true,
                "emailVerified", false,
                "credentials", List.of(
                        Map.of("type", "password", "value", request.password(), "temporary", false)
                ),
                "requiredActions", List.of("VERIFY_EMAIL")
        );

        return webClient.post()
                .uri("/admin/realms/{realm}/users", keycloakProperties.realm())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(userRepresentation)
                .retrieve()
                .toBodilessEntity()
                .flatMap(response -> {
                    String location = response.getHeaders().getFirst(HttpHeaders.LOCATION);
                    if (location != null) {
                        String userId = location.substring(location.lastIndexOf('/') + 1);
                        return sendVerificationEmail(accessToken, userId);
                    }
                    return Mono.empty();
                });
    }

    /**
     * Actualiza la información básica del usuario en Keycloak.
     */
    public Mono<Void> updateUser(String userId, com.proyectobase.backend.web.dto.UpdateUserRequest request) {
        return getAdminAccessToken()
                .flatMap(token -> performUpdate(token, userId, request));
    }

    private Mono<Void> performUpdate(String accessToken, String userId, com.proyectobase.backend.web.dto.UpdateUserRequest request) {
        Map<String, Object> userRepresentation = Map.of(
                "firstName", request.firstName(),
                "lastName", request.lastName()
        );

        return webClient.put()
                .uri("/admin/realms/{realm}/users/{id}", keycloakProperties.realm(), userId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(userRepresentation)
                .retrieve()
                .onStatus(status -> status.isError(), response -> 
                    response.bodyToMono(String.class)
                            .flatMap(body -> Mono.error(new RuntimeException("Error updating Keycloak user: " + body))))
                .bodyToMono(Void.class);
    }

    private Mono<Void> sendVerificationEmail(String accessToken, String userId) {
        MediaType mediaType = MediaType.APPLICATION_JSON;
        List<String> actions = List.of("VERIFY_EMAIL");
        
        // Usamos el redirect_uri configurado desde AppProperties
        return webClient.put()
                .uri(uriBuilder -> uriBuilder
                        .path("/admin/realms/{realm}/users/{id}/execute-actions-email")
                        .queryParam("client_id", "vue-frontend")
                        .queryParam("redirect_uri", appProperties.registration().redirectUri())
                        .build(keycloakProperties.realm(), userId))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .contentType(mediaType)
                .bodyValue(actions)
                .retrieve()
                .bodyToMono(Void.class);
    }
}
