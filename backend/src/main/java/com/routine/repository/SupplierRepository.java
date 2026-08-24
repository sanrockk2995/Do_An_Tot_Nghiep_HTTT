package com.routine.repository;

import com.routine.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    @Query("""
            SELECT s FROM Supplier s
            WHERE LOWER(s.tenNcc) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(s.maNcc) LIKE LOWER(CONCAT('%', :q, '%'))
            """)
    List<Supplier> search(@Param("q") String q);
}
