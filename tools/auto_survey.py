import sys
import time
import random
import argparse
import requests

# Đảm bảo in tiếng Việt chuẩn trên Windows
sys.stdout.reconfigure(encoding='utf-8')

FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSe_sTOcMPMbJcVCJR7_0s91tjCTvX69LclQwuTH3hXbdNe96A/formResponse"

ROLES = [
    ('Khách hàng mua sắm tại cửa hàng Routine Cầu Giấy', 0.70),
    ('Nhân viên bán hàng / Thu ngân', 0.10),
    ('Nhân viên quản lý kho', 0.10),
    ('Nhân viên kế toán', 0.05),
    ('Cấp quản lý cửa hàng', 0.05)
]

CUSTOMER_FEEDBACK_POOL = [
    "Mong cửa hàng sớm có website xem được số lượng size/màu còn tại chi nhánh Cầu Giấy để đỡ mất công qua thử.",
    "Rất thích phong cách Routine, mong hệ thống mới có tích điểm thành viên và ưu đãi sinh nhật rõ ràng hơn.",
    "Giờ cao điểm cuối tuần thanh toán hơi lâu, mong cửa hàng nâng cấp hệ thống thu ngân nhanh hơn.",
    "Giao diện đặt hàng online nếu có cần mượt mà, dễ chọn size trên điện thoại.",
    "Nên có chính sách đổi trả online tiện lợi hơn nếu mua nhầm size.",
    "Ủng hộ Routine số hóa hệ thống để phục vụ khách hàng tốt và chuyên nghiệp hơn!",
    "Mong có thêm tính năng đặt hàng online rồi ghé cửa hàng lấy ngay (Click & Collect).",
    "Nên có thông báo tự động qua Zalo hoặc tin nhắn khi sản phẩm hết hàng được restock.",
    "Hệ thống tra cứu voucher khuyến mãi tự động sẽ rất tiện lợi cho khách hàng.",
    "Chất lượng sản phẩm rất tốt, chỉ cần cải thiện tốc độ phục vụ lúc đông khách là tuyệt vời.",
    ""  # Để trống ngẫu nhiên phản ánh thực tế
]

STAFF_FEEDBACK_MAP = {
    'Nhân viên bán hàng / Thu ngân': [
        "Cần phần mềm POS mượt hơn, hỗ trợ quét QR thanh toán tự động không cần nhập số tiền bằng tay.",
        "Mong muốn tra cứu tồn kho theo size/màu ngay trên quầy thu ngân hoặc điện thoại để tư vấn khách nhanh.",
        "Phần mềm cần áp dụng khuyến mãi tự động chính xác để tránh nhầm lẫn khi thanh toán ca đông khách."
    ],
    'Nhân viên quản lý kho': [
        "Rất cần hệ thống quét mã vạch Barcode/QR khi nhập xuất kho và kiểm kê định kỳ.",
        "Cần tính năng cảnh báo tự động khi mã hàng nào chạm ngưỡng tồn kho tối thiểu.",
        "Mong phần mềm đồng bộ dữ liệu kho tức thời với số liệu bán lẻ tại quầy."
    ],
    'Nhân viên kế toán': [
        "Cần hỗ trợ xuất báo cáo doanh thu, sổ quỹ và công nợ nhà cung cấp ra định dạng Excel chuẩn.",
        "Tính năng tự động tổng hợp hoa hồng bán hàng theo nhân viên sẽ tiết kiệm rất nhiều thời gian cuối tháng."
    ],
    'Cấp quản lý cửa hàng': [
        "Hệ thống mới cần có Dashboard biểu đồ doanh thu theo ngày/tháng và cảnh báo tồn đọng vốn hàng chậm bán.",
        "Cần phân quyền bảo mật chặt chẽ giữa các bộ phận bán hàng, kho và kế toán."
    ]
}

