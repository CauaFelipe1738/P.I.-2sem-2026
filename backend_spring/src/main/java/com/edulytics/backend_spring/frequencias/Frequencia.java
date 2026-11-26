package com.edulytics.backend_spring.frequencias;

import jakarta.persistence.*;

@Entity
@Table(name = "frequencia")
public class Frequencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "aula_id", nullable = false)
    private Long aulaId;

    @Column(name = "aluno_id", nullable = false)
    private Long alunoId;

    @Column(nullable = false)
    private boolean presente;

    @Column(length = 500)
    private String justificativa;

    @Column(name = "status_presenca", nullable = false, length = 30)
    private String statusPresenca = "PRESENTE";

    @Column(name = "checklist_aula", length = 2000)
    private String checklistAula;

    @Column(length = 1000)
    private String observacao;

    protected Frequencia() {
    }

    public Frequencia(
        Long aulaId,
        Long alunoId,
        String statusPresenca,
        String justificativa,
        String checklistAula,
        String observacao
    ) {
        this.aulaId = aulaId;
        this.alunoId = alunoId;
        aplicarStatus(statusPresenca, justificativa, checklistAula, observacao);
    }

    public void aplicarStatus(
        String statusPresenca,
        String justificativa,
        String checklistAula,
        String observacao
    ) {
        String norm = statusPresenca != null ? statusPresenca.trim().toUpperCase() : "PRESENTE";
        this.statusPresenca = norm;
        this.presente = "PRESENTE".equals(norm) || "ATRASO".equals(norm);
        this.justificativa = justificativa != null ? justificativa : "";
        this.checklistAula = checklistAula != null ? checklistAula : "[]";
        this.observacao = observacao != null ? observacao : "";
    }

    public Long getId() {
        return id;
    }

    public Long getAulaId() {
        return aulaId;
    }

    public Long getAlunoId() {
        return alunoId;
    }

    public boolean isPresente() {
        return presente;
    }

    public String getJustificativa() {
        return justificativa;
    }

    public String getStatusPresenca() {
        return statusPresenca;
    }

    public String getChecklistAula() {
        return checklistAula;
    }

    public String getObservacao() {
        return observacao;
    }
}
