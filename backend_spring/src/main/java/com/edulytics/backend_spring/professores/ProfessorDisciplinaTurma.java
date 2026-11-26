package com.edulytics.backend_spring.professores;

import jakarta.persistence.*;

@Entity
@Table(name = "professor_disciplina_turma")
public class ProfessorDisciplinaTurma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "professor_id", nullable = false)
    private Long professorId;

    @Column(name = "disciplina_turma_id", nullable = false)
    private Long disciplinaTurmaId;

    protected ProfessorDisciplinaTurma() {
    }

    public ProfessorDisciplinaTurma(Long professorId, Long disciplinaTurmaId) {
        this.professorId = professorId;
        this.disciplinaTurmaId = disciplinaTurmaId;
    }

    public Long getId() {
        return id;
    }

    public Long getProfessorId() {
        return professorId;
    }

    public Long getDisciplinaTurmaId() {
        return disciplinaTurmaId;
    }
}
