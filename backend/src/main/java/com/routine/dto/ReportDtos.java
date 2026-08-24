package com.routine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

public class ReportDtos {

    /** Một dòng trong biểu đồ doanh thu theo thời gian. */
    public record RevenuePoint(String period, BigDecimal revenue, long orderCount) {
    }

    /** Tổng quan dashboard. */
    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class OverviewResponse {
        private BigDecimal revenue;          // doanh thu trong khoảng
        private long orderCount;             // số đơn trong khoảng
        private long productsSold;           // số sản phẩm bán ra trong khoảng
        private BigDecimal avgOrderValue;    // giá trị TB / đơn
        private long lowStockCount;          // số sản phẩm sắp hết hàng
        private long activeProductCount;     // tổng sản phẩm đang bán
        private long customerCount;          // tổng khách hàng
    }

    /** Sản phẩm bán chạy. */
    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class BestSellingRow {
        private Long productId;
        private String code;
        private String name;
        private BigDecimal price;
        private String imageUrl;
        private long soldQuantity;
    }

    /** Cảnh báo hàng sắp hết. */
    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class LowStockRow {
        private Long productId;
        private String code;
        private String name;
        private Integer stock;
        private Integer minStock;
    }
}
