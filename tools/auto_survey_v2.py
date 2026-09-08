import sys
import time
import random
import argparse
import requests

# Đảm bảo xuất tiếng Việt chuẩn UTF-8 trên Windows
sys.stdout.reconfigure(encoding='utf-8')

FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfuZoTuax9TUTnFd0fwHKsKbOWMdte2cOsHmhtvlC9KZ5cKSA/formResponse"

ROLES = [
    ('Khách hàng mua sắm tại cửa hàng Routine Cầu Giấy', 0.74),
    ('Nhân viên bán hàng / Thu ngân', 0.10),
    ('Nhân viên quản lý kho', 0.06),
    ('Nhân viên kế toán', 0.04),
    ('Cấp quản lý cửa hàng', 0.06)
]

CUSTOMER_FEEDBACK_POOL = [
    "Mong cửa hàng sớm ra mắt website để khách hàng có thể tra cứu tồn kho size/màu trước khi đến.",
    "Rất thích form dáng của Routine, hy vọng có thêm chương trình tích điểm thành viên và quà sinh nhật.",
    "Khung giờ cao điểm cuối tuần thanh toán hơi lâu, nên có quầy thanh toán nhanh hoặc quét mã QR tự động.",
    "Website nếu làm cần tối ưu giao diện điện thoại mượt mà, ảnh sản phẩm rõ nét kèm bảng hướng dẫn chọn size chi tiết.",
    "Nên có chính sách đổi trả linh hoạt tại quầy nếu mua nhầm size trên website.",
    "Ủng hộ Routine số hóa hệ thống bán hàng và quản lý để phục vụ khách chu đáo hơn!",
    "Mong muốn có tính năng đặt giữ hàng online rồi ghé cửa hàng Cầu Giấy lấy ngay (Click & Collect).",
    "Nên gửi thông báo qua Zalo/tin nhắn khi sản phẩm yêu thích có đợt hàng mới về.",
    "Giao diện đặt hàng cần đơn giản, tích hợp sẵn các voucher giảm giá để khách dễ áp dụng.",
    "Chất lượng quần áo Routine rất ổn, nhân viên tư vấn nhiệt tình, chỉ cần cải thiện tốc độ in hóa đơn khi đông.",
    "Cần có gợi ý phối đồ theo từng mẫu áo/quần trên website để khách hàng dễ chọn mua theo combo.",
    "Mong cửa hàng bổ sung thêm nhiều size lớn (XL, XXL) cho các mẫu quần âu và sơ mi hot trend.",
    "Rất mong có trang cá nhân xem lại lịch sử hóa đơn để tiện theo dõi chi tiêu và tích điểm đổi quà.",
    "Nhân viên hỗ trợ rất tốt, nhưng nhiều khi mẫu ưng ý lại hết size M phải chờ nhân viên vào kho tìm khá lâu.",
    "Giá cả hợp lý với chất lượng, mong Routine tiếp tục ra mắt nhiều bộ sưu tập mới.",
    "", "", "", ""  # Phản ánh thực tế: khoảng 25-30% khách hàng để trống phần góp ý thêm
]

STAFF_FEEDBACK_MAP = {
    'Nhân viên bán hàng / Thu ngân': [
        "Cần phần mềm POS mượt mà hơn, tích hợp quét mã QR thanh toán động và tự động áp mã khuyến mãi.",
        "Rất mong có app/web trên tablet cho nhân viên tra cứu nhanh số lượng tồn kho theo size/màu ngay tại sàn tư vấn.",
        "Vào giờ cao điểm phần mềm đôi khi phản hồi chậm, cần tối ưu tốc độ in hóa đơn tại quầy."
    ],
    'Nhân viên quản lý kho': [
        "Rất cần hệ thống quét mã vạch Barcode/QR khi nhập - xuất kho và kiểm kê định kỳ để giảm tải ghi chép Excel.",
        "Cần tính năng cảnh báo tự động khi mã hàng nào chạm ngưỡng tồn kho tối thiểu để kịp thời đề xuất nhập hàng.",
        "Mong phần mềm đồng bộ dữ liệu kho thời gian thực tức thì với số liệu bán lẻ tại quầy thu ngân."
    ],
    'Nhân viên kế toán': [
        "Hệ thống cần xuất được báo cáo doanh thu, sổ quỹ và công nợ nhà cung cấp ra file Excel chuẩn định dạng.",
        "Tính năng tự động tính hoa hồng bán hàng theo từng ca/nhân viên sẽ giúp tiết kiệm rất nhiều thời gian chốt lương cuối tháng."
    ],
    'Cấp quản lý cửa hàng': [
        "Mong muốn hệ thống có Dashboard biểu đồ doanh thu trực quan theo ngày/tháng/năm và cảnh báo hàng chậm bán.",
        "Hệ thống mới cần phân quyền bảo mật chặt chẽ giữa các vai trò Quản lý, Bán hàng, Thủ kho và Kế toán."
    ]
}

