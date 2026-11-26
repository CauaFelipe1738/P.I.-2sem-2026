package com.edulytics.backend_spring.common.config;

import com.edulytics.backend_spring.alunos.Aluno;
import com.edulytics.backend_spring.alunos.AlunoRepository;
import com.edulytics.backend_spring.usuarios.Usuario;
import com.edulytics.backend_spring.usuarios.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.LocalDate;

@Configuration
@Profile("!prod")
public class DevSeedConfig {

    @Bean
    CommandLineRunner seedDevData(
        UsuarioRepository usuarioRepository,
        AlunoRepository alunoRepository,
        PasswordEncoder passwordEncoder
    ) {
        return args -> {
            if (usuarioRepository.count() == 0) {
                usuarioRepository.save(new Usuario(
                    "ana@exemplo.com",
                    passwordEncoder.encode("123456"),
                    "Ana Martins",
                    "Professor",
                    1L,
                    true,
                    Instant.now()
                ));
                usuarioRepository.save(new Usuario(
                    "carla@exemplo.com",
                    passwordEncoder.encode("123456"),
                    "Carla Souza",
                    "Aluno",
                    1L,
                    true,
                    Instant.now()
                ));
                usuarioRepository.save(new Usuario(
                    "inativo@exemplo.com",
                    passwordEncoder.encode("123456"),
                    "Usuário Inativo",
                    "Aluno",
                    99L,
                    false,
                    Instant.now()
                ));
            }

            if (alunoRepository.count() == 0) {
                alunoRepository.save(new Aluno("Carla Souza", LocalDate.of(2004, 5, 12), LocalDate.of(2026, 2, 2), "2026001"));
                alunoRepository.save(new Aluno("Diego Lima", LocalDate.of(2003, 9, 21), LocalDate.of(2026, 2, 2), "2026002"));
                alunoRepository.save(new Aluno("Elisa Costa", LocalDate.of(2004, 11, 3), LocalDate.of(2026, 2, 2), "2026003"));
            }
        };
    }
}
