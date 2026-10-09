import React, { useState, useEffect } from 'react';
import { systemApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { LoadingSpinner } from '../../components/common/Table.jsx';
import { Badge } from '../../components/common/StatCard.jsx';
import { SYSTEM_CAPABILITIES } from '../../services/permissions.js';

export function RolesPermissions() {
  const { showSuccess, showError } = useToast();
  const [permissions, setPermissions] = useState(null);
  const [selectedRole, setSelectedRole] = useState('RECEPTIONIST');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const data = await systemApi.getPermissions();
        setPermissions(data);
      } catch (e) {
        showError('Lỗi tải dữ liệu phân quyền');
      } finally {
        setLoading(false);
      }
    }
    fetchPermissions();
  }, [showError]);

  const handleToggleCapability = (capId) => {
    if (!permissions) return;
    const currentList = permissions[selectedRole] || [];
    const updated = currentList.includes(capId)
      ? currentList.filter(c => c !== capId)
      : [...currentList, capId];

    setPermissions({
      ...permissions,
      [selectedRole]: updated
    });
  };

  const handleGrantAll = () => {
    if (!permissions) return;
    setPermissions({
      ...permissions,
      [selectedRole]: SYSTEM_CAPABILITIES.map(c => c.id)
    });
    showSuccess(`Đã cấp toàn bộ ${SYSTEM_CAPABILITIES.length} quyền cho vai trò ${selectedRole}. Hãy bấm 'Lưu Thay Đổi Phân Quyền'.`);
  };

  const handleResetDefaults = () => {
    if (!permissions) return;
    const defaults = SYSTEM_CAPABILITIES
      .filter(c => c.defaultRole === selectedRole)
      .map(c => c.id);

    setPermissions({
      ...permissions,
      [selectedRole]: defaults
    });
    showSuccess(`Đã đưa phân quyền ${selectedRole} về mặc định (${defaults.length} quyền). Hãy bấm 'Lưu Thay Đổi'.`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await systemApi.updatePermissions(selectedRole, permissions[selectedRole]);
      showSuccess(`Cập nhật quyền hạn cho vai trò ${selectedRole} thành công! Menu bên trái (Sidebar) đã được cập nhật ngay lập tức.`);
    } catch (err) {
      showError('Lỗi lưu quyền hạn');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Đang tải ma trận phân quyền..." />;

  const currentRoleCaps = permissions?.[selectedRole] || [];
  const grantedCapsList = SYSTEM_CAPABILITIES.filter(c => currentRoleCaps.includes(c.id));

  const categories = ['ALL', 'VẬN HÀNH & NHÂN SỰ', 'BÁO CÁO & BẢO MẬT', 'NGHIỆP VỤ LỄ TÂN', 'HUẤN LUYỆN VIÊN', 'GIÁO ÁN & CHUYÊN MÔN', 'HỘI VIÊN & ĐẶT CHỖ'];
  const filteredCaps = filterCategory === 'ALL'
    ? SYSTEM_CAPABILITIES
    : SYSTEM_CAPABILITIES.filter(c => c.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
            MANAGE SYSTEM ROLES & PERMISSIONS
          </span>
          <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Vai Trò & Ma Trận Phân Quyền
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình quyền hạn hệ thống theo chuẩn Role-Based Access Control (RBAC). Các mục chức năng tương ứng sẽ tự động hiển thị trên thanh Menu bên trái (Sidebar) khi được cấp quyền.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi Phân Quyền'}</span>
          </button>
        </div>
      </div>

      {/* Role Switcher Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['MANAGER', 'RECEPTIONIST', 'COACH', 'MEMBER'].map(r => (
          <button
            key={r}
            onClick={() => setSelectedRole(r)}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedRole === r
                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-red-500'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-chivo text-xs font-bold uppercase tracking-wider">{r}</span>
              <Badge variant={r} size="sm">{permissions?.[r]?.length || 0} quyền</Badge>
            </div>
            <p className={`text-[11px] mt-1.5 ${selectedRole === r ? 'text-slate-300' : 'text-slate-500'}`}>
              {r === 'MANAGER' && 'Toàn quyền điều hành và quản trị trung tâm'}
              {r === 'RECEPTIONIST' && 'Nghiệp vụ quầy đón tiếp và check-in'}
              {r === 'COACH' && 'Lịch dạy, học viên và điểm danh chuyên môn'}
              {r === 'MEMBER' && 'Đặt lớp, mua gói và theo dõi tập luyện'}
            </p>
          </button>
        ))}
      </div>

      {/* REAL-TIME PREVIEW: Menu Items & Actions Executable for This Role */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-lg border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold">
              <span className="material-symbols-outlined text-[20px]">view_sidebar</span>
            </div>
            <div>
              <h3 className="font-chivo text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
                <span>CÁC MỤC THỰC HIỆN ĐƯỢC PHÂN QUYỀN CHO VAI TRÒ</span>
                <span className="text-red-400 font-black">[{selectedRole}]</span>
              </h3>
              <p className="text-xs text-slate-400">
                Khi cấp quyền tại đây và bấm <strong>Lưu</strong>, thanh Menu bên trái (Sidebar) của vai trò <strong>{selectedRole}</strong> sẽ tự động hiển thị các mục tương ứng dưới đây:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-red-400 border border-white/10">
              {grantedCapsList.length} mục khả dụng
            </span>
          </div>
        </div>

        {/* List of granted items with direct link to perform */}
        {grantedCapsList.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            Vai trò này chưa được cấp quyền nào. Hãy tích chọn các quyền ở danh sách bên dưới rồi bấm <strong>Lưu Thay Đổi Phân Quyền</strong>.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 mt-4">
            {grantedCapsList.map(cap => (
              <div
                key={cap.id}
                className="bg-slate-800/90 hover:bg-slate-700/90 border border-slate-600/60 rounded-xl p-3 flex flex-col justify-between transition-all group"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">{cap.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-chivo text-xs font-bold text-white truncate">{cap.targetScreenName}</div>
                    <div className="text-[10px] text-slate-400 truncate">{cap.label}</div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                  <code className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">{cap.path}</code>
                  <a
                    href={cap.path}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-white transition-colors uppercase tracking-wider"
                  >
                    <span>Thực hiện quyền</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Permissions Checkbox Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
          <div>
            <h2 className="font-chivo text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">tune</span>
              Ma trận thiết lập quyền ({SYSTEM_CAPABILITIES.length} quyền hệ thống)
            </h2>
            <span className="text-xs text-slate-500">
              Đang chỉnh sửa quyền cho vai trò: <strong className="text-red-600 font-bold">{selectedRole}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGrantAll}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">select_all</span>
              <span>Cấp tất cả quyền</span>
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Về mặc định</span>
            </button>
          </div>
        </div>

        {/* Filter by Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 text-xs font-medium border-b border-slate-100">
          <span className="text-slate-400 text-xs shrink-0 font-bold uppercase mr-1">Nhóm:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider shrink-0 transition-all ${
                filterCategory === cat
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'TẤT CẢ' : cat}
            </button>
          ))}
        </div>

        {/* Grid of Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCaps.map(cap => {
            const isChecked = currentRoleCaps.includes(cap.id);
            return (
              <div
                key={cap.id}
                className={`p-4 rounded-xl border transition-all ${
                  isChecked
                    ? 'bg-red-50/40 border-red-300 shadow-sm'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`cap-${cap.id}`}
                    checked={isChecked}
                    onChange={() => handleToggleCapability(cap.id)}
                    className="w-5 h-5 rounded text-red-600 focus:ring-red-600 border-slate-300 mt-0.5 shrink-0 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <label htmlFor={`cap-${cap.id}`} className="cursor-pointer block">
                      <div className="flex items-center justify-between">
                        <div className="font-chivo text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[18px] text-red-600">{cap.icon}</span>
                          <span>{cap.label}</span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isChecked
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {isChecked ? 'ĐÃ CẤP QUYỀN' : 'CHƯA CẤP'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {cap.desc}
                      </p>
                    </label>

                    {/* MỤC THỰC HIỆN QUYỀN (Execution Target & Direct Action) */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 truncate">
                        <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">arrow_right_alt</span>
                        <span className="text-[11px] text-slate-400">Mục thực hiện:</span>
                        <strong className="text-slate-800 text-[11px] truncate">{cap.targetScreenName}</strong>
                      </div>

                      <a
                        href={cap.path}
                        className="px-2.5 py-1 bg-white hover:bg-red-600 hover:text-white border border-slate-200 hover:border-red-600 text-slate-700 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 shadow-sm"
                        title={`Mở màn hình ${cap.targetScreenName} để thực hiện`}
                      >
                        <span>Thực hiện quyền</span>
                        <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