def generate_random_response():
    # 1. Vai trò
    role_choices, role_weights = zip(*ROLES)
    role = random.choices(role_choices, weights=role_weights, k=1)[0]
    is_customer = (role == 'Khách hàng mua sắm tại cửa hàng Routine Cầu Giấy')

    # 2. Tần suất
    if is_customer:
        freq = random.choices(
            ['Lần đầu tiên', '1 – 2 lần / tháng', 'Hàng tuần'],
            weights=[0.15, 0.60, 0.25],
            k=1
        )[0]
    else:
        freq = 'Làm việc hàng ngày tại cửa hàng'

    # 3. Đánh giá chất liệu vải (1-5)
    fabric_score = str(random.choices(['3', '4', '5'], weights=[0.10, 0.50, 0.40], k=1)[0])

    # 4. Form dáng, thẩm mỹ (1-5)
    fit_score = str(random.choices(['3', '4', '5'], weights=[0.05, 0.45, 0.50], k=1)[0])

    # 5. Mức giá
    price_eval = random.choices(
        [
            'Giá quá cao so với chất lượng',
            'Hơi đắt nhưng chấp nhận được',
            'Hoàn toàn tương xứng với chất lượng',
            'Mức giá rất tốt và cạnh tranh'
        ],
        weights=[0.05, 0.30, 0.50, 0.15],
        k=1
    )[0]

    # 6. Hết size/màu
    out_of_stock = random.choices(
        [
            'Rất thường xuyên (Gần như lần nào cũng gặp)',
            'Thỉnh thoảng gặp',
            'Hiếm khi gặp',
            'Chưa từng gặp'
        ],
        weights=[0.10, 0.60, 0.25, 0.05],
        k=1
    )[0]

    # 7. Tốc độ thanh toán (1-5)
    speed_score = str(random.choices(['3', '4', '5'], weights=[0.20, 0.55, 0.25], k=1)[0])

    # 8. Thái độ nhân viên (1-5)
    attitude_score = str(random.choices(['4', '5'], weights=[0.30, 0.70], k=1)[0])

    # 9. Bất tiện nhận thấy (chọn 1-3 đáp án)
    inconvenience_pool = [
        'Nhân viên mất nhiều thời gian tìm kiếm size/màu trong kho do không tra cứu được tồn kho tức thì',
        'Khung giờ cao điểm khách phải xếp hàng chờ thanh toán khá lâu',
        'Quy trình áp dụng mã khuyến mãi hoặc giảm giá đôi khi bị nhầm lẫn, chậm trễ',
        'Khách hàng không thể tra cứu trước xem mẫu và size còn hàng hay không qua website trước khi đến',
        'Khách hàng không có tài khoản online để xem lại lịch sử các hóa đơn đã mua',
        'Thủ tục kiểm tra điều kiện đổi trả hàng còn chậm và phụ thuộc vào kiểm tra sổ sách/giấy tờ',
        'Số liệu hàng hóa giữa kho thực tế và trên sổ sách/phần mềm bán lẻ thường xuyên bị lệch nhau'
    ]
    inconveniences = random.sample(inconvenience_pool, k=random.randint(1, 3))

    # 10. Điểm nghẽn quản lý nội bộ
    if is_customer:
        internal_difficulty = ['Tôi là khách hàng (Bỏ qua câu này)']
    else:
        internal_pool = [
            'Quản lý nhập - xuất kho và kiểm kê thủ công trên Excel rất tốn thời gian, dễ sai sót',
            'Thiếu chức năng cảnh báo tự động khi lượng hàng tồn kho chạm ngưỡng sắp hết',
            'Tổng hợp doanh thu, ca làm, tính hoa hồng và lập bảng lương cuối tháng rất phức tạp',
            'Khó khăn trong việc theo dõi chứng từ công nợ và lịch sử nhập hàng từ nhà cung cấp',
            'Báo cáo doanh số theo ca làm việc còn phải tự tổng hợp thủ công'
        ]
        internal_difficulty = random.sample(internal_pool, k=random.randint(1, 2))

    # 11. Sẵn sàng dùng website
    if is_customer:
        web_readiness = random.choices(
            [
                'Rất sẵn sàng và sẽ sử dụng thường xuyên',
                'Có sử dụng nếu có chính sách ưu đãi thành viên tốt',
                'Chỉ dùng để tra cứu mẫu mã, size còn hàng trước khi qua cửa hàng thử'
            ],
            weights=[0.65, 0.25, 0.10],
            k=1
        )[0]
    else:
        web_readiness = 'Rất sẵn sàng và sẽ sử dụng thường xuyên'

    # 12. Tính năng quan trọng trên hệ thống mới (chọn 2-4 tính năng)
    features_pool = [
        'Website hiển thị chi tiết sản phẩm, danh mục, hình ảnh, biến thể size/màu và tồn kho thời gian thực',
        'Chức năng giỏ hàng, đặt hàng trực tuyến và tự động tính tiền, áp mã khuyến mãi',
        'Trang cá nhân cho khách hàng theo dõi lịch sử đơn hàng và gửi đánh giá sản phẩm',
        'Tự động trừ số lượng tồn kho ngay khi xuất hóa đơn bán hàng',
        'Quản lý phiếu nhập kho, xuất kho, kiểm kê và cảnh báo tồn kho tự động',
        'Hệ thống báo cáo - thống kê doanh thu trực quan theo ngày/tháng/năm và sản phẩm bán chạy',
        'Phân quyền tài khoản chặt chẽ theo vai trò (Quản lý, Bán hàng, Kho, Kế toán)'
    ]
    selected_features = random.sample(features_pool, k=random.randint(2, 4))

    # 13. Ý kiến đóng góp
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
        'selected_features': selected_features,
        'feedback': feedback
    }

