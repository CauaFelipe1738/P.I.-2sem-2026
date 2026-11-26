package com.edulytics.backend_spring.frequencias;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FrequenciaRepository extends JpaRepository<Frequencia, Long> {
    List<Frequencia> findByAulaId(Long aulaId);
    Optional<Frequencia> findByAulaIdAndAlunoId(Long aulaId, Long alunoId);
    List<Frequencia> findByAlunoId(Long alunoId);
}
