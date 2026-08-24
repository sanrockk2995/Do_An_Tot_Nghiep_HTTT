package com.routine.service;

import com.routine.entity.CartItem;
import com.routine.entity.Product;
import com.routine.entity.ProductVariant;
import com.routine.entity.WishlistItem;
import com.routine.exception.BadRequestException;
import com.routine.exception.ResourceNotFoundException;
import com.routine.repository.CartItemRepository;
import com.routine.repository.ProductRepository;
import com.routine.repository.ProductVariantRepository;
import com.routine.repository.WishlistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Giỏ hàng & yêu thích của khách đang đăng nhập.
 */
@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;

    // ==================== GIỎ HÀNG ====================

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCart(Long customerId) {
        return cartItemRepository.findByCustomerWithProduct(customerId).stream()
                .map(this::toCartMap)
                .toList();
    }

    /** Thêm vào giỏ: trùng sản phẩm + size + màu thì cộng dồn số lượng (không vượt tồn kho biến thể). */
    @Transactional
    public List<Map<String, Object>> addToCart(Long customerId, Long productId,
                                               String size, String color, Integer quantity) {
        Product product = getProduct(productId);
        if (!"ACTIVE".equals(product.getStatus())) {
            throw new BadRequestException("Sản phẩm đã ngừng bán");
        }
        if (quantity == null || quantity < 1) quantity = 1;

        // Tồn khả dụng của đúng biến thể (size/màu) — nếu không truyền size/màu thì dùng tồn tổng
        int available = product.getStock();
        if (size != null && !size.isBlank() && color != null && !color.isBlank()) {
            ProductVariant variant = variantRepository
                    .findByProductIdAndSizeAndColor(productId, size, color)
                    .orElseThrow(() -> new BadRequestException(
                            "Sản phẩm không có biến thể size " + size + ", màu " + color));
            available = variant.getStock();
        }

        var existing = cartItemRepository
                .findByCustomerIdAndProductIdAndSizeAndColor(customerId, productId, size, color);
        CartItem item;
        if (existing.isPresent()) {
            item = existing.get();
            long newQty = (long) item.getQuantity() + quantity;
            if (newQty > available) {
                throw new BadRequestException("Vượt quá số hàng còn lại trong kho (còn "
                        + available + ", trong giỏ đã có " + item.getQuantity() + ")");
            }
            item.setQuantity(item.getQuantity() + quantity);
        } else {
            if (quantity > available) {
                throw new BadRequestException("Sản phẩm chỉ còn " + available + " sản phẩm");
            }
            item = CartItem.builder()
                    .customer(com.routine.entity.Customer.builder().id(customerId).build())
                    .product(product)
                    .quantity(quantity)
                    .size(size)
                    .color(color)
                    .build();
        }
        cartItemRepository.save(item);
        return getCart(customerId);
    }

    @Transactional
    public List<Map<String, Object>> updateQuantity(Long customerId, Long itemId, Integer quantity) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mục giỏ hàng"));
        if (!item.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("Không có quyền sửa giỏ hàng này");
        }
        if (quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            // Không cho sửa số lượng vượt tồn khả dụng của biến thể/tổng
            int available = item.getProduct().getStock();
            if (item.getSize() != null && !item.getSize().isBlank()
                    && item.getColor() != null && !item.getColor().isBlank()) {
                available = variantRepository
                        .findByProductIdAndSizeAndColor(item.getProduct().getId(), item.getSize(), item.getColor())
                        .map(ProductVariant::getStock)
                        .orElse(item.getProduct().getStock());
            }
            if (quantity > available) {
                throw new BadRequestException("Sản phẩm '" + item.getProduct().getName()
                        + "' chỉ còn " + available + " sản phẩm");
            }
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }
        return getCart(customerId);
    }

    @Transactional
    public void removeItem(Long customerId, Long itemId) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mục giỏ hàng"));
        if (!item.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("Không có quyền xoá mục này");
        }
        cartItemRepository.delete(item);
    }

    @Transactional
    public void clearCart(Long customerId) {
        cartItemRepository.findByCustomerWithProduct(customerId)
                .forEach(cartItemRepository::delete);
    }

    // ==================== YÊU THÍCH ====================

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getWishlist(Long customerId) {
        return wishlistItemRepository.findByCustomerWithProduct(customerId).stream()
                .map(w -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", w.getId());
                    map.put("productId", w.getProduct().getId());
                    map.put("code", w.getProduct().getCode());
                    map.put("name", w.getProduct().getName());
                    map.put("price", w.getProduct().getPrice());
                    map.put("oldPrice", w.getProduct().getOldPrice());
                    map.put("imageUrl", w.getProduct().getImageUrl());
                    map.put("rating", w.getProduct().getRating());
                    map.put("stock", w.getProduct().getStock());
                    return map;
                })
                .toList();
    }

    @Transactional
    public List<Map<String, Object>> addToWishlist(Long customerId, Long productId) {
        Product product = getProduct(productId);
        if (!wishlistItemRepository.existsByCustomerIdAndProductId(customerId, productId)) {
            wishlistItemRepository.save(WishlistItem.builder()
                    .customer(com.routine.entity.Customer.builder().id(customerId).build())
                    .product(product)
                    .build());
        }
        return getWishlist(customerId);
    }

    @Transactional
    public void removeFromWishlist(Long customerId, Long productId) {
        wishlistItemRepository.findByCustomerIdAndProductId(customerId, productId)
                .ifPresent(wishlistItemRepository::delete);
    }

    // ==================== Helpers =================

    private Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm #" + id));
    }

    private Map<String, Object> toCartMap(CartItem c) {
        Product p = c.getProduct();
        BigDecimal lineTotal = p.getPrice().multiply(BigDecimal.valueOf(c.getQuantity()));
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", c.getId());
        map.put("productId", p.getId());
        map.put("code", p.getCode());
        map.put("name", p.getName());
        map.put("imageUrl", p.getImageUrl());
        map.put("price", p.getPrice());
        map.put("oldPrice", p.getOldPrice());
        map.put("quantity", c.getQuantity());
        map.put("size", c.getSize());
        map.put("color", c.getColor());
        map.put("lineTotal", lineTotal);
        map.put("stock", p.getStock());
        return map;
    }
}