def submit_form(data):
    payload = [
        ('entry.1552513863', data['role']),
        ('entry.1461664900', data['freq']),
        ('entry.294074995', data['fabric_score']),
        ('entry.402307043', data['fit_score']),
        ('entry.868683902', data['price_eval']),
        ('entry.661948707', data['out_of_stock']),
        ('entry.506153652', data['speed_score']),
        ('entry.126712933', data['attitude_score']),
    ]

    for inc in data['inconveniences']:
        payload.append(('entry.481229974', inc))

    for dif in data['internal_difficulty']:
        payload.append(('entry.747812479', dif))

    payload.append(('entry.1043727847', data['web_readiness']))

    for feat in data['selected_features']:
        payload.append(('entry.1377052740', feat))

    if data['feedback']:
        payload.append(('entry.179595015', data['feedback']))

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    resp = requests.post(FORM_URL, data=payload, headers=headers)
    return resp.status_code == 200

def main():
    parser = argparse.ArgumentParser(description="Tự động điền form khảo sát Routine Cầu Giấy (bản mới)")
    parser.add_argument("--count", type=int, default=50, help="Số lượt điền form (mặc định 50)")
    parser.add_argument("--delay", type=float, default=0.5, help="Thời gian chờ giữa các lần gửi (giây)")
    args = parser.parse_args()

    print(f"==================================================")
    print(f"BẮT ĐẦU ĐIỀN FORM KHẢO SÁT ROUTINE CẦU GIẤY (V2)")
    print(f"Mục tiêu: {args.count} lượt gửi")
    print(f"==================================================\n")

    success_count = 0
    for i in range(1, args.count + 1):
        item = generate_random_response()
        success = submit_form(item)
        if success:
            success_count += 1
            role_short = item['role'].split(' ')[0] + '...' if len(item['role']) > 25 else item['role']
            fb_info = f"\"{item['feedback'][:35]}...\"" if item['feedback'] else "(Không điền)"
            print(f"[{i:02d}/{args.count}] OK - {item['role']} | Vải: {item['fabric_score']}* | Giá: {item['price_eval']} | Góp ý: {fb_info}")
        else:
            print(f"[{i:02d}/{args.count}] FAILED - Lỗi khi gửi câu trả lời.")

        if i < args.count:
            jitter = args.delay + random.uniform(0.1, 0.4)
            time.sleep(jitter)

    print(f"\n==================================================")
    print(f"HOÀN THÀNH: {success_count}/{args.count} lượt gửi thành công lên Google Form!")
    print(f"==================================================")

if __name__ == "__main__":
    main()
