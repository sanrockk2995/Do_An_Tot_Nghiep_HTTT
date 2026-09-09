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
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
     * groupBy: day | month | year.
     * Tự động bù các mốc thời gian không có phát sinh đơn để biểu đồ liền mạch.
     */
    @Transactional(readOnly = true)
    public List<ReportDtos.RevenuePoint> revenueByPeriod(LocalDateTime from, LocalDateTime to, String groupBy) {
        String type = (groupBy != null && !groupBy.isBlank()) ? groupBy.trim().toLowerCase() : "day";
        String pattern = switch (type) {
            case "month" -> "%Y-%m";
            case "year" -> "%Y";
            default -> "%Y-%m-%d";
        };
        List<Object[]> rows = orderRepository.sumRevenueGrouped(pattern, from, to);
        Map<String, ReportDtos.RevenuePoint> existingMap = new LinkedHashMap<>();
        for (Object[] row : rows) {
            String period = String.valueOf(row[0]);
            BigDecimal revenue = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            long count = row[2] != null ? Long.parseLong(row[2].toString()) : 0;
            existingMap.put(period, new ReportDtos.RevenuePoint(period, revenue, count));
        }

        List<ReportDtos.RevenuePoint> points = new ArrayList<>();
        if (from != null && to != null && !from.isAfter(to)) {
            LocalDate startDate = from.toLocalDate();
            LocalDate endDate = to.toLocalDate();
            if (to.toLocalTime().equals(LocalTime.MIN) && endDate.isAfter(startDate)) {
                endDate = endDate.minusDays(1);
            }
            if (endDate.isBefore(startDate)) {
                endDate = startDate;
            }

            switch (type) {
                case "month" -> {
                    YearMonth startMonth = YearMonth.from(startDate);
                    YearMonth endMonth = YearMonth.from(endDate);
                    DateTimeFormatter ymFmt = DateTimeFormatter.ofPattern("yyyy-MM");
                    YearMonth curr = startMonth;
                    while (!curr.isAfter(endMonth)) {
                        String key = curr.format(ymFmt);
                        points.add(existingMap.getOrDefault(key, new ReportDtos.RevenuePoint(key, BigDecimal.ZERO, 0L)));
                        curr = curr.plusMonths(1);
                    }
                }
                case "year" -> {
                    int startYear = startDate.getYear();
                    int endYear = endDate.getYear();
                    for (int y = startYear; y <= endYear; y++) {
                        String key = String.valueOf(y);
                        points.add(existingMap.getOrDefault(key, new ReportDtos.RevenuePoint(key, BigDecimal.ZERO, 0L)));
                    }
                }
                default -> {
                    DateTimeFormatter dayFmt = DateTimeFormatter.ISO_LOCAL_DATE;
                    LocalDate curr = startDate;
                    long daysDiff = ChronoUnit.DAYS.between(startDate, endDate);
                    if (daysDiff <= 366) {
                        while (!curr.isAfter(endDate)) {
                            String key = curr.format(dayFmt);
                            points.add(existingMap.getOrDefault(key, new ReportDtos.RevenuePoint(key, BigDecimal.ZERO, 0L)));
                            curr = curr.plusDays(1);
                        }
                    } else {
                        for (Object[] row : rows) {
                            String period = String.valueOf(row[0]);
                            points.add(existingMap.get(period));
                        }
                    }
                }
            }
        } else {
            for (Object[] row : rows) {
                String period = String.valueOf(row[0]);
                BigDecimal revenue = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
                long count = row[2] != null ? Long.parseLong(row[2].toString()) : 0;
                points.add(new ReportDtos.RevenuePoint(period, revenue, count));
            }
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
