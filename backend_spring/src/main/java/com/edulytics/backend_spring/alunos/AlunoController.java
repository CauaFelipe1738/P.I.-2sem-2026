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
}