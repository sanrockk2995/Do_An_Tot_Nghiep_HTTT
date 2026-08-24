package com.routine.repository;

import com.routine.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Page<Customer> findByFullNameContainingIgnoreCaseOrPhoneContaining(
            String fullName, String phone, Pageable pageable);

    Optional<Customer> findByEmailIgnoreCase(String email);

    Optional<Customer> findByPhone(String phone);

    boolean existsByEmailIgnoreCase(String email);

    /** Tìm khách theo SĐT hoặc tên — phục vụ POS tra nhanh. */
    @Query("""
            SELECT c FROM Customer c
            WHERE LOWER(c.fullName) LIKE LOWER(CONCAT('%', :q, '%'))
               OR c.phone LIKE CONCAT('%', :q, '%')
               OR LOWER(COALESCE(c.email, '')) LIKE LOWER(CONCAT('%', :q, '%'))
            """)
    Page<Customer> search(@Param("q") String q, Pageable pageable);
}
