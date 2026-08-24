package com.routine.repository;

import com.routine.entity.PhieuNhapKho;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhieuNhapKhoRepository extends JpaRepository<PhieuNhapKho, Long> {

    List<PhieuNhapKho> findAllByOrderByNgayNhapDesc();

    boolean existsByMaPhieuNhap(String maPhieuNhap);
}
