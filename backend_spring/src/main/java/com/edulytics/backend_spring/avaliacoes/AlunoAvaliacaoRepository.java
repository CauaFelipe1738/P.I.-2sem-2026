package com.edulytics.backend_spring.avaliacoes;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AlunoAvaliacaoRepository extends JpaRepository<AlunoAvaliacao, Long> {
    List<AlunoAvaliacao> findByAvaliacaoId(Long avaliacaoId);
    Optional<AlunoAvaliacao> findByAvaliacaoIdAndAlunoId(Long avaliacaoId, Long alunoId);
    List<AlunoAvaliacao> findByAlunoId(Long alunoId);
}
