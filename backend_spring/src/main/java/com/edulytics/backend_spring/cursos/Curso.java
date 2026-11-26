package com.edulytics.backend_spring.cursos;

import jakarta.persistence.*;

@Entity
@Table(name = "curso")
public class Curso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String nome;

    @Column(length = 1000)
    private String descricao;

    @Column(name = "carga_horaria", nullable = false)
    private Integer cargaHoraria;

    @Column(nullable = false, length = 30)
    private String status;

    protected Curso() {
    }

    public Curso(String nome, String descricao, Integer cargaHoraria, String status) {
        this.nome = nome;
        this.descricao = descricao;
        this.cargaHoraria = cargaHoraria;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getDescricao() {
        return descricao;
    }

    public Integer getCargaHoraria() {
        return cargaHoraria;
    }

    public String getStatus() {
        return status;
    }
}
