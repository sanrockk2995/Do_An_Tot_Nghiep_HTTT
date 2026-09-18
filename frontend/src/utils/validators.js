/**
 * Utility hàm kiểm tra tính hợp lệ dữ liệu (Validation)
 * Phục vụ các đặc tả Use Case theo chuẩn HTTT / CNPM của Routine
 */

/**
 * Kiểm tra tính hợp lệ của chuỗi tìm kiếm khách hàng (Phân hệ Sales Staff & Admin)
 *
 * Đặc tả UC "Tìm kiếm khách hàng":
 * - Luồng chính: Người dùng nhập tiêu chí tìm kiếm (tên, số điện thoại, email, v.v.) và nhấn "Tìm kiếm".
 * - Luồng phụ 1: Nếu không có khách hàng nào khớp với tiêu chí tìm kiếm, hệ thống sẽ thông báo "Không tìm thấy khách hàng".
 * - Luồng phụ 2: Nếu thông tin nhập vào không hợp lệ (ví dụ, sai định dạng email, mã độc sql,...),
 *   hệ thống sẽ yêu cầu người dùng nhập lại đúng thông tin.
 *
 * @param {string} query Chuỗi tìm kiếm nhập từ người dùng
 * @returns {{ valid: boolean, error: string, reason?: string }}
 */
