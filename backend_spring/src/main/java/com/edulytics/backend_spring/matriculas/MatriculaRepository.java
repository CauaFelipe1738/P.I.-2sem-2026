package com.edulytics.backend_spring.matriculas;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatriculaRepository extends JpaRepository<Matricula, Long> {
    List<Matricula> findByTurmaIdAndStatus(Long turmaId, Matricula.Status status);
    List<Matricula> findByTurmaId(Long turmaId);
    List<Matricula> findByAlunoId(Long alunoId);
}
