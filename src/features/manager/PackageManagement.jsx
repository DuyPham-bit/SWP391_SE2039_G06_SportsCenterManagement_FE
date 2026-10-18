import { packageApi, classApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { Badge } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { MAX_PACKAGE_PRICE, sortMembershipPackages, validatePackagePrice } from './packageManagementForm.js';

const { useState, useEffect } = React;

export function PackageManagement() {
  const { showSuccess, showError } = useToast();
  const [packages, setPackages] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [price, setPrice] = useState('');
  const [allowedSports, setAllowedSports] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [maxClasses, setMaxClasses] = useState('');
  const [accessType, setAccessType] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadPackages = async () => {
    try {
      const data = await packageApi.getAll();
      setPackages(sortMembershipPackages(data));
    } catch (e) {
      showError('Không thể tải danh sách gói tập');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const openCreateModal = () => {
    setEditingPkg(null);
    setName('');
    setDurationDays('');
    setPrice('');
    setAllowedSports('');
    setDescription('');
    setBadge('');
    setMaxClasses('');
    setAccessType('');
    setFeaturesText('');
    setModalOpen(true);
  };

  const openEditModal = (pkg) => {
    setEditingPkg(pkg);
    setName(pkg.name);
    setDurationDays(pkg.durationDays);
    setPrice(pkg.price);
    setAllowedSports(pkg.allowedSports ?? '');
    setDescription(pkg.description || '');
    setBadge(pkg.badge || '');
    setMaxClasses(pkg.maxClasses ?? '');
    setAccessType(pkg.accessType || '');
    setFeaturesText((pkg.features || []).join('\n'));
    setModalOpen(true);
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showError({
        message: 'Vui lòng nhập tên gói tập!',
        code: 'VAL-PKG-NAME',
        proposedHandling: 'Đặt tên gợi nhớ rõ ràng (ví dụ: Gói Bơi Olympic Tháng, Gói Hội Viên Bạch Kim).'
      });
      return;
    }

    const priceValidation = validatePackagePrice(price);
    if (!priceValidation.valid) {
      showError({
        message: priceValidation.message,
        code: 'VAL-PKG-PRICE',
        proposedHandling: `Nhập số tiền lớn hơn 0 và không vượt quá ${MAX_PACKAGE_PRICE.toLocaleString('vi-VN')} VNĐ; không bắt buộc theo bước 50.000 VNĐ.`
      });
      return;
    }

    if (Number(durationDays) <= 0) {
      showError({
        message: 'Thời hạn sử dụng gói phải từ 1 ngày trở lên.',
        code: 'VAL-PKG-DURATION',
        proposedHandling: 'Quy định thời hạn phổ biến: 30 ngày (1 tháng), 90 ngày (3 tháng), 365 ngày (1 năm).'
      });
      return;
    }

    if (Number(allowedSports) <= 0) {
      showError({
        message: 'Số bộ môn thể thao được phép tập phải từ 1 môn trở lên.',
        code: 'VAL-PKG-SPORTS',
        proposedHandling: 'Chọn số môn tối thiểu là 1 môn (hoặc 15 môn cho gói All-Access).'
      });
      return;
    }
    if (!Number.isInteger(Number(allowedSports)) || Number(allowedSports) < 1) {
      showError('Số môn được phép phải là số nguyên dương.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(), durationDays: Number(durationDays), price: Number(price),
        allowedSports: Number(allowedSports), description: description.trim(), badge: badge.trim(),
        maxClasses: maxClasses === '' ? null : Number(maxClasses), accessType: accessType.trim() || null,
        features: featuresText.split(/\r?\n/).map(feature => feature.trim()).filter(Boolean)
      };
      if (editingPkg) {
        await packageApi.update(editingPkg.id, {
          name: name.trim(),
          durationDays: Number(durationDays),
          price: priceValidation.value,
          allowedSports: Number(allowedSports),
          description: description.trim(),
          badge: badge.trim()
        });
        showSuccess('Cập nhật gói tập thành công!');
      } else {
        await packageApi.create({
          name: name.trim(),
          durationDays: Number(durationDays),
          price: priceValidation.value,
          allowedSports: Number(allowedSports),
          description: description.trim(),
          badge: badge.trim(),
          features: ['Toàn quyền sử dụng sân bãi trong gói', 'Tủ đồ thông minh', 'Nước uống điện giải']
        });
        showSuccess('Tạo gói tập mới thành công!');
      }
      setModalOpen(false);
      loadPackages();
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePackage = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await packageApi.delete(deleteTarget.id);
      showSuccess(`Đã ngừng bán gói ${deleteTarget.name}; lịch sử đăng ký được giữ lại.`);
      setDeleteTarget(null);
      await loadPackages();
    } catch (err) {
      showError(err.message || 'Không thể xóa gói tập');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (pkg) => {
    if (pkg.status === 'Active') {
      const confirmed = window.confirm(`Cảnh báo: Bạn có chắc chắn muốn ngưng phát hành gói "${pkg.name}"?\nCác hội viên đã mua gói này trước đó vẫn được bảo lưu thời hạn đến ngày kết thúc.`);
      if (!confirmed) return;
    }

    try {
      await packageApi.toggleStatus(pkg.id);
      showSuccess(`Đã thay đổi trạng thái của gói ${pkg.name}`);
      loadPackages();
    } catch (err) {
      showError(err);
    }
  };

  if (loading) return <LoadingSpinner text="Đang tải gói tập hội viên..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
            MANAGE MEMBERSHIP PACKAGES
          </span>
          <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Gói Tập Hội Viên
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Thiết lập giá cước, thời hạn và phân quyền bộ môn cho các gói tập rèn luyện.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add_card</span>
          <span>Tạo Gói Tập Mới</span>
        </button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map(pkg => (
          <div
            key={pkg.id}
            className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative ${pkg.status === 'ACTIVE' ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
          >
            {pkg.badge && (
              <span className="absolute top-4 right-4 px-2 py-0.5 rounded bg-red-50 text-red-600 font-chivo text-[10px] font-black uppercase tracking-wider border border-red-200">
                {pkg.badge}
              </span>
            )}

            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                Thời hạn: {pkg.durationDays} ngày
              </div>
              <h3 className="font-chivo text-lg font-black text-slate-900 leading-tight">
                {pkg.name}
              </h3>

              <div className="mt-4 mb-4">
                <span className="font-chivo text-3xl font-black text-red-600">
                  {pkg.price.toLocaleString()}đ
                </span>
                <span className="text-xs text-slate-500 font-medium ml-1">/ chu kỳ</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 text-xs text-slate-700 font-semibold mb-4 border border-slate-100 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-red-600 text-[18px]">sports_kabaddi</span>
                <span>Số môn được tập: {sports.length > 0 && pkg.allowedSports >= sports.length ? `Toàn bộ ${sports.length} môn hiện có` : `${pkg.allowedSports} môn`}</span>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                {pkg.description}
              </p>

              {pkg.features?.length > 0 && (
                <ul className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100 mb-6">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-emerald-600 text-[16px] shrink-0 mt-0.5">check_circle</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Badge variant={pkg.status}>{pkg.status}</Badge>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(pkg)}
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                  title="Chỉnh sửa gói"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  onClick={() => handleToggleStatus(pkg)}
                  className={`p-1.5 rounded hover:bg-slate-100 ${pkg.status === 'ACTIVE' ? 'text-amber-600' : 'text-emerald-600'}`}
                  title={pkg.status === 'ACTIVE' ? 'Tạm ẩn gói' : 'Mở lại gói'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {pkg.status === 'ACTIVE' ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
                <button
                  onClick={() => setDeleteTarget(pkg)}
                  className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-40"
                  title="Ngừng bán gói"
                  aria-label={`Xóa gói ${pkg.name}`}
                  disabled={saving || pkg.status !== 'ACTIVE'}
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Package Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPkg ? `Sửa gói: ${editingPkg.name}` : 'Tạo Gói Tập Mới'}
      >
        <form onSubmit={handleSavePackage} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Tên gói tập *
            </label>
            <input
              type="text"
              required
              placeholder="Nhập tên gói tập"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Thời hạn (Số ngày) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={durationDays}
                onChange={e => setDurationDays(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Giá cước (VNĐ) *
              </label>
              <input
                type="number"
                required
                min="0.01"
                max={MAX_PACKAGE_PRICE}
                step="0.01"
                inputMode="decimal"
                value={price}
                onChange={e => setPrice(e.target.value)}
                aria-describedby="package-price-hint"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
              <p id="package-price-hint" className="mt-1 text-[11px] leading-4 text-slate-500">
                Có thể nhập mọi mức giá hợp lệ (tối đa 2 số lẻ), không bắt buộc theo bội số 50.000 VNĐ.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Số môn được tập (theo danh sách môn đang hoạt động)
              </label>
              <input
                type="number"
                min="1"
                required
                value={allowedSports}
                onChange={e => setAllowedSports(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
            </div>
            <p className="col-span-2 text-xs text-slate-500">Trung tâm hiện có {sports.length} môn đang hoạt động.</p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nhãn nổi bật (Badge)
              </label>
              <input
                type="text"
                placeholder="VD: PHỔ BIẾN, VIP, TIẾT KIỆM"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Giới hạn số buổi (để trống nếu không giới hạn)
              <input type="number" min="1" value={maxClasses} onChange={e => setMaxClasses(e.target.value)} className="mt-1 w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white" />
            </label>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Loại quyền sử dụng
              <input type="text" maxLength="50" value={accessType} onChange={e => setAccessType(e.target.value)} className="mt-1 w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white" />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Mô tả chi tiết quyền lợi
            </label>
            <textarea
              rows="3"
              placeholder="Quyền lợi của hội viên khi đăng ký gói này..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Các quyền lợi hiển thị (mỗi dòng một mục)</label>
            <textarea rows="4" maxLength="2000" value={featuresText} onChange={e => setFeaturesText(e.target.value)} className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white" placeholder="Nhập quyền lợi theo chính sách của trung tâm" />
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
              {saving ? 'Đang lưu...' : 'Lưu Gói Tập'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={Boolean(deleteTarget)} onClose={() => !saving && setDeleteTarget(null)} title="Ngừng bán gói tập">
        <div className="space-y-4">
          <p>Gói <strong>{deleteTarget?.name}</strong> sẽ được chuyển sang ngừng bán. Lịch sử đăng ký vẫn được lưu.</p>
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 rounded-lg border" disabled={saving} onClick={() => setDeleteTarget(null)}>Hủy</button>
            <button type="button" className="px-4 py-2 rounded-lg bg-red-700 text-white disabled:opacity-50" disabled={saving} onClick={handleDeletePackage}>{saving ? 'Đang lưu...' : 'Xác nhận'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
