import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export function GoogleLoginModal({ isOpen, onClose, onSuccess }) {
  const { loginWithGoogle } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('picker'); // 'picker' | 'custom'
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  if (!isOpen) return null;

  // Preset demo Gmail accounts already linked to the SCMS system
  const demoAccounts = [
    {
      email: 'nguyenvana@gmail.com',
      fullName: 'Nguyễn Văn A',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      badge: 'Hội viên Gói Pro (Active)'
    },
    {
      email: 'tranthib@gmail.com',
      fullName: 'Trần Thị B',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      badge: 'Hội viên Gói Basic'
    }
  ];

  const handleSelectAccount = async (account) => {
    setLoading(true);
    try {
      const user = await loginWithGoogle({
        email: account.email,
        fullName: account.fullName,
        avatar: account.avatar
      });
      showSuccess(`Đăng nhập Google thành công! Xin chào ${user.fullName}`);
      onClose();
      if (onSuccess) onSuccess(user);
    } catch (err) {
      showError(err.message || 'Đăng nhập Google thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customEmail.trim()) {
      showError('Vui lòng nhập địa chỉ Gmail!');
      return;
    }
    if (!customEmail.includes('@')) {
      showError('Địa chỉ email không đúng định dạng!');
      return;
    }

    setLoading(true);
    try {
      const user = await loginWithGoogle({
        email: customEmail.trim(),
        fullName: customName.trim() || customEmail.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(customName.trim() || customEmail)}&background=ea4335&color=fff`
      });
      showSuccess(`Đăng nhập Google thành công! Chào mừng bạn gia nhập SCMS.`);
      onClose();
      if (onSuccess) onSuccess(user);
    } catch (err) {
      showError(err.message || 'Đăng nhập Google thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={() => !loading && onClose()}
      />

      {/* Google Sign-in Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all z-10 my-8">
        {/* Google Header */}
        <div className="p-6 text-center border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-center mb-3">
            {/* Google Brand Logo */}
            <svg className="w-10 h-10" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.13z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
              />
            </svg>
          </div>
          <h3 className="font-chivo text-xl font-bold text-slate-900 tracking-tight">
            Đăng nhập bằng Google
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Chọn tài khoản để tiếp tục đến <strong className="text-slate-800">SCMS Sports Center</strong>
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin mb-4" />
              <p className="text-sm font-bold text-slate-800">Đang xác thực với Google...</p>
              <p className="text-xs text-slate-500 mt-1">Vui lòng chờ trong giây lát</p>
            </div>
          ) : activeView === 'picker' ? (
            <div>
              <div className="space-y-2.5">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handleSelectAccount(acc)}
                    className="w-full flex items-center gap-3.5 p-3 rounded-xl border border-slate-200 hover:border-red-500 hover:bg-red-50/30 transition-all text-left group"
                  >
                    <img
                      src={acc.avatar}
                      alt={acc.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-red-500 transition-all"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-chivo text-sm font-bold text-slate-900 truncate">
                          {acc.fullName}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                          {acc.badge}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 truncate block">
                        {acc.email}
                      </span>
                    </div>
                  </button>
                ))}

                {/* Option: Use another Google account */}
                <button
                  onClick={() => setActiveView('custom')}
                  className="w-full flex items-center gap-3.5 p-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-50 transition-all text-left text-slate-700"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                  </div>
                  <div>
                    <span className="font-chivo text-sm font-bold text-slate-900 block">
                      Sử dụng một tài khoản Gmail khác
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Nhập địa chỉ Gmail của bạn để tự động tạo/đăng nhập
                    </span>
                  </div>
                </button>
              </div>

              {/* Security info */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Để tiếp tục, Google sẽ cấp quyền truy cập email và hồ sơ công khai của bạn cho SCMS Sports Center.
                </p>
              </div>
            </div>
          ) : (
            /* Custom Gmail input view */
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveView('picker')}
                  className="text-slate-500 hover:text-slate-900 flex items-center text-xs font-bold"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>Quay lại danh sách</span>
                </button>
              </div>

              <form onSubmit={handleCustomSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Địa chỉ Gmail *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="vidu@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="h-11 text-sm pl-10 pr-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 w-full text-slate-900 placeholder-slate-400 bg-white"
                    />
                    <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-slate-400">
                      mail
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Họ và tên của bạn
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Nguyễn Văn B"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="h-11 text-sm pl-10 pr-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 w-full text-slate-900 placeholder-slate-400 bg-white"
                    />
                    <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-slate-400">
                      badge
                    </span>
                  </div>
                </div>

                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-100 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">info</span>
                  <span>
                    Nếu bạn chưa từng đăng ký tại SCMS, hệ thống sẽ tự động kích hoạt tài khoản Hội viên mới với mã định danh thành viên riêng.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-chivo font-bold rounded-lg shadow-md transition-colors text-xs flex items-center justify-center uppercase tracking-wider mt-2"
                >
                  XÁC NHẬN TIẾP TỤC VỚI GOOGLE
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">SCMS OAuth 2.0 Auth</span>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
}
