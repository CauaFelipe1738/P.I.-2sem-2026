package com.edulytics.backend_spring.comentarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;

public final class ComentarioDTOs {
    private ComentarioDTOs() {}

    public record ComentarioRequest(
        @NotNull(message = "Aluno é obrigatório.") Long alunoId,
        Long disciplinaTurmaId,
        @NotBlank(message = "Título é obrigatório.") String titulo,
        String tipo,
        String classificacao,
        @NotBlank(message = "Descrição é obrigatória.") String descricao,
        List<String> checklistItens,
        String acaoAcompanhamento,
        Boolean visivelAluno
    ) {}

    public record ComentarioUpdateRequest(
        String titulo,
        String tipo,
        String classificacao,
        String descricao,
        List<String> checklistItens,
        String acaoAcompanhamento,
        Boolean visivelAluno
    ) {}

    public record ComentarioDTO(
        Long id,
        Long alunoId,
        Long professorId,
        Long disciplinaTurmaId,
        String titulo,
        String tipo,
        String classificacao,
        String descricao,
        List<String> checklistItens,
        String acaoAcompanhamento,
        boolean visivelAluno,
        Instant dataComentario,
        String alunoNome,
        String professorNome,
        String disciplinaNome,
        String turmaNome
    ) {}
}
