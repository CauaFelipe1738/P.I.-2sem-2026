package com.edulytics.backend_spring.auth.dto;

public record LoginResponse(
    String accessToken,
    String tokenType,
    long expiresIn,
    UsuarioResumoDTO usuario
) {}
