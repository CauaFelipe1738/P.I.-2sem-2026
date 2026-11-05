package com.edulytics.backend_spring.alunos;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

@Service
public class AlunoService {

    private final AlunoRepository alunoRepository;

    // Injeção de dependência via construtor (forma recomendada)
    public AlunoService(AlunoRepository alunoRepository) {
        this.alunoRepository = alunoRepository;
    }

    // Buscar todos os usuários
    public Page<Aluno> listarTodos(Pageable pageable) {
        return alunoRepository.findAll(pageable);
    }
}
