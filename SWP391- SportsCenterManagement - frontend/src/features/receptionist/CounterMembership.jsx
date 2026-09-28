import { receptionApi, packageApi } from '../../services/api.js';
import { db, DB_KEYS } from '../../services/dbStorage.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Badge } from '../../components/common/StatCard.js';

const { useState, useEffect } = React;

export function CounterMembership() {
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState(1); // 1: Member, 2: Package, 3: Payment, 4: Receipt
  const [members, setMembers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selections
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('TIỀN MẶT');
  const [processing, setProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    async function loadInitial() {
      try {
        const users = db.get(DB_KEYS.USERS).filter(u => u.role === 'MEMBER');
        const pkgs = await packageApi.getAll();
        setMembers(users);
        setPackages(pkgs);
        if (users.length > 0) setSelectedMember(users[0]);
        if (pkgs.length > 0) setSelectedPackage(pkgs[0]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  const handleProcessPayment = async () => {
    if (!selectedMember || !selectedPackage) return;
    setProcessing(true);
    try {
      const result = await receptionApi.registerCounterPackage({
        memberId: selectedMember.id,
        packageId: selectedPackage.id,
        paymentMethod
      });
      setReceiptData(result);
      showSuccess(`Kích hoạt gói tập thành công! Mã giao dịch: ${result.transactionRef}`);
      setStep(4);
    } catch (err) {
      showError(err.message || 'Lỗi thanh toán tại quầy!');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner text="Đang chuẩn bị màn hình thu ngân..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
          REGISTER / RENEW PACKAGE AT COUNTER
        </span>
        <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
          Đăng Ký & Gia Hạn Gói Tập Tại Quầy
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Quy trình 4 bước thu ngân: Chọn hội viên → Chọn gói tập → Thanh toán → Cấp TransactionRef.
        </p>
      </div>

      {/* Step Progress Tracker */}
      <div className="grid grid-cols-4 gap-2 bg-white p-3 rounded-2xl border border-slate-200">
        {[
          { num: 1, label: '1. Chọn Hội Viên' },
          { num: 2, label: '2. Chọn Gói Tập' },
          { num: 3, label: '3. Thanh Toán' },
          { num: 4, label: '4. Hóa Đơn & Kích Hoạt' }
        ].map(s => (
          <div
            key={s.num}
            className={`p-2.5 rounded-xl text-center text-xs font-chivo font-bold uppercase transition-all ${step === s.num
                ? 'bg-red-600 text-white shadow-sm'
                : step > s.num
                  ? 'bg-slate-100 text-slate-800'
                  : 'text-slate-400'
              }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* STEP 1: SELECT MEMBER */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-chivo text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black">1</span>
            Chọn Hội Viên Cần Đăng Ký / Gia Hạn
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map(m => (
              <div
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedMember?.id === m.id
                    ? 'bg-red-50 border-red-500 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={m.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-900 truncate">{m.fullName}</div>
                    <div className="text-xs text-red-600 font-semibold">{m.memberCode}</div>
                    <div className="text-[11px] text-slate-500 truncate">{m.phone}</div>
                  </div>
                  <Badge variant={m.packageStatus} size="sm">{m.packageStatus}</Badge>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                  <span>Gói hiện tại:</span>
                  <span className="font-semibold text-slate-800">{m.packageName || 'Chưa có'}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              disabled={!selectedMember}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-colors flex items-center gap-2"
            >
              <span>Tiếp Tục: Chọn Gói Tập</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT PACKAGE */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-chivo text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black">2</span>
              Lựa Chọn Gói Tập Cho {selectedMember?.fullName}
            </h2>
            <button onClick={() => setStep(1)} className="text-xs text-slate-500 hover:text-slate-800 underline">
              Đổi hội viên
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages.map(pkg => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${selectedPackage?.id === pkg.id
                    ? 'bg-red-50/50 border-red-600 shadow-md ring-2 ring-red-600/20'
                    : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div>
                  <div className="text-[10px] font-black uppercase text-red-600 mb-1">{pkg.badge || 'GÓI TẬP'}</div>
                  <h3 className="font-chivo text-base font-black text-slate-900 leading-tight">{pkg.name}</h3>
                  <div className="text-2xl font-black text-red-600 font-chivo mt-3">
                    {pkg.price.toLocaleString()}đ
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Thời hạn: {pkg.durationDays} ngày</div>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">{pkg.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Môn rèn luyện:</span>
                  <span className="text-slate-900">{pkg.allowedSports === 15 ? 'Toàn bộ 15 môn' : `${pkg.allowedSports} môn`}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Quay lại
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedPackage}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-colors flex items-center gap-2"
            >
              <span>Tiếp Tục: Thanh Toán</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PAYMENT CONFIRMATION */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-2xl mx-auto">
          <h2 className="font-chivo text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black">3</span>
            Xác Nhận & Thu Ngân Tại Bàn
          </h2>

          {/* Invoice Summary Box */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex justify-between text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-500">Hội viên đăng ký:</span>
              <span className="font-bold text-slate-900">{selectedMember?.fullName} ({selectedMember?.memberCode})</span>
            </div>
            <div className="flex justify-between text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-500">Gói tập lựa chọn:</span>
              <span className="font-bold text-slate-900">{selectedPackage?.name} ({selectedPackage?.durationDays} ngày)</span>
            </div>
            <div className="flex justify-between text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-500">Phí dịch vụ:</span>
              <span className="font-bold text-slate-900">{selectedPackage?.price.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between items-center pt-1 text-sm font-black text-slate-900">
              <span>TỔNG TIỀN PHẢI THU:</span>
              <span className="text-2xl font-chivo text-red-600">{selectedPackage?.price.toLocaleString()} VNĐ</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Hình thức thu tiền *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['TIỀN MẶT', 'CHUYỂN KHOẢN VIETQR', 'THẺ POS'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`p-3 rounded-xl border text-xs font-chivo font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 ${paymentMethod === m
                      ? 'bg-red-600 text-white border-red-600 shadow-md'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {m === 'TIỀN MẶT' ? 'payments' : m.includes('QR') ? 'qr_code_2' : 'credit_card'}
                  </span>
                  <span>{m}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Quay lại
            </button>
            <button
              onClick={handleProcessPayment}
              disabled={processing}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-black uppercase tracking-wider rounded-xl shadow-lg hover:shadow-red-600/30 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>{processing ? 'Đang kích hoạt...' : 'Xác Nhận Đã Thu & Kích Hoạt Thẻ'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: RECEIPT & TRANSACTION REF */}
      {step === 4 && receiptData && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6 max-w-xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[36px]">receipt_long</span>
          </div>

          <div>
            <span className="font-chivo text-xs font-black uppercase tracking-widest text-emerald-600">
              GIAO DỊCH THÀNH CÔNG
            </span>
            <h2 className="font-chivo text-2xl font-black text-slate-900 mt-1">
              Biên Lai Đăng Ký Thẻ Hội Viên SCMS
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Gói tập đã được gia hạn và kích hoạt có hiệu lực ngay lập tức.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200 font-semibold">
              <span className="text-slate-500">Mã Giao Dịch (TransactionRef):</span>
              <span className="font-chivo font-black text-red-600 text-sm">{receiptData.transactionRef}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Hội viên:</span>
              <span className="font-bold text-slate-900">{receiptData.member.fullName} ({receiptData.member.memberCode})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Gói tập kích hoạt:</span>
              <span className="font-bold text-slate-900">{receiptData.package.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Thời hạn sử dụng mới:</span>
              <span className="font-bold text-emerald-600">{receiptData.member.packageExpiry}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Phương thức:</span>
              <span className="font-bold text-slate-900">{receiptData.paymentMethod}</span>
            </div>
            <div className="flex justify-between py-1 text-sm font-black text-slate-900 pt-2">
              <span>Số tiền đã thanh toán:</span>
              <span className="text-red-600 font-chivo">{receiptData.amount.toLocaleString()} VNĐ</span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => { setStep(1); setReceiptData(null); }}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow transition-colors"
            >
              Thực Hiện Giao Dịch Mới
            </button>
            <a
              href="#/receptionist/check-in"
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow transition-colors"
            >
              Đi Đến Cổng Check-in
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
