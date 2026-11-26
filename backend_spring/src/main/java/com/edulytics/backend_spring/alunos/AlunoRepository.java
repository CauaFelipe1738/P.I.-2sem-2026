package com.edulytics.backend_spring.alunos;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlunoRepository extends JpaRepository<Aluno, Long> {
    Page<Aluno> findByNomeCompletoContainingIgnoreCaseOrMatriculaContainingIgnoreCase(
        String nomeCompleto,
        String matricula,
        Pageable pageable
    );
}
