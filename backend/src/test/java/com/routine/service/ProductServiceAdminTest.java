package com.routine.service;

import com.routine.dto.ProductDtos;
import com.routine.entity.Category;
import com.routine.entity.Product;
import com.routine.entity.ProductVariant;
import com.routine.exception.BadRequestException;
import com.routine.exception.ResourceNotFoundException;
import com.routine.repository.CategoryRepository;
import com.routine.repository.ProductRepository;
import com.routine.repository.ProductReviewRepository;
import com.routine.repository.ProductVariantRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceAdminTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository variantRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductReviewRepository reviewRepository;

    @InjectMocks
    private ProductService productService;

    // ==========================================
    // 1. ProductService.create(ProductRequest)
    // Decision Table: docs/decision-tables/ProductService_create.md
    // ==========================================

    @Test
    @DisplayName("R1: create() ném ResourceNotFoundException khi categoryId không tồn tại")
    void test_create_categoryNotFound_throwsResourceNotFoundException() {
        ProductDtos.ProductRequest req = new ProductDtos.ProductRequest();
        req.setCategoryId(999L);
        req.setCode("SP01");
        req.setName("Sản phẩm mẫu");

        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.create(req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy danh mục #999");

        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("R2: create() ném BadRequestException khi danh sách biến thể bị trùng cặp (size + color)")
    void test_create_duplicateVariantsSizeColor_throwsBadRequestException() {
        ProductDtos.ProductRequest req = new ProductDtos.ProductRequest();
        req.setCategoryId(1L);
        req.setCode("AO-POLO-01");
        req.setName("Áo Polo Classic");

        Category mockCategory = Category.builder().id(1L).name("Áo").build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(mockCategory));

        // Hai biến thể cùng size M, màu Trắng
        List<ProductDtos.VariantInput> duplicateVariants = List.of(
                new ProductDtos.VariantInput(null, "M", "Trắng", 10, "SKU-M-WHITE-1"),
                new ProductDtos.VariantInput(null, "M", "Trắng", 15, "SKU-M-WHITE-2")
        );
        req.setVariants(duplicateVariants);

        assertThatThrownBy(() -> productService.create(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Biến thể bị trùng (cặp size + màu phải khác nhau)");

        verify(productRepository, never()).save(any());
        verify(variantRepository, never()).save(any());
    }

    @Test
    @DisplayName("R3: create() tính tổng stock từ các biến thể, tự sinh SKU nếu null và lưu đầy đủ biến thể")
    void test_create_validWithVariants_calculatesTotalStockAndAutoSku() {
        Long catId = 1L;
        Category mockCategory = Category.builder().id(catId).name("Áo Sơ Mi").build();
        when(categoryRepository.findById(catId)).thenReturn(Optional.of(mockCategory));

        List<ProductDtos.VariantInput> variants = List.of(
                new ProductDtos.VariantInput(null, "M", "Trắng", 20, null), // sku null -> auto sinh
                new ProductDtos.VariantInput(null, "L", "Đen", 30, "CUSTOM-SKU-L-BLACK")
        );

        ProductDtos.ProductRequest req = new ProductDtos.ProductRequest();
        req.setCategoryId(catId);
        req.setCode("SM01");
        req.setName("Áo Sơ Mi Oxford");
        req.setPrice(new BigDecimal("350000"));
        req.setCostPrice(new BigDecimal("180000"));
        req.setMinStock(15);
        req.setVariants(variants);

        when(productRepository.save(any(Product.class))).thenAnswer(i -> {
            Product p = i.getArgument(0);
            p.setId(100L);
            return p;
        });

        ProductDtos.ProductResponse response = productService.create(req);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(100L);

        ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(productCaptor.capture());
        Product savedProduct = productCaptor.getValue();

        // Tổng stock = 20 + 30 = 50
        assertThat(savedProduct.getStock()).isEqualTo(50);
        assertThat(savedProduct.getMinStock()).isEqualTo(15);
        assertThat(savedProduct.getStatus()).isEqualTo("ACTIVE");

        ArgumentCaptor<ProductVariant> variantCaptor = ArgumentCaptor.forClass(ProductVariant.class);
        verify(variantRepository, times(2)).save(variantCaptor.capture());
        List<ProductVariant> savedVariants = variantCaptor.getAllValues();

        assertThat(savedVariants.get(0).getSku()).isEqualTo("SM01-M-Trắng");
        assertThat(savedVariants.get(0).getStock()).isEqualTo(20);
        assertThat(savedVariants.get(1).getSku()).isEqualTo("CUSTOM-SKU-L-BLACK");
        assertThat(savedVariants.get(1).getStock()).isEqualTo(30);
    }

    @Test
    @DisplayName("R4: create() không truyền biến thể thì dùng fallback stock từ request và minStock mặc định là 10")
    void test_create_withoutVariants_usesFallbackStockAndDefaultMinStock() {
        Long catId = 2L;
        Category mockCategory = Category.builder().id(catId).name("Quần").build();
        when(categoryRepository.findById(catId)).thenReturn(Optional.of(mockCategory));

        ProductDtos.ProductRequest req = new ProductDtos.ProductRequest();
        req.setCategoryId(catId);
        req.setCode("QUAN-TAY-01");
        req.setName("Quần Tây Slimfit");
        req.setPrice(new BigDecimal("450000"));
        req.setStock(55);
        req.setMinStock(null); // Không truyền minStock -> default 10
        req.setVariants(null); // Không truyền variants

        when(productRepository.save(any(Product.class))).thenAnswer(i -> {
            Product p = i.getArgument(0);
            p.setId(101L);
            return p;
        });

        ProductDtos.ProductResponse response = productService.create(req);

        ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(productCaptor.capture());
        Product savedProduct = productCaptor.getValue();

        assertThat(savedProduct.getStock()).isEqualTo(55);
        assertThat(savedProduct.getMinStock()).isEqualTo(10);
        assertThat(savedProduct.getStatus()).isEqualTo("ACTIVE");
        verify(variantRepository, never()).save(any());
    }

    // ==========================================
    // 2. ProductService.softDelete(id)
    // Decision Table: docs/decision-tables/ProductService_softDelete.md
    // ==========================================

    @Test
    @DisplayName("R1: softDelete() ném ResourceNotFoundException khi không tìm thấy sản phẩm")
    void test_softDelete_productNotFound_throwsResourceNotFoundException() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.softDelete(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy sản phẩm #999");

        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("R2: softDelete() cập nhật status = INACTIVE và lưu vào DB")
    void test_softDelete_existingProduct_setsStatusInactive() {
        Long productId = 50L;
        Product existingProduct = Product.builder()
                .id(productId)
                .code("SP50")
                .name("Áo Khoác")
                .status("ACTIVE")
                .build();

        when(productRepository.findById(productId)).thenReturn(Optional.of(existingProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));

        productService.softDelete(productId);

        assertThat(existingProduct.getStatus()).isEqualTo("INACTIVE");
        verify(productRepository).save(existingProduct);
    }

    // ==========================================
    // 3. ProductService.validateSearchQuery(q)
    // Bảo mật & chuẩn hóa dữ liệu tìm kiếm cho admin
    // ==========================================

    @Test
    @DisplayName("validateSearchQuery() bỏ qua khi query là null hoặc blank")
    void test_validateSearchQuery_blankQuery_doesNothing() {
        productService.validateSearchQuery(null);
        productService.validateSearchQuery("");
        productService.validateSearchQuery("    ");
    }

    @Test
    @DisplayName("validateSearchQuery() ném BadRequestException khi query vượt quá 100 ký tự")
    void test_validateSearchQuery_queryTooLong_throwsBadRequestException() {
        String longQuery = "a".repeat(101);

        assertThatThrownBy(() -> productService.validateSearchQuery(longQuery))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("độ dài tối đa 100 ký tự");
    }

    @ParameterizedTest(name = "Phát hiện SQL Injection: {0}")
    @ValueSource(strings = {
            "Áo sơ mi' OR '1'='1",
            "Quần jeans; DROP TABLE products--",
            "SELECT * FROM users",
            "áo khoác UNION SELECT null, null"
    })
    @DisplayName("validateSearchQuery() ném BadRequestException khi phát hiện ký tự hoặc mã độc SQL")
    void test_validateSearchQuery_sqlInjection_throwsBadRequestException(String maliciousSql) {
        assertThatThrownBy(() -> productService.validateSearchQuery(maliciousSql))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("chứa ký tự đặc biệt hoặc mã độc SQL");
    }

    @ParameterizedTest(name = "Phát hiện XSS: {0}")
    @ValueSource(strings = {
            "<script>alert(1)</script>",
            "javascript:void(0)",
            "img onerror=alert(1)"
    })
    @DisplayName("validateSearchQuery() ném BadRequestException khi phát hiện mã độc XSS")
    void test_validateSearchQuery_xssPattern_throwsBadRequestException(String maliciousXss) {
        assertThatThrownBy(() -> productService.validateSearchQuery(maliciousXss))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("chứa ký tự đặc biệt hoặc mã độc SQL");
    }

    @Test
    @DisplayName("validateSearchQuery() chấp nhận từ khóa tìm kiếm hợp lệ (chữ tiếng Việt, số, dấu gạch)")
    void test_validateSearchQuery_validQuery_passesValidation() {
        productService.validateSearchQuery("Áo Sơ Mi Nam Oxford - Trắng");
        productService.validateSearchQuery("Quần Jean #01 / Size L");
    }
}
