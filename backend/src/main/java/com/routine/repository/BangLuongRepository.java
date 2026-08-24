package com.routine.repository;

import com.routine.entity.BangLuong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BangLuongRepository extends JpaRepository<BangLuong, Long> {

    Optional<BangLuong> findByUserIdAndThangAndNam(Long userId, Integer thang, Integer nam);

    List<BangLuong> findByThangAndNam(Integer thang, Integer nam);

    @Query("""
            SELECT COALESCE(SUM(b.luongCoBan * b.heSo + b.phuCap + b.thuong - b.khauTru), 0)
            FROM BangLuong b
            WHERE (:thang IS NULL OR b.thang = :thang)
              AND (:nam IS NULL OR b.nam = :nam)
            """)
    java.math.BigDecimal tongQuyLuong(@Param("thang") Integer thang, @Param("nam") Integer nam);
}
