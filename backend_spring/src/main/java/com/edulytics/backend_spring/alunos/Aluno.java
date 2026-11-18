package com.edulytics.backend_spring.alunos;

import java.time.LocalDate;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;

@Entity
public record Aluno(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id,
    
    String nomeCompleto,
    LocalDate dataNascimento,
    LocalDate dataIngresso,
    String matricula
) {}