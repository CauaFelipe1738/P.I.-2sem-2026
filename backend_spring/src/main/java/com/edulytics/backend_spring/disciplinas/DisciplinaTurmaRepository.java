package com.edulytics.backend_spring.disciplinas;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DisciplinaTurmaRepository extends JpaRepository<DisciplinaTurma, Long> {
    List<DisciplinaTurma> findByTurmaId(Long turmaId);
}
