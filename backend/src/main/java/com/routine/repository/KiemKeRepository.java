package com.routine.repository;

import com.routine.entity.KiemKe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KiemKeRepository extends JpaRepository<KiemKe, Long> {

    List<KiemKe> findAllByOrderByNgayKiemKeDesc();

    boolean existsByMaKiemKe(String maKiemKe);
}
