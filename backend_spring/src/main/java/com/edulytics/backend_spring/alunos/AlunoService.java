package com.edulytics.backend_spring.alunos;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class AlunoService {

    private final AlunoRepository alunoRepository;

    public AlunoService(AlunoRepository alunoRepository) {
        this.alunoRepository = alunoRepository;
    }

    public Page<Aluno> listarTodos(String q, Pageable pageable) {
        if (q != null && !q.trim().isEmpty()) {
            String term = q.trim();
            return alunoRepository.findByNomeCompletoContainingIgnoreCaseOrMatriculaContainingIgnoreCase(
                term,
                term,
                pageable
            );
        }
        return alunoRepository.findAll(pageable);
    }
}
