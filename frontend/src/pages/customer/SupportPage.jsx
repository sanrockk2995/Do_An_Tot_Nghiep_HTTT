import { Link } from 'react-router-dom';
import { IconMapPin, IconPhone, IconMail } from '../../components/Icons';

const FAQS = [
  {
    q: 'Làm sao để đặt hàng online?',
    a: 'Bạn chọn sản phẩm, size và màu, nhấn "Thêm vào giỏ hàng", vào trang giỏ hàng điền thông tin giao hàng và nhấn "Đặt hàng".',
  },
  {
    q: 'Routine hỗ trợ những phương thức thanh toán nào?',
    a: 'Hiện có: thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng và thẻ tín dụng/ghi nợ.',
  },
  {
    q: 'Chính sách đổi trả như thế nào?',
    a: 'Đổi trả trong vòng 07 ngày kể từ khi nhận hàng với sản phẩm còn nguyên tem mác. Liên hệ hotline để được hỗ trợ.',
  },
  {
    q: 'Làm sao để tích điểm thành viên?',
    a: 'Mỗi đơn hàng hoàn tất sẽ được cộng điểm theo tổng chi tiêu. Đạt các ngưỡng 5/20/50 triệu sẽ nâng hạng SILVER/GOLD/VIP kèm quyền lợi riêng.',
  },
];

/** Trang trung tâm hỗ trợ khách hàng (FAQ + liên hệ). */
export default function SupportPage() {
  return (
    <div className="container section support-page">
      <h1>Trung tâm hỗ trợ</h1>
      <p className="muted-text support-intro">
        Vận hành 8:00 – 21:00 hằng ngày. Hotline <strong>1900 1234</strong> · Email{' '}
        <strong>cskh@routine.vn</strong>
      </p>

      <div className="support-grid">
        <section aria-labelledby="faq-title">
          <h2 id="faq-title">Câu hỏi thường gặp</h2>
          {FAQS.map((f) => (
            <details key={f.q} className="card faq-item">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>

        <aside className="support-contact card">
          <h2>Liên hệ</h2>
          <ul>
            <li><IconMapPin /> 133 Cầu Giấy, quận Cầu Giấy, thành phố Hà Nội</li>
            <li><IconPhone /> 1900 1234</li>
            <li><IconMail /> cskh@routine.vn</li>
          </ul>
          <Link to="/products" className="btn btn-primary btn-block">Tiếp tục mua sắm</Link>
        </aside>
      </div>
    </div>
  );
}
