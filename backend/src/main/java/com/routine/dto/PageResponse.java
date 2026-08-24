package com.routine.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Bọc kết quả phân trang trả ra client (tránh lộ cấu trúc Page của Spring).
 */
@Getter
@AllArgsConstructor
public class PageResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}
