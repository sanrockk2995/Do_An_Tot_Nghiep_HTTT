package com.routine.repository;

import com.routine.entity.ChiTietPhieuNhap;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChiTietPhieuNhapRepository extends JpaRepository<ChiTietPhieuNhap, Long> {

    List<ChiTietPhieuNhap> findByPhieuNhapId(Long phieuNhapId);
}
