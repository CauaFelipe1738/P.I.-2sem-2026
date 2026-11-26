package com.edulytics.backend_spring.professores;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProfessorDisciplinaTurmaRepository extends JpaRepository<ProfessorDisciplinaTurma, Long> {
    List<ProfessorDisciplinaTurma> findByProfessorId(Long professorId);
}
