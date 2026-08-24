package com.routine.repository;

import com.routine.entity.ChiTietKiemKe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChiTietKiemKeRepository extends JpaRepository<ChiTietKiemKe, Long> {

    List<ChiTietKiemKe> findByKiemKeId(Long kiemKeId);
}
