package com.edulytics.backend_spring.comentarios;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "comentario")
public class Comentario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "aluno_id", nullable = false)
    private Long alunoId;

    @Column(name = "professor_id", nullable = false)
    private Long professorId;

    @Column(name = "disciplina_turma_id")
    private Long disciplinaTurmaId;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(nullable = false, length = 30)
    private String tipo;

    @Column(nullable = false, length = 30)
    private String classificacao;

    @Column(nullable = false, length = 2000)
    private String descricao;

    @Column(name = "data_comentario", nullable = false)
    private Instant dataComentario;

    @Column(name = "checklist_itens", length = 2000)
    private String checklistItens;

    @Column(name = "acao_acompanhamento", length = 1000)
    private String acaoAcompanhamento;

    @Column(name = "visivel_aluno", nullable = false)
    private boolean visivelAluno = false;

    protected Comentario() {
    }

    public Comentario(
        Long alunoId,
        Long professorId,
        Long disciplinaTurmaId,
        String titulo,
        String tipo,
        String classificacao,
        String descricao,
        String checklistItens,
        String acaoAcompanhamento,
        Boolean visivelAluno,
        Instant dataComentario
    ) {
        this.alunoId = alunoId;
        this.professorId = professorId;
        this.disciplinaTurmaId = disciplinaTurmaId;
        this.titulo = titulo;
        this.tipo = tipo != null && !tipo.isBlank() ? tipo.trim().toUpperCase() : "DESEMPENHO";
        this.classificacao = classificacao != null && !classificacao.isBlank() ? classificacao.trim().toUpperCase() : "NEUTRO";
        this.descricao = descricao;
        this.checklistItens = checklistItens != null ? checklistItens : "[]";
        this.acaoAcompanhamento = acaoAcompanhamento != null ? acaoAcompanhamento : "";
        this.visivelAluno = Boolean.TRUE.equals(visivelAluno);
        this.dataComentario = dataComentario != null ? dataComentario : Instant.now();
    }

    public void atualizar(
        String titulo,
        String tipo,
        String classificacao,
        String descricao,
        String checklistItens,
        String acaoAcompanhamento,
        Boolean visivelAluno
    ) {
        if (titulo != null && !titulo.isBlank()) this.titulo = titulo;
        if (tipo != null && !tipo.isBlank()) this.tipo = tipo.trim().toUpperCase();
        if (classificacao != null && !classificacao.isBlank()) this.classificacao = classificacao.trim().toUpperCase();
        if (descricao != null && !descricao.isBlank()) this.descricao = descricao;
        if (checklistItens != null) this.checklistItens = checklistItens;
        if (acaoAcompanhamento != null) this.acaoAcompanhamento = acaoAcompanhamento;
        if (visivelAluno != null) this.visivelAluno = visivelAluno;
    }

    public Long getId() {
        return id;
    }

    public Long getAlunoId() {
        return alunoId;
    }

    public Long getProfessorId() {
        return professorId;
    }

    public Long getDisciplinaTurmaId() {
        return disciplinaTurmaId;
    }

    public String getTitulo() {
        return titulo;
    }

    public String getTipo() {
        return tipo;
    }

    public String getClassificacao() {
        return classificacao;
    }

    public String getDescricao() {
        return descricao;
    }

    public Instant getDataComentario() {
        return dataComentario;
    }

    public String getChecklistItens() {
        return checklistItens;
    }

    public String getAcaoAcompanhamento() {
        return acaoAcompanhamento;
    }

    public boolean isVisivelAluno() {
        return visivelAluno;
    }
}
