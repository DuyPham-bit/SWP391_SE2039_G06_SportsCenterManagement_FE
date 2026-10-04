import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { ForgotPasswordModal } from './ForgotPasswordModal.js';
import { GoogleLoginModal } from './GoogleLoginModal.js';
import { isMockMode } from '../../services/api.js';

export function LoginPage() {
  const { login, register, isAuthenticated, role } = useAuth();
  const { showSuccess, showError } = useToast();

  const getInitialTab = () => {
    return window.location.hash === '#/register' ? 'register' : 'login';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab); // 'login' | 'register'
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Sync tab with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#/register') {
        setActiveTab('register');
      } else if (window.location.hash === '#/login') {
        setActiveTab('login');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab === 'register' ? '#/register' : '#/login';
  };

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAgree, setRegAgree] = useState(true);

  // Redirect to dashboard if already authenticated
  const redirectToRoleDashboard = (r) => {
    switch (r) {
      case 'MANAGER': window.location.hash = '#/manager/dashboard'; break;
      case 'RECEPTIONIST': window.location.hash = '#/receptionist/dashboard'; break;
      case 'COACH': window.location.hash = '#/coach/dashboard'; break;
      case 'MEMBER': window.location.hash = '#/member/dashboard'; break;
      default: window.location.hash = '#/'; break;
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      showError('Vui lòng nhập đầy đủ Email và Mật khẩu!');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(loginEmail, loginPassword);
      showSuccess(`Đăng nhập thành công! Chào mừng ${user.fullName} (${user.role})`);
      redirectToRoleDashboard(user.role);
    } catch (err) {
      showError(err.message || 'Đăng nhập thất bại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regFullName.trim() || !regEmail.trim() || !regPassword) {
      showError('Vui lòng điền đầy đủ các thông tin đăng ký!');
      return;
    }
    if (regPassword.length < (isMockMode ? 6 : 12)
      || (!isMockMode && (!/[A-Z]/.test(regPassword)
        || !/[a-z]/.test(regPassword)
        || !/[0-9]/.test(regPassword)
        || !/[^a-zA-Z0-9]/.test(regPassword)))) {
      showError(isMockMode
        ? 'Mật khẩu phải dài tối thiểu 6 ký tự!'
        : 'Mật khẩu phải có ít nhất 12 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      showError('Mật khẩu xác nhận không khớp với mật khẩu đã nhập!');
      return;
    }
    if (!regAgree) {
      showError('Vui lòng đồng ý với Điều khoản dịch vụ của SCMS để tiếp tục!');
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser = await register({
        fullName: regFullName,
        email: regEmail,
        phone: regPhone,
        password: regPassword
      });
      showSuccess(`Đăng ký thành viên thành công! Mã hội viên: ${newUser.memberCode}`);
      redirectToRoleDashboard('MEMBER');
    } catch (err) {
      showError(err.message || 'Đăng ký thất bại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
      {/* Top Simple Header */}
      <header className="h-16 w-full bg-white border-b border-slate-200 px-6 flex items-center justify-between">
        <a href="#/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm font-chivo font-black text-base">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-chivo font-black text-sm tracking-tight text-slate-900 leading-none">
              SCMS
            </span>
            <span className="text-[10px] font-bold text-red-600 tracking-widest uppercase leading-none mt-0.5">
              Sports Center
            </span>
          </div>
        </a>

        <a
          href="#/"
          className="text-xs font-bold text-slate-600 hover:text-red-600 flex items-center gap-1 transition-colors uppercase font-chivo tracking-wider"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Về Trang Chủ</span>
        </a>
      </header>

      {/* 50/50 SPLIT AUTHENTICATION */}
      <div className="flex-1 lg:grid lg:grid-cols-2 bg-slate-50">
        {/* LEFT COLUMN: Sports Imagery & Athletic Motivation */}
        <div className="hidden lg:flex flex-col justify-between p-12 lg:p-16 relative overflow-hidden bg-slate-950 text-white">
          <img
            alt="SCMS Training Facility"
            className="absolute inset-0 object-cover w-full h-full opacity-40 scale-105"
            src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1920&auto=format&fit=crop"
          />
          <div className="bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/60 absolute inset-0" />

          {/* Top Tagline */}
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600 text-white font-chivo text-xs font-bold tracking-widest uppercase shadow-md">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              SCMS ATHLETIC MEMBERSHIP
            </span>
          </div>

          {/* Center Quote */}
          <div className="relative z-10 my-auto py-10 max-w-xl">
            <h1 className="font-chivo text-3xl xl:text-4xl 2xl:text-5xl font-black uppercase text-white tracking-tight leading-tight">
              Ý CHÍ TẠO NÊN NHÀ VÔ ĐỊCH - BỨT PHÁ GIỚI HẠN CÙNG SCMS
            </h1>
            <p className="text-sm xl:text-base text-slate-300 mt-6 leading-relaxed">
              Tham gia cùng hơn 400+ vận động viên và hội viên đang rèn luyện và nâng tầm thể lực mỗi ngày tại khu liên hợp đa năng 15 bộ môn đạt chuẩn thi đấu quốc tế.
            </p>
          </div>

          {/* Bottom Stats */}
          <div className="relative z-10 pt-6 border-t border-white/15">
            <div className="grid grid-cols-3 gap-4 text-white">
              <div>
                <div className="text-2xl font-black text-red-500 font-chivo">15</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-300 font-bold mt-0.5">Môn thể thao</div>
              </div>
              <div>
                <div className="text-2xl font-black text-red-500 font-chivo">9</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-300 font-bold mt-0.5">Sân tập Olympic</div>
              </div>
              <div>
                <div className="text-2xl font-black text-red-500 font-chivo">100%</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-300 font-bold mt-0.5">HLV AFC & NASM</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Authentication Form */}
        <div className="flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16 bg-slate-50">
          <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-slate-200/80">
            {/* Toggle Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-6" role="tablist">
              <button
                className={`w-1/2 py-2.5 text-xs font-chivo font-bold uppercase rounded-lg transition-all ${
                  activeTab === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                onClick={() => handleTabChange('login')}
                type="button"
              >
                ĐĂNG NHẬP
              </button>
              <button
                className={`w-1/2 py-2.5 text-xs font-chivo font-bold uppercase rounded-lg transition-all ${
                  activeTab === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                onClick={() => handleTabChange('register')}
                type="button"
              >
                ĐĂNG KÝ
              </button>
            </div>

            {/* GOOGLE / GMAIL SIGN-IN BUTTON (Appears for both Login & Register) */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="w-full h-11 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg border border-slate-300 shadow-sm hover:shadow transition-all text-xs flex items-center justify-center gap-3 active:scale-[0.99]"
              >
                {/* Official Google G SVG */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span className="font-semibold text-slate-800">
                  {activeTab === 'login' ? 'Tiếp tục bằng Google / Gmail' : 'Đăng ký nhanh bằng Google / Gmail'}
                </span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-5">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 absolute">
                  {activeTab === 'login' ? 'HOẶC ĐĂNG NHẬP VỚI EMAIL' : 'HOẶC ĐIỀN FORM ĐĂNG KÝ'}
                </span>
              </div>
            </div>

            {/* TAB 1: LOGIN FORM */}
            {activeTab === 'login' ? (
              <div>
                <div className="mb-5">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight font-chivo">
                    Chào mừng trở lại!
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Đăng nhập để quản lý lịch tập, đặt chỗ và theo dõi tiến độ thể lực
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Email đăng nhập *
                    </label>
                    <input
                      className="h-11 text-sm px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 w-full text-slate-900 placeholder-slate-400 bg-white"
                      placeholder="vidu@scms.vn"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Mật khẩu *
                    </label>
                    <input
                      className="h-11 text-sm px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 w-full text-slate-900 placeholder-slate-400 bg-white"
                      placeholder="••••••••"
                      type="password"
                      required
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                      <input
                        className="w-4 h-4 rounded text-red-600 focus:ring-red-600 border-slate-300"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                      />
                      <span>Ghi nhớ đăng nhập</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-red-600 font-bold hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-chivo font-bold rounded-lg shadow-md transition-colors text-xs flex items-center justify-center uppercase tracking-wider mt-2"
                  >
                    {isSubmitting ? 'Đang xác thực...' : 'ĐĂNG NHẬP VÀO HỆ THỐNG'}
                  </button>
                </form>

                {/* Switch to Register */}
                <div className="mt-6 text-center text-xs text-slate-600">
                  Chưa có tài khoản SCMS?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabChange('register')}
                    className="font-bold text-red-600 hover:underline"
                  >
                    Đăng ký hội viên ngay
                  </button>
                </div>
              </div>
            ) : (
              /* TAB 2: REGISTER FORM */
              <div>
                <div className="mb-5">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight font-chivo">
                    Đăng ký thành viên
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Bắt đầu hành trình bứt phá thể lực chuẩn Olympic tại SCMS
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Họ và tên *
                    </label>
                    <input
                      className="h-10 text-sm px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 w-full text-slate-900 placeholder-slate-400 bg-white"
                      placeholder="Nguyễn Văn A"
                      type="text"
                      required
                      value={regFullName}
                      onChange={e => setRegFullName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Email *
                    </label>
                    <input
                      className="h-10 text-sm px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 w-full text-slate-900 placeholder-slate-400 bg-white"
                      placeholder="vidu@scms.vn hoặc vidu@gmail.com"
                      type="email"
                      required
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      className="h-10 text-sm px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 w-full text-slate-900 placeholder-slate-400 bg-white"
                      placeholder="0912 345 678"
                      type="tel"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Mật khẩu *
                    </label>
                    <input
                      className="h-10 text-sm px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 w-full text-slate-900 placeholder-slate-400 bg-white"
                      placeholder={isMockMode
                        ? 'Tối thiểu 6 ký tự'
                        : 'Tối thiểu 12 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt'}
                      type="password"
                      required
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Xác nhận mật khẩu *
                    </label>
                    <input
                      className="h-10 text-sm px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 w-full text-slate-900 placeholder-slate-400 bg-white"
                      placeholder="Nhập lại mật khẩu vừa đặt"
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                    />
                  </div>

                  <div className="pt-1">
                    <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-slate-600 leading-snug">
                      <input
                        className="w-4 h-4 rounded text-red-600 focus:ring-red-600 border-slate-300 mt-0.5 shrink-0"
                        type="checkbox"
                        checked={regAgree}
                        onChange={e => setRegAgree(e.target.checked)}
                      />
                      <span>Tôi đồng ý với Quy chế hoạt động và Chính sách bảo mật hội viên của SCMS.</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-chivo font-bold rounded-lg shadow-md transition-colors text-xs flex items-center justify-center uppercase tracking-wider mt-2"
                  >
                    {isSubmitting ? 'Đang tạo tài khoản...' : 'TẠO TÀI KHOẢN HỘI VIÊN'}
                  </button>
                </form>

                {/* Switch to Login */}
                <div className="mt-6 text-center text-xs text-slate-600">
                  Đã có tài khoản SCMS?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabChange('login')}
                    className="font-bold text-red-600 hover:underline"
                  >
                    Đăng nhập ngay
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Google Login Modal */}
      <GoogleLoginModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={(user) => {
          redirectToRoleDashboard(user.role);
        }}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onResetSuccess={(resetEmail) => {
          setLoginEmail(resetEmail);
          handleTabChange('login');
        }}
      />
    </div>
  );
}
