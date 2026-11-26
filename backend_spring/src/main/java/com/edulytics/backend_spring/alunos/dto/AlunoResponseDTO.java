package com.edulytics.backend_spring.alunos.dto;

import com.edulytics.backend_spring.alunos.Aluno;

import java.time.LocalDate;

public record AlunoResponseDTO(
    Long id,
    String nomeCompleto,
    LocalDate dataNascimento,
    LocalDate dataIngresso,
    String matriculaEscolar
) {
    public static AlunoResponseDTO from(Aluno aluno) {
        return new AlunoResponseDTO(
            aluno.getId(),
            aluno.getNomeCompleto(),
            aluno.getDataNascimento(),
            aluno.getDataIngresso(),
            aluno.getMatricula()
        );
    }
}
