package com.edulytics.backend_spring.disciplinas;

import jakarta.persistence.*;

@Entity
@Table(name = "disciplina_turma")
public class DisciplinaTurma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "disciplina_id", nullable = false)
    private Long disciplinaId;

    @Column(name = "turma_id", nullable = false)
    private Long turmaId;

    protected DisciplinaTurma() {
    }

    public DisciplinaTurma(Long disciplinaId, Long turmaId) {
        this.disciplinaId = disciplinaId;
        this.turmaId = turmaId;
    }

    public Long getId() {
        return id;
    }

    public Long getDisciplinaId() {
        return disciplinaId;
    }

    public Long getTurmaId() {
        return turmaId;
    }
}
