package com.routine.repository;

import com.routine.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByOrderByDisplayOrderAsc();

    Optional<Category> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
