package com.edulytics.backend_spring.alunos;

import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.net.URI;
import java.util.List;
import java.util.Optional;

@Service
public class AlunoService {

    private final AlunoRepository alunoRepository;

    // Injeção de dependência via construtor (forma recomendada)
    public AlunoService(AlunoRepository alunoRepository) {
        this.alunoRepository = alunoRepository;
    }

    // Buscar todos os alunos
    public Page<Aluno> listarTodos(Pageable pageable) {
        return alunoRepository.findAll(pageable);
    }

    // Buscar aluno por id
    public Optional<Aluno> read(Long requestedId) {
        return alunoRepository.findById(requestedId);
    }

    // Criar aluno
    public URI create(Aluno newAluno, UriComponentsBuilder ucb) {
        Aluno novoAluno = new Aluno(
            null, newAluno.nomeCompleto(), newAluno.dataNascimento(),
            newAluno.dataIngresso(), newAluno.matricula()
        );
        Aluno alunoSalvo = alunoRepository.save(novoAluno);
        return ucb.path("aluno/{id}").buildAndExpand(alunoSalvo.id()).toUri();
    }

    // Atualiza aluno
    public void update(Long requestedId, Aluno alunoUpdate) {
        Aluno updatedAluno = new Aluno(
            requestedId, alunoUpdate.nomeCompleto(), alunoUpdate.dataNascimento(),
            alunoUpdate.dataIngresso(), alunoUpdate.matricula()
        );
        alunoRepository.save(updatedAluno);
    }

    // Deleta aluno
    public void delete(Long requestedId) {
        alunoRepository.deleteById(requestedId);
    }
}
