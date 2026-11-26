package com.edulytics.backend_spring.professores;

import jakarta.persistence.*;

@Entity
@Table(name = "professor")
public class Professor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @Column(name = "nome_completo", nullable = false, length = 150)
    private String nomeCompleto;

    @Column(length = 150)
    private String formacao;

    protected Professor() {
    }

    public Professor(Long usuarioId, String nomeCompleto, String formacao) {
        this.usuarioId = usuarioId;
        this.nomeCompleto = nomeCompleto;
        this.formacao = formacao;
    }

    public Long getId() {
        return id;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public String getNomeCompleto() {
        return nomeCompleto;
    }

    public String getFormacao() {
        return formacao;
    }
}
