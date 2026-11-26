package com.edulytics.backend_spring.avaliacoes;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "aluno_avaliacao")
public class AlunoAvaliacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "avaliacao_id", nullable = false)
    private Long avaliacaoId;

    @Column(name = "aluno_id", nullable = false)
    private Long alunoId;

    @Column(precision = 5, scale = 2)
    private BigDecimal nota;

    @Column(length = 1000)
    private String observacao;

    protected AlunoAvaliacao() {
    }

    public AlunoAvaliacao(Long avaliacaoId, Long alunoId, BigDecimal nota, String observacao) {
        this.avaliacaoId = avaliacaoId;
        this.alunoId = alunoId;
        this.nota = nota;
        this.observacao = observacao != null ? observacao : "";
    }

    public void atualizarNota(BigDecimal nota, String observacao) {
        this.nota = nota;
        if (observacao != null) {
            this.observacao = observacao;
        }
    }

    public Long getId() {
        return id;
    }

    public Long getAvaliacaoId() {
        return avaliacaoId;
    }

    public Long getAlunoId() {
        return alunoId;
    }

    public BigDecimal getNota() {
        return nota;
    }

    public String getObservacao() {
        return observacao;
    }
}
