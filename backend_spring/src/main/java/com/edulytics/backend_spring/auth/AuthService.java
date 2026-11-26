package com.edulytics.backend_spring.auth;

import com.edulytics.backend_spring.auditoria.AuditoriaService;
import com.edulytics.backend_spring.auth.dto.LoginRequest;
import com.edulytics.backend_spring.auth.dto.LoginResponse;
import com.edulytics.backend_spring.auth.dto.UsuarioResumoDTO;
import com.edulytics.backend_spring.common.exception.DomainRuleException;
import com.edulytics.backend_spring.security.AuthenticatedUser;
import com.edulytics.backend_spring.security.JwtService;
import com.edulytics.backend_spring.usuarios.Usuario;
import com.edulytics.backend_spring.usuarios.UsuarioRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditoriaService auditoriaService;

    public AuthService(
        UsuarioRepository usuarioRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        AuditoriaService auditoriaService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditoriaService = auditoriaService;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(request.email().trim())
            .orElseThrow(() -> new BadCredentialsException("Credenciais inválidas."));

        if (!passwordEncoder.matches(request.senha(), usuario.getSenhaHash())) {
            throw new BadCredentialsException("Credenciais inválidas.");
        }

        if (!usuario.isAtivo()) {
            throw new DomainRuleException("Usuário inativo", "Acesso bloqueado para usuário inativo.");
        }

        usuario.registrarAcesso(Instant.now());
        usuarioRepository.save(usuario);

        UsuarioResumoDTO resumo = toResumo(usuario);
        auditoriaService.registrarComUsuario(usuario.getId(), "usuario", "LOGIN", null, resumo);

        String token = jwtService.generateToken(usuario);
        return new LoginResponse(
            token,
            "Bearer",
            jwtService.getExpirationSeconds(),
            resumo
        );
    }

    public UsuarioResumoDTO toResumo(Usuario usuario) {
        boolean isProfessor = "Professor".equalsIgnoreCase(usuario.getCargo());
        boolean isAluno = "Aluno".equalsIgnoreCase(usuario.getCargo());
        return new UsuarioResumoDTO(
            usuario.getId(),
            usuario.getEmail(),
            usuario.getCargo(),
            isProfessor ? usuario.getPerfilId() : null,
            isAluno ? usuario.getPerfilId() : null,
            usuario.getNomeCompleto()
        );
    }

    public UsuarioResumoDTO fromPrincipal(AuthenticatedUser principal) {
        boolean isProfessor = "Professor".equalsIgnoreCase(principal.cargo());
        boolean isAluno = "Aluno".equalsIgnoreCase(principal.cargo());
        return new UsuarioResumoDTO(
            principal.usuarioId(),
            principal.email(),
            principal.cargo(),
            isProfessor ? principal.perfilId() : null,
            isAluno ? principal.perfilId() : null,
            principal.nomeCompleto()
        );
    }
}
