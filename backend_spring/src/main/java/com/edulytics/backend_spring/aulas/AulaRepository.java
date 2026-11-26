package com.edulytics.backend_spring.aulas;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AulaRepository extends JpaRepository<Aula, Long> {
    List<Aula> findByDisciplinaTurmaId(Long disciplinaTurmaId);
}
