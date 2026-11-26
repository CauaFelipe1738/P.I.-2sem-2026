package com.edulytics.backend_spring.alunos.dto;

import com.edulytics.backend_spring.alunos.Aluno;

import java.time.LocalDate;
import java.util.List;

public record AlunoResponseDTO(
    Long id,
    String nomeCompleto,
    LocalDate dataNascimento,
    LocalDate dataIngresso,
    String matriculaEscolar,
    List<Long> turmaIds,
    List<Long> cursoIds
) {
    public static AlunoResponseDTO from(Aluno aluno) {
        return from(aluno, List.of(), List.of());
    }

    public static AlunoResponseDTO from(Aluno aluno, List<Long> turmaIds, List<Long> cursoIds) {
        return new AlunoResponseDTO(
            aluno.getId(),
            aluno.getNomeCompleto(),
            aluno.getDataNascimento(),
            aluno.getDataIngresso(),
            aluno.getMatricula(),
            turmaIds != null ? turmaIds : List.of(),
            cursoIds != null ? cursoIds : List.of()
        );
    }
}
