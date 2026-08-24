package com.routine.repository;

import com.routine.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findByRole(String role);

    /** Nhân viên phụ trách mặc định cho đơn khách tự đặt online. */
    Optional<User> findFirstByOrderByIdAsc();
}
