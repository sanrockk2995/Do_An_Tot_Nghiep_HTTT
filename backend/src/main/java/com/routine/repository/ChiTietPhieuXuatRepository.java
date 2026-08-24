package com.routine.repository;

import com.routine.entity.ChiTietPhieuXuat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChiTietPhieuXuatRepository extends JpaRepository<ChiTietPhieuXuat, Long> {

    List<ChiTietPhieuXuat> findByPhieuXuatId(Long phieuXuatId);
}
