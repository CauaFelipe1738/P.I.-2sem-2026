package com.edulytics.backend_spring.comentarios;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComentarioRepository extends JpaRepository<Comentario, Long> {
    List<Comentario> findByAlunoIdAndVisivelAlunoTrue(Long alunoId);
}
