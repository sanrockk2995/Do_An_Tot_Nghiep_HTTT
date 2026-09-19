package com.routine.service;

import com.routine.dto.OtherDtos;
import com.routine.entity.Category;
import com.routine.exception.BadRequestException;
import com.routine.exception.ResourceNotFoundException;
import com.routine.repository.CategoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    // ==========================================
    // 1. CategoryService.create(CategoryRequest)
    // Decision Table: docs/decision-tables/CategoryService_create.md
    // ==========================================

    @Test
    @DisplayName("R1: create() ném BadRequestException khi slug (sau chuẩn hóa) đã tồn tại trong DB")
    void test_create_duplicateSlug_throwsBadRequestException() {
        OtherDtos.CategoryRequest req = new OtherDtos.CategoryRequest();
        req.setName("Áo Sơ Mi Nam");
        req.setSlug("ao-so-mi-nam");

        when(categoryRepository.existsBySlug("ao-so-mi-nam")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Danh mục với slug 'ao-so-mi-nam' đã tồn tại");

        verify(categoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("R2: create() tự sinh slug chuẩn hóa từ tên tiếng Việt có dấu và gán default displayOrder=0, isActive=true")
    void test_create_vietnameseNameAutoSlugDefaultValues_success() {
        OtherDtos.CategoryRequest req = new OtherDtos.CategoryRequest();
        req.setName("Đầm & Chân Váy Nữ"); // Chứa ký tự tiếng Việt Đ, &, dấu cách
        req.setSlug(null);                // Tự sinh slug
        req.setDisplayOrder(null);        // Default: 0
        req.setIsActive(null);            // Default: true
        req.setDescription("Thời trang nữ");

        when(categoryRepository.existsBySlug(anyString())).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        OtherDtos.CategoryResponse response = categoryService.create(req);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getName()).isEqualTo("Đầm & Chân Váy Nữ");
        assertThat(response.getSlug()).isEqualTo("dam-chan-vay-nu"); // 'đ' -> 'd', bỏ ký tự đặc biệt &
        assertThat(response.getDisplayOrder()).isEqualTo(0);
        assertThat(response.getIsActive()).isTrue();

        ArgumentCaptor<Category> captor = ArgumentCaptor.forClass(Category.class);
        verify(categoryRepository).save(captor.capture());
        Category captured = captor.getValue();
        assertThat(captured.getSlug()).isEqualTo("dam-chan-vay-nu");
        assertThat(captured.getDisplayOrder()).isEqualTo(0);
        assertThat(captured.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("R3: create() sử dụng slug truyền vào và lưu đầy đủ displayOrder, isActive từ request")
    void test_create_explicitSlugAndFullAttributes_success() {
        OtherDtos.CategoryRequest req = new OtherDtos.CategoryRequest();
        req.setName("Quần Jeans Nam");
        req.setSlug("quan-jeans-custom");
        req.setDisplayOrder(5);
        req.setIsActive(false);
        req.setIcon("jeans-icon.svg");

        when(categoryRepository.existsBySlug("quan-jeans-custom")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category saved = invocation.getArgument(0);
            saved.setId(20L);
            return saved;
        });

        OtherDtos.CategoryResponse response = categoryService.create(req);

        assertThat(response.getId()).isEqualTo(20L);
        assertThat(response.getSlug()).isEqualTo("quan-jeans-custom");
        assertThat(response.getDisplayOrder()).isEqualTo(5);
        assertThat(response.getIsActive()).isFalse();
        assertThat(response.getIcon()).isEqualTo("jeans-icon.svg");
    }

    // ==========================================
    // 2. CategoryService.update(id, CategoryRequest)
    // Decision Table: docs/decision-tables/CategoryService_update.md
    // ==========================================

    @Test
    @DisplayName("R1: update() ném ResourceNotFoundException khi không tìm thấy danh mục theo ID")
    void test_update_categoryNotFound_throwsResourceNotFoundException() {
        OtherDtos.CategoryRequest req = new OtherDtos.CategoryRequest();
        req.setName("Tên Mới");

        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.update(999L, req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy danh mục #999");

        verify(categoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("R2: update() cập nhật đầy đủ tên, mô tả, icon, displayOrder và isActive")
    void test_update_allFieldsProvided_success() {
        Long catId = 1L;
        Category existing = Category.builder()
                .id(catId)
                .name("Tên Cũ")
                .slug("ten-cu")
                .description("Mô tả cũ")
                .icon("old.png")
                .displayOrder(1)
                .isActive(true)
                .build();

        when(categoryRepository.findById(catId)).thenReturn(Optional.of(existing));
        when(categoryRepository.save(any(Category.class))).thenAnswer(i -> i.getArgument(0));

        OtherDtos.CategoryRequest req = new OtherDtos.CategoryRequest();
        req.setName("Tên Mới Cập Nhật");
        req.setDescription("Mô tả mới");
        req.setIcon("new.png");
        req.setDisplayOrder(10);
        req.setIsActive(false);

        OtherDtos.CategoryResponse response = categoryService.update(catId, req);

        assertThat(response.getName()).isEqualTo("Tên Mới Cập Nhật");
        assertThat(response.getDescription()).isEqualTo("Mô tả mới");
        assertThat(response.getIcon()).isEqualTo("new.png");
        assertThat(response.getDisplayOrder()).isEqualTo(10);
        assertThat(response.getIsActive()).isFalse();
    }

    @Test
    @DisplayName("R3: update() không truyền displayOrder và isActive thì giữ nguyên giá trị cũ")
    void test_update_nullDisplayOrderAndIsActive_keepsExistingValues() {
        Long catId = 2L;
        Category existing = Category.builder()
                .id(catId)
                .name("Áo Polo")
                .slug("ao-polo")
                .displayOrder(3)
                .isActive(true)
                .build();

        when(categoryRepository.findById(catId)).thenReturn(Optional.of(existing));
        when(categoryRepository.save(any(Category.class))).thenAnswer(i -> i.getArgument(0));

        OtherDtos.CategoryRequest req = new OtherDtos.CategoryRequest();
        req.setName("Áo Polo Nam");
        req.setDescription("Polo cao cấp");
        req.setDisplayOrder(null); // Giữ cũ
        req.setIsActive(null);     // Giữ cũ

        OtherDtos.CategoryResponse response = categoryService.update(catId, req);

        assertThat(response.getName()).isEqualTo("Áo Polo Nam");
        assertThat(response.getDisplayOrder()).isEqualTo(3);
        assertThat(response.getIsActive()).isTrue();
    }

    // ==========================================
    // 3. CategoryService.softDelete(id)
    // Decision Table: docs/decision-tables/CategoryService_softDelete.md
    // ==========================================

    @Test
    @DisplayName("R1: softDelete() ném ResourceNotFoundException khi danh mục không tồn tại")
    void test_softDelete_categoryNotFound_throwsResourceNotFoundException() {
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.softDelete(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy danh mục #999");

        verify(categoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("R2: softDelete() chuyển trạng thái isActive = false và lưu vào DB")
    void test_softDelete_existingCategory_setsIsActiveFalse() {
        Long catId = 3L;
        Category existing = Category.builder()
                .id(catId)
                .name("Phụ Kiện")
                .isActive(true)
                .build();

        when(categoryRepository.findById(catId)).thenReturn(Optional.of(existing));
        when(categoryRepository.save(any(Category.class))).thenAnswer(i -> i.getArgument(0));

        categoryService.softDelete(catId);

        assertThat(existing.getIsActive()).isFalse();
        verify(categoryRepository).save(existing);
    }

    @Test
    @DisplayName("getAll() trả về danh sách danh mục đang active được sắp xếp theo thứ tự hiển thị")
    void test_getAll_returnsActiveCategoriesOrdered() {
        List<Category> categories = List.of(
                Category.builder().id(1L).name("Áo").displayOrder(1).isActive(true).build(),
                Category.builder().id(2L).name("Quần").displayOrder(2).isActive(true).build()
        );
        when(categoryRepository.findAllByIsActiveTrueOrderByDisplayOrderAsc()).thenReturn(categories);

        List<OtherDtos.CategoryResponse> result = categoryService.getAll();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("Áo");
        assertThat(result.get(1).getName()).isEqualTo("Quần");
    }
}
