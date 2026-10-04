import { packageApi, memberApi, isMockMode } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/Table.js';

const { useState, useEffect } = React;

export function MemberPackages() {
  const { currentUser, refreshUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Checkout Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function loadPkgs() {
      try {
        const data = await packageApi.getAll();
        setPackages(data.filter(p => p.status === 'ACTIVE'));
      } catch (err) {
        showError(err.message || 'Không thể tải danh mục gói tập.');
      } finally {
        setLoading(false);
      }
    }
    loadPkgs();
  }, []);

  const handleOpenCheckout = (pkg) => {
    setSelectedPkg(pkg);
    setModalOpen(true);
  };

  const handleConfirmSubscribe = async () => {
    if (!selectedPkg || !currentUser) return;

    setProcessing(true);
    try {
      const res = await memberApi.subscribeOnline({
        memberId: currentUser.id,
        packageId: selectedPkg.id,
        paymentMethod
      });
      if (res.paymentUrl) {
        window.location.assign(res.paymentUrl);
        return;
      }
      refreshUser();
      showSuccess(`Đăng ký gói ${selectedPkg.name} thành công! Mã giao dịch: ${res.transactionRef}`);
      setModalOpen(false);
    } catch (err) {
      showError(err.message || 'Lỗi thanh toán');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner text="Đang tải danh mục gói tập..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
          SUBSCRIBE / RENEW PACKAGE
        </span>
        <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
          Đăng Ký & Gia Hạn Gói Tập Trực Tuyến
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Lựa chọn gói rèn luyện phù hợp với mục tiêu thể lực của bạn. Kích hoạt trực tuyến tức thì.
        </p>
      </div>

      {/* Current Package Reminder */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-red-400">Gói tập hiện tại của bạn:</span>
          <div className="font-chivo text-lg font-black">{currentUser?.packageName || 'Chưa đăng ký gói'}</div>
        </div>
        <div className="text-xs text-slate-300">
          Hạn sử dụng: <strong className="text-white">{currentUser?.packageExpiry || 'Hết hạn'}</strong>
        </div>
      </div>

      {/* Package Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map(pkg => {
          const isCurrent = currentUser?.packageId === pkg.id && currentUser?.packageStatus === 'ACTIVE';
          return (
            <div
              key={pkg.id}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all relative ${pkg.badge === 'VIP OLYMPIC' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                }`}
            >
              {pkg.badge && (
                <span className="absolute top-4 right-4 px-2 py-0.5 rounded bg-red-50 text-red-600 font-chivo text-[10px] font-black uppercase tracking-wider border border-red-200">
                  {pkg.badge}
                </span>
              )}

              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {pkg.durationDays} Ngày rèn luyện
                </div>
                <h3 className="font-chivo text-lg font-black text-slate-900 leading-tight mt-1">
                  {pkg.name}
                </h3>

                <div className="mt-4 mb-4">
                  <span className="font-chivo text-3xl font-black text-red-600">
                    {pkg.price.toLocaleString()}đ
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-1">/ gói</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 text-xs text-slate-700 font-semibold mb-3 border border-slate-100">
                  Môn áp dụng: {pkg.allowedSports === 15 ? 'Toàn quyền 15 môn' : `${pkg.allowedSports} môn tự chọn`}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {pkg.description}
                </p>

                {pkg.features && (
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

              <button
                onClick={() => handleOpenCheckout(pkg)}
                className={`w-full py-2.5 rounded-xl font-chivo text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${isCurrent
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
              >
                {isCurrent ? 'Gia Hạn Thêm Chu Kỳ' : 'Đăng Ký Gói Này'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Thanh Toán Trực Tuyến Gói Tập"
      >
        {selectedPkg && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Gói đăng ký:</span>
                <span className="font-bold text-slate-900">{selectedPkg.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời hạn sử dụng:</span>
                <span className="font-bold text-slate-900">{selectedPkg.durationDays} ngày</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black">
                <span>Số tiền thanh toán:</span>
                <span className="text-red-600 font-chivo">{selectedPkg.price.toLocaleString()} VNĐ</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Chọn cổng thanh toán *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(isMockMode ? ['VNPAY', 'MOMO', 'VIETQR'] : ['VNPAY']).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`p-3 rounded-xl border text-xs font-chivo font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 ${paymentMethod === m
                        ? 'bg-red-600 text-white border-red-600 shadow-md'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {m === 'MOMO' ? 'account_balance_wallet' : m === 'VIETQR' ? 'qr_code_2' : 'credit_card'}
                    </span>
                    <span>{m}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">verified</span>
              <span>Cổng thanh toán bảo mật liên ngân hàng. Thẻ tập sẽ được hệ thống SCMS kích hoạt ngay sau khi giao dịch hoàn tất.</span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmSubscribe}
                disabled={processing}
                className="px-6 py-2.5 text-xs font-bold font-chivo uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors"
              >
                {processing ? 'Đang kết nối cổng...' : 'Xác Nhận Thanh Toán'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
