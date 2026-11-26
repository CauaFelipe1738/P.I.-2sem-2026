package com.edulytics.backend_spring.avaliacoes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public final class AvaliacaoDTOs {
    private AvaliacaoDTOs() {}

    public record AvaliacaoRequest(
        @NotNull(message = "Disciplina da turma é obrigatória.") Long disciplinaTurmaId,
        Long periodoId,
        @NotBlank(message = "Nome da avaliação é obrigatório.") String nomeAvaliacao,
        String tipoAvaliacao,
        String descricao,
        @NotNull(message = "Data da avaliação é obrigatória.") LocalDate dataAvaliacao,
        @NotNull(message = "Valor total é obrigatório.") BigDecimal valorTotal,
        @NotNull(message = "Peso é obrigatório.") BigDecimal peso,
        String status
    ) {}

    public record AvaliacaoUpdateRequest(
        String nomeAvaliacao,
        String tipoAvaliacao,
        String descricao,
        LocalDate dataAvaliacao,
        BigDecimal valorTotal,
        BigDecimal peso,
        String status
    ) {}

    public record AvaliacaoDTO(
        Long id,
        Long disciplinaTurmaId,
        Long professorId,
        Long periodoId,
        String nomeAvaliacao,
        String tipoAvaliacao,
        String descricao,
        LocalDate dataAvaliacao,
        BigDecimal valorTotal,
        BigDecimal peso,
        String status,
        String disciplinaNome,
        String turmaNome,
        Long turmaId
    ) {}

    public record NotaRequest(
        @NotNull(message = "Informe a nota do aluno.") BigDecimal nota,
        String observacao
    ) {}

    public record AlunoAvaliacaoDTO(
        Long id,
        Long avaliacaoId,
        Long alunoId,
        String alunoNome,
        BigDecimal nota,
        String observacao,
        BigDecimal valorTotal
    ) {}
}
