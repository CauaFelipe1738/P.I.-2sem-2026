package com.edulytics.backend_spring.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "E-mail é obrigatório.")
    @Email(message = "Informe um e-mail válido.")
    String email,

    @NotBlank(message = "Senha é obrigatória.")
    String senha
) {}
