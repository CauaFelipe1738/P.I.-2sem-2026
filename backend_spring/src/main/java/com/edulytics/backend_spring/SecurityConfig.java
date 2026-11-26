package com.edulytics.backend_spring; // ajuste o pacote

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // útil enquanto testa no Swagger
            .authorizeHttpRequests(auth -> auth
                // libera o Swagger
                .requestMatchers(
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**",
                    "/v3/api-docs",
                    "/webjars/**"
                ).permitAll()
                
                // libera os endpoints da aplicação (ajuste conforme seus paths)
                .requestMatchers("/alunos/**").permitAll()
                // ou libere tudo temporariamente:
                // .anyRequest().permitAll()
                
                .anyRequest().authenticated()
            );

        return http.build();
    }
}