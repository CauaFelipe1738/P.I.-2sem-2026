package com.edulytics.backend_spring.aulas.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public final class AulaDTOs {
    private AulaDTOs() {}

    public record AulaRequest(
        @NotNull(message = "Disciplina da turma é obrigatória.") Long disciplinaTurmaId,
        @NotNull(message = "Data da aula é obrigatória.") LocalDate dataAula,
        @NotNull(message = "Horário inicial é obrigatório.") LocalTime horarioInicio,
        @NotNull(message = "Horário final é obrigatório.") LocalTime horarioFim,
        String conteudo,
        String status
    ) {}

    public record AulaUpdateRequest(
        LocalDate dataAula,
        LocalTime horarioInicio,
        LocalTime horarioFim,
        String conteudo,
        String status
    ) {}

    public record AulaRealizarRequest(String conteudo) {}

    public record AulaDTO(
        Long id,
        Long disciplinaTurmaId,
        Long professorId,
        LocalDate dataAula,
        LocalTime horarioInicio,
        LocalTime horarioFim,
        String conteudo,
        String status,
        String disciplinaNome,
        String turmaNome,
        Long turmaId,
        String professorNome
    ) {}

    public record FrequenciaItemRequest(
        @NotNull(message = "Aluno é obrigatório.") Long alunoId,
        String statusPresenca,
        String justificativa,
        List<String> checklistAula,
        String observacao
    ) {}

    public record FrequenciaLoteRequest(List<FrequenciaItemRequest> itens) {}

    public record FrequenciaUpdateRequest(
        String statusPresenca,
        String justificativa,
        List<String> checklistAula,
        String observacao
    ) {}

    public record FrequenciaItemDTO(
        Long id,
        Long aulaId,
        Long alunoId,
        String alunoNome,
        String statusPresenca,
        boolean presente,
        String justificativa,
        List<String> checklistAula,
        String observacao
    ) {}
}
