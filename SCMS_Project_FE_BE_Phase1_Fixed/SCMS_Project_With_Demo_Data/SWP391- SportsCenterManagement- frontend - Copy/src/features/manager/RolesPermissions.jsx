import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { systemApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { LoadingSpinner } from '../../components/common/Table.jsx';

// Only SystemAdmin can access /api/admin/roles. The UI sends real permission codes
// and numeric role IDs returned by the API, not the local menu capability IDs.
export function RolesPermissions() {
  const { showSuccess, showError } = useToast();
  const [roles, setRoles] = useState([]);
  const [available, setAvailable] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [draft, setDraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [roleMatrix, codes] = await Promise.all([systemApi.getPermissions(), systemApi.getAllPermissionCodes()]);
      setRoles(roleMatrix);
      setAvailable(codes);
      setSelectedRoleId(current => String(roleMatrix.find(x => String(x.roleId) === current)?.roleId ?? roleMatrix[0]?.roleId ?? ''));
    } catch (error) {
      showError(error.message || 'Không tải được ma trận phân quyền từ Backend.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { load(); }, [load]);
  const selected = useMemo(() => roles.find(row => String(row.roleId) === selectedRoleId), [roles, selectedRoleId]);
  useEffect(() => { setDraft(selected?.permissions?.map(p => p.code) || []); }, [selected]);

  const toggle = code => setDraft(current => current.includes(code)
    ? current.filter(item => item !== code) : [...current, code]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const result = await systemApi.updatePermissions(selected.roleId, draft);
      setRoles(previous => previous.map(row => row.roleId === selected.roleId ? result : row));
      showSuccess(`Đã lưu ${result.permissions.length} quyền cho ${result.roleName}.`);
    } catch (error) {
      showError(error.message || 'Không lưu được quyền.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Đang tải ma trận quyền từ máy chủ..." />;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-chivo text-2xl font-black text-slate-900">Quản trị vai trò & quyền hệ thống</h1>
        <p className="text-sm text-slate-600 mt-2">Dành cho SystemAdmin. Quyền được đọc và lưu trực tiếp bằng mã quyền của Backend, không dùng quyền giao diện giả.</p>
      </header>
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <label htmlFor="selectedRole" className="block text-sm font-bold">Vai trò</label>
        <select id="selectedRole" value={selectedRoleId} onChange={e => setSelectedRoleId(e.target.value)} className="rounded-lg border p-2 w-full">
          {roles.map(role => <option key={role.roleId} value={role.roleId}>{role.roleName} (ID {role.roleId})</option>)}
        </select>
        {selected?.roleDescription && <p className="text-sm text-slate-500">{selected.roleDescription}</p>}
        {available.length === 0 ? <p className="text-sm text-red-700">Máy chủ không cung cấp danh mục quyền. Không thể lưu thay đổi.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {available.map(permission => (
              <label key={permission.code} className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer">
                <input type="checkbox" checked={draft.includes(permission.code)} onChange={() => toggle(permission.code)} className="mt-1" />
                <span><strong className="block text-sm">{permission.name || permission.code}</strong><code className="text-xs">{permission.code}</code><span className="block text-xs text-slate-500">{permission.description}</span></span>
              </label>
            ))}
          </div>
        )}
        <button type="button" disabled={!selected || !available.length || saving} onClick={save} className="bg-red-600 text-white rounded-lg px-5 py-2 disabled:opacity-50">
          {saving ? 'Đang lưu...' : 'Lưu quyền trên máy chủ'}
        </button>
      </div>
    </div>
  );
}
