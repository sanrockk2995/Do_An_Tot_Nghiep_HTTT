package com.routine.repository;

import com.routine.entity.PhieuXuatKho;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhieuXuatKhoRepository extends JpaRepository<PhieuXuatKho, Long> {

    List<PhieuXuatKho> findAllByOrderByNgayXuatDesc();

    boolean existsByMaPhieuXuat(String maPhieuXuat);
}
