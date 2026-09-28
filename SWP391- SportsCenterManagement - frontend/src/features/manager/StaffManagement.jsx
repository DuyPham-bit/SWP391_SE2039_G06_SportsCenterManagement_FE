import { staffApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Table, LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.js';
import { Badge } from '../../components/common/StatCard.js';

const { useState, useEffect } = React;

export function StaffManagement() {
  const { showSuccess, showError } = useToast();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('COACH');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formCertification, setFormCertification] = useState('');
  const [saving, setSaving] = useState(false);

  const loadStaff = async () => {
    try {
      const data = await staffApi.getAll();
      setStaffList(data);
    } catch (e) {
      showError('Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const openCreateModal = () => {
    setEditingStaff(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('COACH');
    setFormSpecialty('');
    setFormCertification('');
    setModalOpen(true);
  };

  const openEditModal = (staff) => {
    setEditingStaff(staff);
    setFormName(staff.fullName);
    setFormEmail(staff.email);
    setFormPhone(staff.phone || '');
    setFormRole(staff.role);
    setFormSpecialty(staff.specialty || '');
    setFormCertification(staff.certification || '');
    setModalOpen(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      showError('Vui lòng điền tên và email!');
      return;
    }

    setSaving(true);
    try {
      if (editingStaff) {
        await staffApi.update(editingStaff.id, {
          fullName: formName.trim(),
          phone: formPhone.trim(),
          role: formRole,
          specialty: formSpecialty.trim(),
          certification: formCertification.trim()
        });
        showSuccess('Cập nhật nhân viên thành công!');
      } else {
        await staffApi.create({
          fullName: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          role: formRole,
          specialty: formSpecialty.trim(),
          certification: formCertification.trim()
        });
        showSuccess('Thêm nhân viên mới thành công!');
      }
      setModalOpen(false);
      loadStaff();
    } catch (err) {
      showError(err.message || 'Lỗi lưu nhân viên');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (staff) => {
    try {
      await staffApi.toggleStatus(staff.id);
      showSuccess(`Đã thay đổi trạng thái của ${staff.fullName}`);
      loadStaff();
    } catch (err) {
      showError(err.message || 'Không thể đổi trạng thái');
    }
  };

  const filteredStaff = roleFilter === 'ALL'
    ? staffList
    : staffList.filter(s => s.role === roleFilter);

  const columns = [
    {
      header: 'Nhân Viên',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt=""
            className="w-9 h-9 rounded-full object-cover border border-slate-200"
          />
          <div>
            <div className="font-bold text-slate-900">{row.fullName}</div>
            <div className="text-xs text-slate-500">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Vai Trò',
      render: (row) => <Badge variant={row.role}>{row.role}</Badge>
    },
    {
      header: 'Chuyên Môn & Chứng Chỉ',
      render: (row) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{row.specialty || 'Vận hành trung tâm'}</div>
          {row.certification && (
            <div className="text-[11px] text-red-600 font-semibold">{row.certification}</div>
          )}
        </div>
      )
    },
    {
      header: 'Số Điện Thoại',
      accessor: 'phone'
    },
    {
      header: 'Trạng Thái',
      render: (row) => <Badge variant={row.status}>{row.status}</Badge>
    },
    {
      header: 'Hành Động',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
            title="Chỉnh sửa thông tin"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            onClick={() => handleToggleStatus(row)}
            className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${row.status === 'ACTIVE' ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
              }`}
            title={row.status === 'ACTIVE' ? 'Khóa nhân viên' : 'Kích hoạt lại'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {row.status === 'ACTIVE' ? 'block' : 'check_circle'}
            </span>
          </button>
        </div>
      )
    }
  ];

  if (loading) return <LoadingSpinner text="Đang tải danh sách nhân sự..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
            MANAGE STAFF ACCOUNTS
          </span>
          <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Tài Khoản Nhân Viên
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý đội ngũ Huấn luyện viên, Lễ tân và Kỹ thuật viên đạt chuẩn Olympic.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Thêm Nhân Viên Mới</span>
        </button>
      </div>

      {/* Role Filter Chips */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Lọc vai trò:</span>
        {['ALL', 'COACH', 'RECEPTIONIST', 'MANAGER'].map(r => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-all ${roleFilter === r
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
          >
            {r === 'ALL' ? 'Tất cả' : r}
          </button>
        ))}
      </div>

      {/* Staff Table */}
      <Table
        columns={columns}
        data={filteredStaff}
        searchKey="fullName"
        searchPlaceholder="Tìm theo tên nhân viên..."
        emptyMessage="Không tìm thấy nhân viên nào phù hợp"
      />

      {/* Create / Edit Staff Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStaff ? `Chỉnh sửa: ${editingStaff.fullName}` : 'Thêm Nhân Viên Mới'}
      >
        <form onSubmit={handleSaveStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Họ và tên nhân viên *
            </label>
            <input
              type="text"
              required
              placeholder="Nguyễn Văn Huấn"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Email công vụ *
            </label>
            <input
              type="email"
              required
              disabled={Boolean(editingStaff)}
              placeholder="coach.ten@scms.vn"
              value={formEmail}
              onChange={e => setFormEmail(e.target.value)}
              className={`w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 ${editingStaff ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
                }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Vai trò hệ thống *
              </label>
              <select
                value={formRole}
                onChange={e => setFormRole(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-medium"
              >
                <option value="COACH">Huấn luyện viên (COACH)</option>
                <option value="RECEPTIONIST">Lễ tân (RECEPTIONIST)</option>
                <option value="MANAGER">Quản lý (MANAGER)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                placeholder="0987 654 321"
                value={formPhone}
                onChange={e => setFormPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Chuyên môn môn học
            </label>
            <input
              type="text"
              placeholder="VD: Bơi lội & Gym, Cầu lông, Yoga..."
              value={formSpecialty}
              onChange={e => setFormSpecialty(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Chứng chỉ đào tạo quốc tế
            </label>
            <input
              type="text"
              placeholder="VD: AFC Level A, BWF Certified, NASM-CPT"
              value={formCertification}
              onChange={e => setFormCertification(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors"
            >
              {saving ? 'Đang lưu...' : 'Lưu Nhân Viên'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
