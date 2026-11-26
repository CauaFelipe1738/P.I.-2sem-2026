package com.edulytics.backend_spring.planos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public final class PlanoDTOs {
    private PlanoDTOs() {}

    public record PlanoRequest(
        @NotNull(message = "Aluno é obrigatório.") Long alunoId,
        Long disciplinaTurmaId,
        @NotBlank(message = "Dificuldade é obrigatória.") String dificuldade,
        @NotBlank(message = "Objetivo é obrigatório.") String objetivo,
        @NotBlank(message = "Ação proposta é obrigatória.") String acaoProposta,
        @NotNull(message = "Data de início é obrigatória.") LocalDate dataInicio,
        @NotNull(message = "Prazo é obrigatório.") LocalDate prazo,
        String status,
        String resultado
    ) {}

    public record PlanoUpdateRequest(
        String dificuldade,
        String objetivo,
        String acaoProposta,
        LocalDate dataInicio,
        LocalDate prazo,
        String status,
        String resultado
    ) {}

    public record PlanoDTO(
        Long id,
        Long alunoId,
        Long professorId,
        Long disciplinaTurmaId,
        String dificuldade,
        String objetivo,
        String acaoProposta,
        LocalDate dataInicio,
        LocalDate prazo,
        String status,
        String resultado,
        String alunoNome
    ) {}
}
