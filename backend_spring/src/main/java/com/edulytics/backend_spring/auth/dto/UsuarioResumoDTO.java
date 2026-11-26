package com.edulytics.backend_spring.auth.dto;

public record UsuarioResumoDTO(
    Long idUsuario,
    String email,
    String cargo,
    Long professorId,
    Long alunoId,
    String nomeCompleto
) {}