def generate_random_response():
    # Chọn vai trò theo trọng số xác suất
    role_choices, role_weights = zip(*ROLES)
    role = random.choices(role_choices, weights=role_weights, k=1)[0]

    is_customer = (role == 'Khách hàng mua sắm tại cửa hàng Routine Cầu Giấy')

    # 1.2 Tần suất
    if is_customer:
        freq = random.choices(
            ['Lần đầu tiên', '1 – 2 lần / tháng', 'Hàng tuần'],
            weights=[0.15, 0.65, 0.20],
            k=1
        )[0]
    else:
        freq = 'Làm việc hàng ngày tại cửa hàng'

    # 2.1 Chất liệu vải (1-5)
    fabric_score = str(random.choices(['3', '4', '5'], weights=[0.10, 0.50, 0.40], k=1)[0])

    # 2.2 Form dáng (1-5)
    fit_score = str(random.choices(['3', '4', '5'], weights=[0.05, 0.50, 0.45], k=1)[0])

    # 2.3 Mức giá
    price_eval = random.choices(
        [
            'Giá quá cao so với chất lượng',
            'Hơi đắt nhưng chấp nhận được',
            'Hoàn toàn tương xứng với chất lượng',
            'Mức giá rất tốt và cạnh tranh'
        ],
        weights=[0.05, 0.35, 0.45, 0.15],
        k=1
    )[0]

    # 2.4 Hết size/màu
    out_of_stock = random.choices(
        [
            'Rất thường xuyên (Hầu như lần nào cũng gặp)',
            'Thỉnh thoảng gặp',
            'Hiếm khi gặp',
            'Chưa từng gặp'
        ],
        weights=[0.10, 0.60, 0.25, 0.05],
        k=1
    )[0]

    # 3.1 Tốc độ thanh toán (1-5)
    speed_score = str(random.choices(['3', '4', '5'], weights=[0.20, 0.55, 0.25], k=1)[0])

    # 3.2 Thái độ nhân viên (1-5)
    attitude_score = str(random.choices(['4', '5'], weights=[0.35, 0.65], k=1)[0])

    # 3.3 Bất tiện hiện nay (chọn 1-3 đáp án)
    inconvenience_pool = [
        'Nhân viên mất nhiều thời gian chạy vào kho tìm kiếm size/màu do không kiểm tra được tồn kho ngay',
        'Vào khung giờ cao điểm, khách xếp hàng thanh toán rất lâu',
        'Hệ thống thu ngân đôi khi bị lỗi, tính nhầm mã khuyến mãi hoặc áp sai chiết khấu',
        'Khách hàng không thể tra cứu trước mẫu mã và số lượng còn hàng tại cửa hàng qua website',
        'Khách không tự xem lại được lịch sử các lần mua sắm hoặc thông tin hóa đơn cũ',
        'Thủ tục kiểm tra điều kiện đổi trả hàng còn chậm và phụ thuộc vào kiểm tra chứng từ giấy tờ',
        'Số liệu hàng hóa giữa kho thực tế và sổ sách/phần mềm bán lẻ chưa trùng khớp ngay lập tức'
    ]
    inconveniences = random.sample(inconvenience_pool, k=random.randint(1, 3))

    # 3.4 Khó khăn nghiệp vụ nội bộ
    if is_customer:
        internal_difficulty = ['Tôi là khách hàng (Bỏ qua câu này)']
    else:
        internal_pool = [
            'Nhập - xuất kho và kiểm kê hàng hóa bằng Excel thủ công tốn nhiều công sức, dễ sai sót',
            'Không có cảnh báo tự động khi lượng hàng tồn kho chạm ngưỡng sắp hết',
            'Tổng hợp doanh thu, chấm công, tính lương và tính hoa hồng bán hàng cuối tháng rất mất thời gian',
            'Khó tra cứu và theo dõi công nợ, chứng từ các lô hàng từ nhà cung cấp',
            'Báo cáo doanh số theo ca làm việc còn phải tự tổng hợp bằng tay'
        ]
        internal_difficulty = random.sample(internal_pool, k=random.randint(1, 2))

    # 4.1 Sẵn sàng sử dụng website
    if is_customer:
        web_readiness = random.choices(
            [
                'Rất sẵn sàng và sẽ sử dụng thường xuyên',
                'Có sử dụng nếu có chính sách ưu đãi tốt',
                'Chỉ dùng để tra cứu sản phẩm trước khi đến thử tại cửa hàng'
            ],
            weights=[0.60, 0.30, 0.10],
            k=1
        )[0]
    else:
        web_readiness = 'Rất sẵn sàng và sẽ sử dụng thường xuyên'

    # 4.2 Chức năng khách hàng cần (chọn 2-4 chức năng)
    customer_func_pool = [
        'Xem chi tiết sản phẩm kèm theo bảng chọn size, chọn màu sắc và số lượng tồn trực quan',
        'Tìm kiếm và lọc sản phẩm thông minh theo loại sản phẩm, khoảng giá và kích cỡ',
        'Tự động áp dụng mã khuyến mãi/phiếu giảm giá khi tạo đơn đặt hàng',
        'Trang cá nhân quản lý tài khoản, xem toàn bộ lịch sử đơn hàng và trạng thái vận chuyển',
        'Tính năng đánh giá chất lượng sản phẩm (chấm số sao, viết nhận xét sau khi mua)'
    ]
    customer_funcs = random.sample(customer_func_pool, k=random.randint(2, 4))

    # 4.3 Chức năng vận hành nội bộ (chọn 2-4 chức năng)
    internal_func_pool = [
        'Tạo đơn hàng nhanh chóng tại quầy, hỗ trợ nhiều hình thức thanh toán (tiền mặt, quét mã QR ví điện tử, chuyển khoản)',
        'Tự động cập nhật giảm trừ số lượng tồn kho ngay khi phát sinh hóa đơn bán lẻ',
        'Hệ thống phiếu nhập kho, xuất kho và đối chiếu kiểm kê tự động hóa',
        'Cơ chế tự động cảnh báo sản phẩm chạm ngưỡng tồn kho tối thiểu',
        'Bảng thống kê trực quan về doanh thu theo ngày/tháng/năm và báo cáo sản phẩm bán chạy',
        'Phân quyền chặt chẽ giữa Quản lý, Nhân viên bán hàng, Thủ kho và Kế toán'
    ]
    internal_funcs = random.sample(internal_func_pool, k=random.randint(2, 4))

    # 4.4 Ý kiến đóng góp
    if is_customer:
        feedback = random.choice(CUSTOMER_FEEDBACK_POOL)
    else:
        feedback = random.choice(STAFF_FEEDBACK_MAP.get(role, ["Hệ thống cần vận hành ổn định và dễ dùng."]))

    return {
        'role': role,
        'freq': freq,
        'fabric_score': fabric_score,
        'fit_score': fit_score,
        'price_eval': price_eval,
        'out_of_stock': out_of_stock,
        'speed_score': speed_score,
        'attitude_score': attitude_score,
        'inconveniences': inconveniences,
        'internal_difficulty': internal_difficulty,
        'web_readiness': web_readiness,
        'customer_funcs': customer_funcs,
        'internal_funcs': internal_funcs,
        'feedback': feedback
    }

