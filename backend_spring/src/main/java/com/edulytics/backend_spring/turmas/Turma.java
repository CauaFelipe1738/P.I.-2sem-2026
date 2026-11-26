package com.edulytics.backend_spring.turmas;

import jakarta.persistence.*;

@Entity
@Table(name = "turma")
public class Turma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "curso_id", nullable = false)
    private Long cursoId;

    @Column(name = "periodo_id", nullable = false)
    private Long periodoId;

    @Column(name = "nome_turma", nullable = false, length = 80)
    private String nomeTurma;

    @Column(nullable = false, length = 30)
    private String turno;

    @Column(nullable = false, length = 30)
    private String status;

    protected Turma() {
    }

    public Turma(Long cursoId, Long periodoId, String nomeTurma, String turno, String status) {
        this.cursoId = cursoId;
        this.periodoId = periodoId;
        this.nomeTurma = nomeTurma;
        this.turno = turno;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public Long getCursoId() {
        return cursoId;
    }

    public Long getPeriodoId() {
        return periodoId;
    }

    public String getNomeTurma() {
        return nomeTurma;
    }

    public String getTurno() {
        return turno;
    }

    public String getStatus() {
        return status;
    }
}
