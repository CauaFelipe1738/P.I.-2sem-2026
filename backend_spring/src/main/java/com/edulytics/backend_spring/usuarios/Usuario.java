package com.edulytics.backend_spring.usuarios;

import com.edulytics.backend_spring.common.exception.DomainRuleException;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "senha_hash", nullable = false, length = 255)
    private String senhaHash;

    @Column(name = "nome_completo", nullable = false, length = 150)
    private String nomeCompleto;

    @Column(nullable = false, length = 40)
    private String cargo;

    @Column(name = "perfil_id")
    private Long perfilId;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private Instant dataCriacao;

    @Column(name = "ultimo_acesso")
    private Instant ultimoAcesso;

    protected Usuario() {
    }

    public Usuario(
        String email,
        String senhaHash,
        String nomeCompleto,
        String cargo,
        Long perfilId,
        boolean ativo,
        Instant dataCriacao
    ) {
        this.email = email;
        this.senhaHash = senhaHash;
        this.nomeCompleto = nomeCompleto;
        this.cargo = cargo;
        this.perfilId = perfilId;
        this.ativo = ativo;
        this.dataCriacao = dataCriacao != null ? dataCriacao : Instant.now();
    }

    /**
     * Registra acesso do usuário conforme matriz USU-001..005 (#55).
     */
    public void registrarAcesso(Instant momento) {
        if (!this.ativo) {
            throw new DomainRuleException("Usuário inativo", "Usuário inativo não pode registrar acesso.");
        }
        this.ultimoAcesso = momento != null ? momento : Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getSenhaHash() {
        return senhaHash;
    }

    public String getNomeCompleto() {
        return nomeCompleto;
    }

    public String getCargo() {
        return cargo;
    }

    public Long getPerfilId() {
        return perfilId;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }

    public Instant getDataCriacao() {
        return dataCriacao;
    }

    public Instant getUltimoAcesso() {
        return ultimoAcesso;
    }
}
