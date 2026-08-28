import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { VN_PROVINCES, stripProvinceName } from '../../data/vnLocations';

const EMPTY_PROFILE = { fullName: '', phone: '', branch: '' };
const EMPTY_CUSTOMER = { fullName: '', phone: '', address: '', district: '', city: '' };
const EMPTY_PASSWORD = { currentPassword: '', newPassword: '', confirmPassword: '' };

/**
 * Trang hồ sơ cá nhân dùng chung cho nhân viên nội bộ và khách hàng.
 * - Nhân viên: GET/PUT /users/me + đổi mật khẩu /auth/change-password
 * - Khách hàng: GET/PUT /me, /me/profile + đổi mật khẩu
 */
export default function ProfilePage({ customerMode = false }) {
  const { user } = useAuth();
  const isCustomer = customerMode || user?.role === 'CUSTOMER';

  const [profile, setProfile] = useState(isCustomer ? EMPTY_CUSTOMER : EMPTY_PROFILE);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null); // { type: 'success' | 'error', text }
  const [pwForm, setPwForm] = useState(EMPTY_PASSWORD);
  const [savingPassword, setSavingPassword] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  useEffect(() => {
    let alive = true;
    const request = isCustomer ? api.get('/me') : api.get('/users/me');
    request
      .then((res) => {
        if (!alive) return;
        const d = res.data || {};
        setEmail(d.email || '');
        setProfile(isCustomer
          ? {
              fullName: d.fullName || '',
              phone: d.phone || '',
              address: d.address || '',
              district: d.district || '',
              city: d.city || '',
            }
          : { fullName: d.fullName || '', phone: d.phone || '', branch: d.branch || '' });
      })
      .catch(() => alive && setProfileMsg({ type: 'error', text: 'Không tải được hồ sơ.' }))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [isCustomer]);

  const setField = (setter) => (e) => setter((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // Combobox địa chính (34 tỉnh/thành → phường/xã, mô hình 2 tầng từ 01/07/2025)
  const wardOptions = useMemo(() => {
    if (!isCustomer) return [];
    const p = VN_PROVINCES.find((x) => stripProvinceName(x.name) === profile.city);
    return p ? p.wards : [];
  }, [isCustomer, profile.city]);

  /** Chọn tỉnh/TP → reset phường/xã để chọn lại theo danh mục của tỉnh mới. */
  function handleProfileCityChange(e) {
    const name = e.target.value;
    setProfile((prev) => ({ ...prev, city: name, district: '' }));
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      if (isCustomer) {
        await api.put('/me/profile', profile);
      } else {
        await api.put('/users/me', profile);
      }
      setProfileMsg({ type: 'success', text: 'Cập nhật hồ sơ thành công.' });
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: err?.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.',
      });
    } finally {
      setSavingProfile(false);
    }
  }

  function validatePassword() {
    if (!pwForm.currentPassword) return 'Vui lòng nhập mật khẩu hiện tại.';
    if (pwForm.newPassword.length < 8) return 'Mật khẩu mới phải từ 8 ký tự trở lên.';
    if (pwForm.newPassword !== pwForm.confirmPassword) return 'Xác nhận mật khẩu không khớp.';
    return '';
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    const msg = validatePassword();
    if (msg) {
      setPwMsg({ type: 'error', text: msg });
      return;
    }
    setSavingPassword(true);
    setPwMsg(null);
    try {
      await api.post('/auth/change-password', pwForm);
      setPwMsg({ type: 'success', text: 'Đổi mật khẩu thành công.' });
      setPwForm(EMPTY_PASSWORD);
    } catch (err) {
      setPwMsg({
        type: 'error',
        text: err?.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.',
      });
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" /></div>
    );
  }

  return (
    <div className={isCustomer ? 'container section' : 'admin-page'} style={{ maxWidth: 720 }}>
      {!isCustomer && (
        <header className="admin-page-head">
          <h1>Hồ sơ cá nhân</h1>
          <p className="muted-text">Quản lý thông tin cá nhân và bảo mật tài khoản.</p>
        </header>
      )}
      {isCustomer && (
        <>
          <h1>Tài khoản của tôi</h1>
          <p className="muted-text">Quản lý thông tin cá nhân và bảo mật tài khoản.</p>
          <p style={{ marginTop: 10 }}>
            <Link to="/my-orders" className="btn btn-outline">
              Xem lịch sử mua hàng →
            </Link>
          </p>
        </>
      )}

      {/* ===== Thông tin cá nhân ===== */}
      <section className="card" style={{ marginTop: isCustomer ? 16 : 0 }}>
        <h2>Thông tin cá nhân</h2>
        <form onSubmit={handleSaveProfile} noValidate>
          <div className="field">
            <label htmlFor="pf-email">Email</label>
            <input id="pf-email" type="email" value={email} disabled />
          </div>

          <div className="field">
            <label htmlFor="pf-name">Họ và tên *</label>
            <input id="pf-name" name="fullName" type="text" value={profile.fullName}
              onChange={setField(setProfile)} required />
          </div>

          <div className="field">
            <label htmlFor="pf-phone">Số điện thoại</label>
            <input id="pf-phone" name="phone" type="tel" value={profile.phone}
              onChange={setField(setProfile)} placeholder="0901234567" />
          </div>

          {isCustomer ? (
            <>
              <div className="field">
                <label htmlFor="pf-address">Địa chỉ</label>
                <input id="pf-address" name="address" type="text" value={profile.address}
                  onChange={setField(setProfile)} placeholder="Số nhà, tên đường" />
              </div>
              <div className="field-row" style={{ display: 'flex', gap: 12 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label htmlFor="pf-city">Tỉnh/thành phố</label>
                  <select id="pf-city" value={profile.city} onChange={handleProfileCityChange}>
                    <option value="">— Chọn tỉnh/thành phố —</option>
                    {VN_PROVINCES.map((p) => (
                      <option key={p.name} value={stripProvinceName(p.name)}>{p.name}</option>
                    ))}
                    {/* Giá trị cũ (tỉnh trước sáp nhập) không có trong 34 đơn vị mới */}
                    {profile.city && !VN_PROVINCES.some((p) => stripProvinceName(p.name) === profile.city) && (
                      <option value={profile.city}>{profile.city} (đơn vị cũ)</option>
                    )}
                  </select>
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label htmlFor="pf-district">Phường/xã</label>
                  <select id="pf-district" name="district" value={profile.district}
                    onChange={setField(setProfile)}
                    disabled={wardOptions.length === 0 && !profile.district}>
                    <option value="">
                      {wardOptions.length === 0 ? '— Chọn tỉnh/thành phố trước —' : '— Chọn phường/xã —'}
                    </option>
                    {wardOptions.map((w) => (
                      <option key={`${w.n}|${w.t}`} value={w.n}>
                        {w.t === 'Xã' ? w.n : `${w.n} (${w.t})`}
                      </option>
                    ))}
                    {/* Giá trị cũ (quận/huyện trước sáp nhập) không có trong danh mục mới */}
                    {profile.district && !wardOptions.some((w) => w.n === profile.district) && (
                      <option value={profile.district}>{profile.district} (đơn vị cũ)</option>
                    )}
                  </select>
                </div>
              </div>
            </>
          ) : (
            <div className="field">
              <label htmlFor="pf-branch">Chi nhánh</label>
              <input id="pf-branch" name="branch" type="text" value={profile.branch}
                onChange={setField(setProfile)} placeholder="VD: Cần Thơ" />
            </div>
          )}

          {profileMsg && (
            <div className={`alert ${profileMsg.type === 'success' ? 'alert-success' : 'alert-error'}`} role="alert">
              {profileMsg.text}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={savingProfile}>
            {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </section>

      {/* ===== Đổi mật khẩu ===== */}
      <section className="card" style={{ marginTop: 16 }}>
        <h2>Đổi mật khẩu</h2>
        <form onSubmit={handleChangePassword} noValidate>
          <div className="field">
            <label htmlFor="pw-current">Mật khẩu hiện tại *</label>
            <input id="pw-current" type="password" value={pwForm.currentPassword} required
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              autoComplete="current-password" />
          </div>
          <div className="field">
            <label htmlFor="pw-new">Mật khẩu mới * <span className="muted-text">(tối thiểu 8 ký tự)</span></label>
            <input id="pw-new" type="password" value={pwForm.newPassword} required minLength={8}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              placeholder="Từ 8 ký tự trở lên" autoComplete="new-password" />
          </div>
          <div className="field">
            <label htmlFor="pw-confirm">Xác nhận mật khẩu mới *</label>
            <input id="pw-confirm" type="password" value={pwForm.confirmPassword} required
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              autoComplete="new-password" />
          </div>

          {pwMsg && (
            <div className={`alert ${pwMsg.type === 'success' ? 'alert-success' : 'alert-error'}`} role="alert">
              {pwMsg.text}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={savingPassword}>
            {savingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </section>
    </div>
  );
}
