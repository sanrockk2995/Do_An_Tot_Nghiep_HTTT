package com.routine.service;

import com.routine.dto.ReportDtos;
import com.routine.repository.CustomerRepository;
import com.routine.repository.OrderRepository;
import com.routine.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Báo cáo thống kê: doanh thu theo ngày/tháng/năm,
 * sản phẩm bán chạy, cảnh báo tồn kho.
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public ReportDtos.OverviewResponse overview(LocalDateTime from, LocalDateTime to) {
        BigDecimal revenue = orderRepository.sumRevenueBetween(from, to);
        long orderCount = orderRepository.countOrdersBetween(from, to);
        long productsSold = orderRepository.countProductsSoldBetween(from, to);
        BigDecimal avg = orderCount > 0
                ? revenue.divide(BigDecimal.valueOf(orderCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        long lowStock = productRepository
                .findByStockLessThanEqualAndStatus(10, "ACTIVE").size();

        return ReportDtos.OverviewResponse.builder()
                .revenue(revenue)
                .orderCount(orderCount)
                .productsSold(productsSold)
                .avgOrderValue(avg)
                .lowStockCount(lowStock)
                .activeProductCount(productRepository.findByStatusOrderByCreatedAtDesc("ACTIVE",
                        org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements())
                .customerCount(customerRepository.count())
                .build();
    }

    /**
     * Doanh thu nhóm theo thời gian cho biểu đồ tăng trưởng.
     * groupBy: day | month | year
     */
    @Transactional(readOnly = true)
    public List<ReportDtos.RevenuePoint> revenueByPeriod(LocalDateTime from, LocalDateTime to, String groupBy) {
        String pattern = switch (groupBy != null ? groupBy : "day") {
            case "month" -> "%Y-%m";
            case "year" -> "%Y";
            default -> "%Y-%m-%d";
        };
        List<Object[]> rows = orderRepository.sumRevenueGrouped(pattern, from, to);
        List<ReportDtos.RevenuePoint> points = new ArrayList<>();
        for (Object[] row : rows) {
            String period = String.valueOf(row[0]);
            BigDecimal revenue = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            long count = row[2] != null ? Long.parseLong(row[2].toString()) : 0;
            points.add(new ReportDtos.RevenuePoint(period, revenue, count));
        }
        return points;
    }

    @Transactional(readOnly = true)
    public List<ReportDtos.BestSellingRow> bestSelling(int limit) {
        List<Object[]> rows = productRepository.findBestSelling(limit);
        List<ReportDtos.BestSellingRow> result = new ArrayList<>();
        for (Object[] row : rows) {
            // native query trả mảng theo thứ tự cột của products + sold
            @SuppressWarnings("unchecked")
            Object[] tuple = row;
            Long id = ((Number) tuple[0]).longValue();
            String code = (String) tuple[1];
            String name = (String) tuple[2];
            BigDecimal price = tuple[5] != null ? new BigDecimal(tuple[5].toString()) : BigDecimal.ZERO;
            long sold = tuple[tuple.length - 1] != null
                    ? Long.parseLong(tuple[tuple.length - 1].toString()) : 0;
            result.add(ReportDtos.BestSellingRow.builder()
                    .productId(id).code(code).name(name).price(price)
                    .soldQuantity(sold)
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<ReportDtos.LowStockRow> lowStock() {
        return productRepository.findByStockLessThanEqualAndStatus(10, "ACTIVE").stream()
                .map(p -> ReportDtos.LowStockRow.builder()
                        .productId(p.getId()).code(p.getCode()).name(p.getName())
                        .stock(p.getStock()).minStock(p.getMinStock())
                        .build())
                .toList();
    }

    /** Mặc định: từ đầu tháng tới hiện tại. */
    public static LocalDateTime defaultFrom() {
        return LocalDate.now().withDayOfMonth(1).atStartOfDay();
    }

    public static LocalDateTime defaultTo() {
        return LocalDate.now().plusDays(1).atStartOfDay();
    }
}
