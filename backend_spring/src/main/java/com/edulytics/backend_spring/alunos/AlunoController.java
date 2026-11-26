package com.edulytics.backend_spring.alunos;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.security.Principal;

@RestController
@RequestMapping("/alunos")
class AlunoController {
    private final AlunoService alunoService;

    
    private AlunoController(AlunoService alunoService) {
        this.alunoService = alunoService;
    }
    
   @GetMapping 
    private ResponseEntity<List<Aluno>> findAll(Pageable pageable) {
        Page<Aluno> page = alunoService.listarTodos(pageable);
        return ResponseEntity.ok(page.getContent());
    }

    @GetMapping("/{requestedId}")
    private ResponseEntity<Aluno> read(@PathVariable Long requestedId) {
        Aluno aluno = alunoService.read(requestedId).orElse(null);
        if (aluno != null) {
            return ResponseEntity.ok(aluno);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    private ResponseEntity<Void> create(@RequestBody Aluno alunoRequest, UriComponentsBuilder ucb) {
        URI localDoAluno = alunoService.create(alunoRequest, ucb);
        return ResponseEntity.created(localDoAluno).build();
    }

    @PutMapping("/{requestedId}")
    private ResponseEntity<Void> update(@PathVariable Long requestedId, @RequestBody Aluno alunoUpdate) {
        Aluno aluno = alunoService.read(requestedId).orElse(null);
        if (aluno != null) {
            alunoService.update(requestedId, alunoUpdate);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{requestedId}")
    private ResponseEntity<Void> deleteCashCard(@PathVariable Long requestedId) {
        Aluno aluno = alunoService.read(requestedId).orElse(null);
        if (aluno != null) {
            alunoService.delete(requestedId);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}