package com.edulytics.backend_spring.academico.dto;

import java.time.LocalDate;

public final class AcademicoDTOs {
    private AcademicoDTOs() {}

    public record CursoResumoDTO(
        Long id,
        String nome,
        String descricao,
        Integer cargaHoraria,
        String status,
        long totalAlunos
    ) {}

    public record PeriodoDTO(
        Long id,
        String nomePeriodo,
        Integer anoLetivo,
        LocalDate dataInicio,
        LocalDate dataFim
    ) {}

    public record TurmaDTO(
        Long id,
        Long cursoId,
        Long periodoId,
        String nomeTurma,
        String turno,
        String status
    ) {}

    public record DisciplinaInfoDTO(
        Long id,
        String nome,
        String descricao,
        Integer cargaHoraria
    ) {}

    public record DisciplinaTurmaDTO(
        Long disciplinaTurmaId,
        Long turmaId,
        String turmaNome,
        Long cursoId,
        DisciplinaInfoDTO disciplina
    ) {}

    public record AlunoTurmaDTO(
        Long alunoId,
        Long matriculaId,
        String nomeCompleto,
        String matriculaEscolar,
        String statusMatricula
    ) {}

    public record MatriculaStatusRequest(String acao) {}

    public record MatriculaDTO(
        Long id,
        Long alunoId,
        Long turmaId,
        String status,
        LocalDate dataMatricula,
        LocalDate dataDesligamento
    ) {}
}