def submit_form(data):
    # Chuẩn bị payload data cho Google Form POST
    payload = [
        ('entry.214957020', data['role']),
        ('entry.2119937930', data['freq']),
        ('entry.237494711', data['fabric_score']),
        ('entry.787987812', data['fit_score']),
        ('entry.538044073', data['price_eval']),
        ('entry.965203164', data['out_of_stock']),
        ('entry.432487399', data['speed_score']),
        ('entry.1976315886', data['attitude_score']),
    ]

    # Multiple checkboxes
    for inc in data['inconveniences']:
        payload.append(('entry.1556361869', inc))

    for dif in data['internal_difficulty']:
        payload.append(('entry.1118442164', dif))

    payload.append(('entry.866271901', data['web_readiness']))

    for c_func in data['customer_funcs']:
        payload.append(('entry.593462388', c_func))

    for i_func in data['internal_funcs']:
        payload.append(('entry.1415612763', i_func))

    if data['feedback']:
        payload.append(('entry.306091527', data['feedback']))

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    response = requests.post(FORM_URL, data=payload, headers=headers)
    return response.status_code == 200

def main():
    parser = argparse.ArgumentParser(description="Tự động điền form khảo sát Routine Cầu Giấy với dữ liệu ngẫu nhiên")
    parser.add_argument("--count", type=int, default=10, help="Số lượt điền form (mặc định 10)")
    parser.add_argument("--delay", type=float, default=1.5, help="Thời gian chờ giữa các lần gửi (giây)")
    args = parser.parse_args()

    print(f"=== BẮT ĐẦU ĐIỀN FORM KHẢO SÁT ROUTINE CẦU GIẤY ===")
    print(f"Số lượng mục tiêu: {args.count} lượt\n")

    success_count = 0
    for i in range(1, args.count + 1):
        item = generate_random_response()
        print(f"[{i}/{args.count}] Đang gửi dữ liệu...")
        print(f"  - Đối tượng: {item['role']}")
        print(f"  - Tần suất: {item['freq']}")
        print(f"  - Điểm chất liệu: {item['fabric_score']}/5 | Form dáng: {item['fit_score']}/5")
        print(f"  - Giá bán: {item['price_eval']}")
        if item['feedback']:
            print(f"  - Góp ý: \"{item['feedback']}\"")
        else:
            print(f"  - Góp ý: (Để trống)")

        success = submit_form(item)
        if success:
            print(f"  => [THÀNH CÔNG] Đã ghi nhận câu trả lời #{i} vào Google Form!\n")
            success_count += 1
        else:
            print(f"  => [THẤT BẠI] Không thể gửi câu trả lời #{i}.\n")

        if i < args.count:
            # Ngẫu nhiên delay nhẹ để mô phỏng hành vi tự nhiên
            jitter = args.delay + random.uniform(0.5, 1.5)
            time.sleep(jitter)

    print(f"=== HOÀN TẤT ===")
    print(f"Tổng kết: {success_count}/{args.count} lượt gửi thành công lên Google Form.")

if __name__ == "__main__":
    main()
