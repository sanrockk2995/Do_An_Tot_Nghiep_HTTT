package com.routine.service;

import com.routine.dto.OtherDtos;
import com.routine.entity.Category;
import com.routine.exception.BadRequestException;
import com.routine.exception.ResourceNotFoundException;
import com.routine.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<OtherDtos.CategoryResponse> getAll() {
        return categoryRepository.findAllByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public OtherDtos.CategoryResponse create(OtherDtos.CategoryRequest request) {
        String slug = resolveSlug(request.getSlug(), request.getName());
        if (categoryRepository.existsBySlug(slug)) {
            throw new BadRequestException("Danh mục với slug '" + slug + "' đã tồn tại");
        }

        Category category = Category.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .icon(request.getIcon())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public OtherDtos.CategoryResponse update(Long id, OtherDtos.CategoryRequest request) {
        Category category = getCategory(id);
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setIcon(request.getIcon());
        if (request.getDisplayOrder() != null) {
            category.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }
        return toResponse(categoryRepository.save(category));
    }

    /** Xoá mềm: chuyển is_active = false. */
    @Transactional
    public void softDelete(Long id) {
        Category category = getCategory(id);
        category.setIsActive(false);
        categoryRepository.save(category);
    }

    private Category getCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục #" + id));
    }

    private String resolveSlug(String slug, String name) {
        String source = (slug == null || slug.isBlank()) ? name : slug;
        // Bỏ dấu tiếng Việt, lowercase, thay khoảng trắng bằng -
        String normalized = Normalizer.normalize(source.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace("đ", "d")
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");
        return normalized;
    }

    private OtherDtos.CategoryResponse toResponse(Category c) {
        return OtherDtos.CategoryResponse.builder()
                .id(c.getId()).name(c.getName()).slug(c.getSlug())
                .description(c.getDescription()).icon(c.getIcon())
                .displayOrder(c.getDisplayOrder()).isActive(c.getIsActive())
                .build();
    }
}