export function validateCustomerSearch(query) {
  if (!query || !query.trim()) {
    return { valid: true, error: '' };
  }

  const trimmed = query.trim();

  // 1. Kiểm tra giới hạn độ dài ký tự
  if (trimmed.length > 100) {
    return {
      valid: false,
      reason: 'MAX_LENGTH',
      error: 'Thông tin tìm kiếm không hợp lệ (độ dài vượt quá 100 ký tự). Hệ thống yêu cầu người dùng nhập lại đúng thông tin.',
    };
  }

  // 2. Kiểm tra mã độc SQL Injection & mã Script/HTML độc hại
  // Chặn các mẫu SQL injection: ' ; -- /* */ \ union select insert update delete drop alter truncate exec xp_ or 1=1 and 1=1
  const sqlInjectionPattern = /('|"|;|--|\/\*|\*\/|\\|\b(union|select|insert|update|delete|drop|alter|truncate|exec|xp_)\b|\b(or|and)\s+['"]?\d+['"]?\s*=\s*['"]?\d+)/i;
  // Chặn script tags, javascript:, event handlers
  const xssPattern = /(<[^>]*>|javascript:|on\w+\s*=)/i;

  if (sqlInjectionPattern.test(trimmed) || xssPattern.test(trimmed)) {
    return {
      valid: false,
      reason: 'SECURITY_VIOLATION',
      error: 'Thông tin nhập vào không hợp lệ (chứa ký tự đặc biệt hoặc mã độc SQL). Hệ thống yêu cầu người dùng nhập lại đúng thông tin.',
    };
  }

  // 3. Kiểm tra các ký tự hợp lệ cho tên, số điện thoại, email, địa chỉ
  // Cho phép: chữ cái có dấu (Unicode), số, khoảng trắng và các ký tự: @ . _ - + / ,
  const validCharsPattern = /^[\p{L}\p{N}\s@._\-+/,]+$/u;
  if (!validCharsPattern.test(trimmed)) {
    return {
      valid: false,
      reason: 'INVALID_CHARACTERS',
      error: 'Thông tin nhập vào không hợp lệ (sai định dạng hoặc chứa ký tự đặc biệt). Hệ thống yêu cầu người dùng nhập lại đúng thông tin.',
    };
  }

  // 4. Kiểm tra trường hợp tìm theo email nhưng sai định dạng email
  if (trimmed.includes('@')) {
    const hasMultipleAt = (trimmed.match(/@/g) || []).length > 1;
    const startsWithAt = trimmed.startsWith('@');
    const hasSpace = trimmed.includes(' ');
    if (hasMultipleAt || startsWithAt || hasSpace) {
      return {
        valid: false,
        reason: 'INVALID_EMAIL_FORMAT',
        error: 'Thông tin nhập vào không hợp lệ (sai định dạng email). Hệ thống yêu cầu người dùng nhập lại đúng thông tin.',
      };
    }
  }

  return { valid: true, error: '' };
}

/**
 * Kiểm tra tính hợp lệ của chuỗi tìm kiếm sản phẩm (Phân hệ Sales Staff & Quản lý)
 *
 * Đặc tả UC "Tìm kiếm sản phẩm":
 * - Actor: Nhân viên bán hàng, quản lý
 * - Mô tả: Cho phép người dùng tìm kiếm sản phẩm trong hệ thống theo các tiêu chí như tên sản phẩm, mã sản phẩm hoặc danh mục
 * - Tiền điều kiện: Người dùng đã đăng nhập vào hệ thống và chọn chức năng “Truy vấn sản phẩm”
 * - Luồng chính:
 *   1. Hệ thống hiển thị giao diện tìm kiếm sản phẩm
 *   2. Người dùng nhập thông tin tìm kiếm (tên, mã hoặc từ khóa liên quan).
 *   3. Người dùng chọn “Tìm kiếm”.
 *   4. Hệ thống xử lý yêu cầu và hiển thị danh sách sản phẩm phù hợp với tiêu chí tìm kiếm
 * - Luồng phụ 1: Không tìm thấy sản phẩm → Hệ thống thông báo “Không tìm thấy sản phẩm phù hợp”.
 * - Luồng phụ 2: Người dùng bỏ trống trường tìm kiếm → Hệ thống yêu cầu nhập ít nhất một tiêu chí
 *
 * @param {string} query Chuỗi từ khóa tìm kiếm (tên, mã SP, từ khóa)
 * @returns {{ valid: boolean, error: string, reason?: string }}
 */
export function validateProductSearch(query) {
  if (!query || !query.trim()) {
    return { valid: true, error: '' };
  }

  const trimmed = query.trim();

  // 1. Kiểm tra độ dài tối đa 100 ký tự
  if (trimmed.length > 100) {
    return {
      valid: false,
      reason: 'MAX_LENGTH',
      error: 'Thông tin tìm kiếm không hợp lệ (độ dài vượt quá 100 ký tự). Hệ thống yêu cầu người dùng nhập lại đúng thông tin.',
    };
  }

  // 2. Chống SQL Injection và Script XSS
  const sqlInjectionPattern = /('|"|;|--|\/\*|\*\/|\\|\b(union|select|insert|update|delete|drop|alter|truncate|exec|xp_)\b|\b(or|and)\s+['"]?\d+['"]?\s*=\s*['"]?\d+)/i;
  const xssPattern = /(<[^>]*>|javascript:|on\w+\s*=)/i;

  if (sqlInjectionPattern.test(trimmed) || xssPattern.test(trimmed)) {
    return {
      valid: false,
      reason: 'SECURITY_VIOLATION',
      error: 'Thông tin nhập vào không hợp lệ (chứa ký tự đặc biệt hoặc mã độc SQL). Hệ thống yêu cầu người dùng nhập lại đúng thông tin.',
    };
  }

  // 3. Ký tự hợp lệ cho tìm kiếm tên, mã sản phẩm, SKU
  // Cho phép chữ cái (Unicode tiếng Việt), số, khoảng trắng, dấu chấm, gạch dưới, gạch ngang, cộng, thăng, chéo
  const validCharsPattern = /^[\p{L}\p{N}\s._\-+#/,]+$/u;
  if (!validCharsPattern.test(trimmed)) {
    return {
      valid: false,
      reason: 'INVALID_CHARACTERS',
      error: 'Thông tin nhập vào không hợp lệ (sai định dạng hoặc chứa ký tự đặc biệt). Hệ thống yêu cầu người dùng nhập lại đúng thông tin.',
    };
  }

  return { valid: true, error: '' };
}

