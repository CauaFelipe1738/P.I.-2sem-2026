package com.edulytics.backend_spring.alunos;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;


interface AlunoRepository extends CrudRepository<Aluno, Long>, PagingAndSortingRepository<Aluno, Long> {
  
}
