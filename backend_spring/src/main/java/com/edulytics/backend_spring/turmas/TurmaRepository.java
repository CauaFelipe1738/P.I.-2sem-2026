package com.edulytics.backend_spring.turmas;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TurmaRepository extends JpaRepository<Turma, Long> {
    List<Turma> findByCursoId(Long cursoId);
}
