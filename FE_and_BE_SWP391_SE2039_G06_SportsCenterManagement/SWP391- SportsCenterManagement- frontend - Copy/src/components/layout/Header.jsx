import { useAuth } from '../../context/AuthContext.js';
import { Badge } from '../common/StatCard.js';

const { useState } = React;

export function Header({ onOpenProfile, onToggleSidebar }) {
  const { currentUser, role, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleLabel = (r) => {
    switch (r) {
      case 'MANAGER': return 'Quản lý (Manager)';
      case 'RECEPTIONIST': return 'Lễ tân (Receptionist)';
      case 'COACH': return 'Huấn luyện viên (Coach)';
      case 'MEMBER': return 'Hội viên (Member)';
      default: return r;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-sm">
      {/* Left: Mobile Toggle & Center Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <a href="#/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm font-chivo font-black text-base">
            S
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-chivo font-black text-sm tracking-tight text-slate-900 leading-none">
              SCMS
            </span>
            <span className="text-[10px] font-bold text-red-600 tracking-widest uppercase leading-none mt-0.5">
              Sports Center
            </span>
          </div>
        </a>

        {/* Live System Indicator */}
        <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-600 ml-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Hệ thống trực tuyến</span>
        </div>

        {/* Swagger / OpenAPI Link */}
        <a
          href="/swagger.html"
          target="_blank"
          rel="noreferrer"
          className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          title="Mở tài liệu Swagger / OpenAPI 3.0 tương tác"
        >
          <span className="material-symbols-outlined text-[16px] text-emerald-600">api</span>
          <span>Swagger UI</span>
        </a>
      </div>

      {/* Right: User Role Badge + User Avatar */}
      <div className="flex items-center gap-3">
        {/* User Role Badge */}
        <div className="hidden sm:flex items-center">
          <Badge variant={role} size="sm">{role}</Badge>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser?.fullName || 'Người dùng'}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {currentUser?.email}
              </div>
            </div>
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover border-2 border-red-600 shadow-sm"
            />
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50"
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{currentUser?.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                <p className="text-[10px] text-red-600 font-bold uppercase mt-1">{getRoleLabel(role)}</p>
              </div>

              <button
                onClick={() => { setShowUserMenu(false); onOpenProfile(); }}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                <span>Hồ sơ & Đổi mật khẩu</span>
              </button>

              <a
                href="#/"
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-400">home</span>
                <span>Trang chủ Landing Page</span>
              </a>

              <a
                href="/swagger.html"
                target="_blank"
                rel="noreferrer"
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px] text-emerald-600">api</span>
                <span>Swagger / OpenAPI UI</span>
              </a>

              <a
                href="/SCMS_Sports_Center_API.postman_collection.json"
                download="SCMS_Sports_Center_API.postman_collection.json"
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px] text-orange-500">file_download</span>
                <span>Tải Postman Collection</span>
              </a>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={() => { setShowUserMenu(false); logout(); window.location.hash = '#/login'; }}
                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
