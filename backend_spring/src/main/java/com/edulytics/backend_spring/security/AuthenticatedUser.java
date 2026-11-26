package com.edulytics.backend_spring.security;

public record AuthenticatedUser(
    Long usuarioId,
    String email,
    String cargo,
    String nomeCompleto,
    Long perfilId
) {}
