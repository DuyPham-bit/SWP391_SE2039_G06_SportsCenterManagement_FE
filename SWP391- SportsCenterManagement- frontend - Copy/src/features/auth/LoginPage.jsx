import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { SUPPORTED_SPORTS } from '../../services/sportsCatalog.js';
import { isAsciiPassword, PASSWORD_CHARACTER_ERROR } from '../../services/passwordPolicy.js';
import { AuthField } from './AuthField.js';
import { ForgotPasswordModal } from './ForgotPasswordModal.js';
import { GoogleLoginModal } from './GoogleLoginModal.js';

const REMEMBERED_EMAIL_KEY = 'SCMS_REMEMBERED_EMAIL';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FACILITY_COUNT = new Set(SUPPORTED_SPORTS.map(sport => sport.facilityId)).size;

function readRememberedEmail() {
  try {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

function saveRememberedEmail(email) {
  try {
    if (email) localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  } catch {
    // Lưu trữ có thể bị tắt; người dùng vẫn đăng nhập bình thường.
  }
}

function redirectToRoleDashboard(role) {
  const routes = {
    MANAGER: '#/manager/dashboard',
    RECEPTIONIST: '#/receptionist/dashboard',
    COACH: '#/coach/dashboard',
    MEMBER: '#/member/dashboard'
  };
  window.location.hash = routes[role] || '#/';
}

export function LoginPage() {
  const { login, register, isAuthenticated, role } = useAuth();
  const { showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState(() => window.location.hash.split('?')[0] === '#/register' ? 'register' : 'login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState(readRememberedEmail);
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(() => Boolean(readRememberedEmail()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAgree, setRegAgree] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const isRegister = activeTab === 'register';

  const clearFormFeedback = () => {
    setFieldErrors({});
    setFormError('');
  };

  useEffect(() => {
    const handleHashChange = () => {
      const path = window.location.hash.split('?')[0];
      if (path === '#/login' || path === '#/register') {
        setActiveTab(path === '#/register' ? 'register' : 'login');
        setFieldErrors({});
        setFormError('');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (isAuthenticated) redirectToRoleDashboard(role);
  }, [isAuthenticated, role]);

  const handleTabChange = (tab) => {
    if (isSubmitting || tab === activeTab) return;
    clearFormFeedback();
    setLoginPassword('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegAgree(false);
    setActiveTab(tab);
    window.location.hash = tab === 'register' ? '#/register' : '#/login';
  };

  const updateField = (id, value, setter) => {
    setter(value);
    setFieldErrors(previous => ({ ...previous, [id]: undefined }));
    setFormError('');
  };

  const hasValidationErrors = (errors) => {
    setFieldErrors(errors);
    setFormError('');
    const firstField = Object.keys(errors)[0];
    if (firstField) document.getElementById(firstField)?.focus();
    return Boolean(firstField);
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    const email = loginEmail.trim();
    const errors = {};
    if (!email) errors['login-email'] = 'Vui lòng nhập email của bạn.';
    else if (!EMAIL_PATTERN.test(email)) errors['login-email'] = 'Email chưa đúng định dạng.';
    if (!loginPassword) errors['login-password'] = 'Vui lòng nhập mật khẩu.';
    else if (!isAsciiPassword(loginPassword)) errors['login-password'] = PASSWORD_CHARACTER_ERROR;
    if (hasValidationErrors(errors)) return;

    setIsSubmitting(true);
    try {
      const user = await login(email, loginPassword);
      saveRememberedEmail(rememberEmail ? email : '');
      showSuccess('Đăng nhập thành công! Chào mừng ' + user.fullName + '.');
      redirectToRoleDashboard(user.role);
    } catch (error) {
      setFormError(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    const email = regEmail.trim();
    const phone = regPhone.replace(/[\s().-]/g, '');
    const errors = {};
    if (!regFullName.trim()) errors['register-name'] = 'Vui lòng nhập họ và tên.';
    if (!email) errors['register-email'] = 'Vui lòng nhập email của bạn.';
    else if (!EMAIL_PATTERN.test(email)) errors['register-email'] = 'Email chưa đúng định dạng.';
    if (phone && !/^(0\d{9}|\+84\d{9})$/.test(phone)) {
      errors['register-phone'] = 'Nhập số điện thoại gồm 10 số hoặc dùng đầu số +84.';
    }
    if (!isAsciiPassword(regPassword)) errors['register-password'] = PASSWORD_CHARACTER_ERROR;
    else if (regPassword.length < 6) errors['register-password'] = 'Mật khẩu cần ít nhất 6 ký tự.';
    if (!regConfirmPassword) errors['register-confirm'] = 'Vui lòng nhập lại mật khẩu.';
    else if (!isAsciiPassword(regConfirmPassword)) errors['register-confirm'] = PASSWORD_CHARACTER_ERROR;
    else if (regPassword !== regConfirmPassword) errors['register-confirm'] = 'Mật khẩu xác nhận chưa khớp.';
    if (!regAgree) errors['register-agree'] = 'Vui lòng xác nhận thông tin trước khi đăng ký.';
    if (hasValidationErrors(errors)) return;

    setIsSubmitting(true);
    try {
      const user = await register({ fullName: regFullName.trim(), email, phone, password: regPassword });
      showSuccess('Đăng ký thành công! Mã hội viên của bạn: ' + user.memberCode);
      redirectToRoleDashboard(user.role || 'MEMBER');
    } catch (error) {
      setFormError(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitButton = (
    <button type="submit" disabled={isSubmitting} className="w-full min-h-12 px-4 py-3 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white font-chivo text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-600/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-wait transition-colors">
      {isSubmitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />}
      <span>{isSubmitting ? (isRegister ? 'Đang tạo tài khoản...' : 'Đang đăng nhập...') : (isRegister ? 'Tạo tài khoản hội viên' : 'Đăng nhập')}</span>
      {!isSubmitting && <span className="material-symbols-outlined text-[19px]" aria-hidden="true">arrow_forward</span>}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-inter text-slate-900">
      <header className="h-20 shrink-0 bg-white border-b border-slate-200">
        <div className="h-full w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-10 flex items-center justify-between gap-4">
          <a href="#/" aria-label="SCMS Sports Center - Trang chủ" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
            <span className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm font-chivo font-black text-xl">S</span>
            <span className="flex flex-col">
              <span className="font-chivo font-black text-lg leading-none">SCMS</span>
              <span className="text-[10px] font-bold text-red-600 tracking-widest uppercase mt-1">Sports Center</span>
            </span>
          </a>
          <a href="#/" className="inline-flex items-center gap-1.5 py-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-red-600 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
            <span>Về trang chủ</span>
          </a>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1440px] mx-auto grid lg:grid-cols-2 gap-8 xl:gap-12 p-4 sm:p-8 lg:p-10">
        <aside className="hidden lg:flex flex-col justify-between min-h-[640px] p-10 xl:p-12 rounded-3xl relative overflow-hidden bg-slate-950 text-white">
          <img alt="" className="absolute inset-0 object-cover w-full h-full opacity-60" src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1600&auto=format&fit=crop" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/50" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden="true" />
              Cộng đồng thể thao SCMS
            </span>
          </div>
          <div className="relative z-10 py-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400 mb-4">Khỏe hơn mỗi ngày</p>
            <h2 className="font-chivo text-4xl xl:text-5xl font-black leading-[1.15] tracking-tight">
              {isRegister ? 'Hành trình mới, phiên bản khỏe hơn.' : 'Tập luyện hôm nay, bứt phá mỗi ngày.'}
            </h2>
            <p className="text-sm xl:text-base text-slate-300 mt-5 leading-7 max-w-md">
              Khám phá {SUPPORTED_SPORTS.length} bộ môn tại {FACILITY_COUNT} khu tập luyện. Chọn môn bạn yêu thích và xây dựng thói quen vận động cùng SCMS.
            </p>
            <ul className="space-y-4 mt-8 text-sm text-slate-200">
              {[
                { icon: 'calendar_month', text: 'Chủ động sắp xếp lịch học và lịch tập' },
                { icon: 'sports_tennis', text: 'Tìm sân và đặt chỗ cho môn yêu thích' },
                { icon: 'monitoring', text: 'Theo dõi tiến độ tập luyện của bạn' }
              ].map(item => (
                <li key={item.icon} className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-red-400 text-[20px]" aria-hidden="true">{item.icon}</span>
                  </span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative z-10 border-t border-white/15 pt-6 flex items-end justify-between gap-4">
            <div className="flex gap-8">
              <div><div className="font-chivo text-3xl font-black text-white">{SUPPORTED_SPORTS.length}</div><div className="text-xs text-slate-400 mt-1">Bộ môn thể thao</div></div>
              <div><div className="font-chivo text-3xl font-black text-white">{FACILITY_COUNT}</div><div className="text-xs text-slate-400 mt-1">Khu tập luyện</div></div>
            </div>
            <a href="#khoa-hoc" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
              Khám phá<span className="material-symbols-outlined text-[17px]" aria-hidden="true">arrow_forward</span>
            </a>
          </div>
        </aside>

        <section aria-labelledby="auth-heading" className="min-w-0 flex flex-col items-center justify-center py-4">
          <p className="lg:hidden mb-5 text-xs font-semibold text-slate-500">{SUPPORTED_SPORTS.length} bộ môn · {FACILITY_COUNT} khu tập luyện · SCMS Sports</p>
          <div className="w-full max-w-[520px] p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-900/5">
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1 mb-7" role="group" aria-label="Chọn đăng nhập hoặc đăng ký">
              {[{ id: 'login', label: 'Đăng nhập' }, { id: 'register', label: 'Đăng ký' }].map(tab => (
                <button key={tab.id} type="button" aria-pressed={activeTab === tab.id} disabled={isSubmitting} onClick={() => handleTabChange(tab.id)} className={'flex-1 min-h-11 rounded-lg text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-60 transition-colors ' + (activeTab === tab.id ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-900')}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="mb-6">
              <h1 id="auth-heading" className="font-chivo text-2xl sm:text-3xl font-black tracking-tight">{isRegister ? 'Gia nhập SCMS' : 'Chào mừng trở lại!'}</h1>
              <p className="text-sm text-slate-500 mt-2 leading-6">{isRegister ? 'Tạo tài khoản để khám phá khóa học, đặt sân và bắt đầu tập luyện.' : 'Đăng nhập để quản lý lịch tập, đặt sân và theo dõi tiến độ của bạn.'}</p>
            </div>
            <button type="button" disabled={isSubmitting} onClick={() => setShowGoogleModal(true)} className="w-full min-h-12 px-3 py-2.5 inline-flex items-center justify-center gap-3 border border-slate-300 rounded-xl bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-60 transition-colors">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.13z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
              </svg>
              <span>Tiếp tục với Google</span>
            </button>
            <div className="flex items-center gap-3 my-6 text-xs text-slate-400">
              <span className="h-px bg-slate-200 flex-1" /><span>hoặc dùng email</span><span className="h-px bg-slate-200 flex-1" />
            </div>
            {formError && <div role="alert" className="mb-5 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700 leading-6">{formError}</div>}

            {!isRegister ? (
              <form onSubmit={handleLoginSubmit} noValidate aria-labelledby="auth-heading" aria-busy={isSubmitting}>
                <fieldset disabled={isSubmitting} className="space-y-5 min-w-0">
                  <AuthField key="login-email" id="login-email" label="Email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={150} placeholder="ban@example.com" required value={loginEmail} error={fieldErrors['login-email']} onChange={event => updateField('login-email', event.target.value, setLoginEmail)} />
                  <AuthField key="login-password" id="login-password" label="Mật khẩu" type="password" autoComplete="current-password" placeholder="Nhập mật khẩu của bạn" required value={loginPassword} error={fieldErrors['login-password']} onChange={event => updateField('login-password', event.target.value, setLoginPassword)} />
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                    <label className="inline-flex items-center gap-2 text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={rememberEmail} onChange={event => { setRememberEmail(event.target.checked); if (!event.target.checked) saveRememberedEmail(''); }} className="w-4 h-4 accent-red-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500" />
                      <span>Ghi nhớ email</span>
                    </label>
                    <button type="button" onClick={() => setShowForgotPassword(true)} className="font-semibold text-red-600 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">Quên mật khẩu?</button>
                  </div>
                  {submitButton}
                </fieldset>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} noValidate aria-labelledby="auth-heading" aria-busy={isSubmitting}>
                <fieldset disabled={isSubmitting} className="space-y-4 min-w-0">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <AuthField key="register-name" id="register-name" label="Họ và tên" autoComplete="name" maxLength={150} placeholder="Nguyễn Văn A" required value={regFullName} error={fieldErrors['register-name']} onChange={event => updateField('register-name', event.target.value, setRegFullName)} />
                    <AuthField key="register-phone" id="register-phone" label="Số điện thoại" type="tel" autoComplete="tel" maxLength={20} placeholder="Không bắt buộc" value={regPhone} error={fieldErrors['register-phone']} onChange={event => updateField('register-phone', event.target.value, setRegPhone)} />
                  </div>
                  <AuthField key="register-email" id="register-email" label="Email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={150} placeholder="ban@example.com" required value={regEmail} error={fieldErrors['register-email']} onChange={event => updateField('register-email', event.target.value, setRegEmail)} />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <AuthField key="register-password" id="register-password" label="Mật khẩu" type="password" autoComplete="new-password" minLength={6} maxLength={128} placeholder="Tạo mật khẩu" hint="Tối thiểu 6 ký tự." required value={regPassword} error={fieldErrors['register-password']} onChange={event => updateField('register-password', event.target.value, setRegPassword)} />
                    <AuthField key="register-confirm" id="register-confirm" label="Nhập lại mật khẩu" type="password" autoComplete="new-password" maxLength={128} placeholder="Xác nhận mật khẩu" required value={regConfirmPassword} error={fieldErrors['register-confirm']} onChange={event => updateField('register-confirm', event.target.value, setRegConfirmPassword)} />
                  </div>
                  <div>
                    <label htmlFor="register-agree" className="flex items-start gap-2.5 text-xs leading-5 text-slate-600 cursor-pointer">
                      <input id="register-agree" type="checkbox" required checked={regAgree} aria-invalid={Boolean(fieldErrors['register-agree'])} aria-describedby={fieldErrors['register-agree'] ? 'register-agree-error' : undefined} onChange={event => updateField('register-agree', event.target.checked, setRegAgree)} className="w-4 h-4 shrink-0 mt-0.5 accent-red-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500" />
                      <span>Tôi xác nhận thông tin trên là chính xác và đồng ý tạo tài khoản hội viên SCMS.</span>
                    </label>
                    {fieldErrors['register-agree'] && <p id="register-agree-error" className="text-xs text-red-600 leading-5 mt-1.5">{fieldErrors['register-agree']}</p>}
                  </div>
                  {submitButton}
                </fieldset>
              </form>
            )}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm leading-6 text-slate-500">
              {isRegister ? 'Đã có tài khoản?' : 'Bạn chưa có tài khoản?'}{' '}
              <button type="button" disabled={isSubmitting} onClick={() => handleTabChange(isRegister ? 'login' : 'register')} className="font-semibold text-red-600 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-60">
                {isRegister ? 'Đăng nhập ngay' : 'Đăng ký hội viên'}
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center mt-5 leading-6">Cần hỗ trợ? <a href="tel:0859859367" className="font-semibold text-slate-700 hover:text-red-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">0859 859 367</a></p>
        </section>
      </main>

      <GoogleLoginModal isOpen={showGoogleModal} onClose={() => setShowGoogleModal(false)} onSuccess={user => redirectToRoleDashboard(user.role)} />
      <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} onResetSuccess={email => { setLoginEmail(email); clearFormFeedback(); handleTabChange('login'); }} />
    </div>
  );
}
