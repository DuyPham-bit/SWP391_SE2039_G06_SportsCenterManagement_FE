import { bookingApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { StatCard, Badge } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';

const { useState, useEffect } = React;

export function MemberDashboard() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      try {
        const myBookings = await bookingApi.getMemberBookings(currentUser.id);
        setBookings(myBookings.filter(b => b.status === 'CONFIRMED'));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu hội viên..." />;

  const isPackageActive = currentUser?.packageStatus === 'ACTIVE';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-4">
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
            alt=""
            className="w-16 h-16 rounded-full object-cover border-2 border-red-600 shadow"
          />
          <div>
            <span className="font-chivo text-xs uppercase tracking-widest text-red-500 font-bold">
              HỘI VIÊN SCMS OLYMPIC
            </span>
            <h1 className="font-chivo text-2xl font-black mt-0.5">
              Chào mừng, {currentUser?.fullName}!
            </h1>
            <p className="text-xs text-slate-300">
              Mã thẻ: <strong className="text-white font-mono">{currentUser?.memberCode || 'MEM-8899'}</strong> • SĐT: {currentUser?.phone || '0912 345 678'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <a
            href="#/member/schedule"
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-colors shadow-md flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">event_available</span>
            <span>Đặt Lớp Học</span>
          </a>
          <a
            href="#/member/ai-assistant"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-colors border border-slate-700 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            <span>Hỏi Đáp AI</span>
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Lớp Sắp Tới"
          value={bookings.length}
          subtitle="Ca học đã xác nhận"
          icon="calendar_month"
          color="red"
        />
        <StatCard
          title="Trạng Thái Thẻ"
          value={isPackageActive ? 'HỢP LỆ' : 'CẦN GIA HẠN'}
          subtitle={isPackageActive ? `Hạn dùng: ${currentUser?.packageExpiry}` : 'Vui lòng gia hạn'}
          icon="credit_card"
          color="slate"
        />
        <StatCard
          title="Tiến Độ Thể Lực"
          value="CHUẨN INBODY"
          subtitle="Cập nhật định kỳ bởi HLV"
          icon="monitoring"
          color="slate"
        />
      </div>

      {/* Middle Grid: Membership Status & Upcoming Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Active Membership Digital Card (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-chivo font-black text-sm">
                S
              </div>
              <span className="font-chivo text-xs font-bold tracking-widest uppercase">SCMS CARD</span>
            </div>
            <Badge variant={currentUser?.packageStatus || 'INACTIVE'} size="sm">
              {currentUser?.packageStatus || 'INACTIVE'}
            </Badge>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">Gói tập đăng ký</div>
            <h2 className="font-chivo text-xl font-black text-white mt-1">
              {currentUser?.packageName || 'Chưa đăng ký gói tập'}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Ngày hết hạn</span>
              <span className="font-bold text-white text-sm">
                {currentUser?.packageExpiry || 'Chưa kích hoạt'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Mã hội viên</span>
              <span className="font-mono font-bold text-red-400 text-sm">
                {currentUser?.memberCode || 'MEM-8899'}
              </span>
            </div>
          </div>

          <a
            href="#/member/packages"
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-colors text-center block"
          >
            Gia Hạn / Đổi Gói Tập Trực Tuyến
          </a>
        </div>

        {/* Upcoming Booked Classes (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-chivo text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">bookmark_check</span>
              Lịch Học Thể Thao Đã Đặt Chỗ
            </h2>
            <a href="#/member/bookings" className="text-xs font-bold text-red-600 hover:underline">
              Quản lý đặt chỗ
            </a>
          </div>

          {bookings.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
              <p className="text-xs font-medium mt-1">Bạn chưa đặt chỗ ca học nào sắp tới.</p>
              <a
                href="#/member/schedule"
                className="mt-3 inline-block px-4 py-2 rounded-lg bg-red-600 text-white font-chivo text-xs font-bold uppercase"
              >
                Khám phá & Đặt lớp ngay
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map(b => (
                <div key={b.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-chivo text-sm font-bold text-slate-900">{b.className}</h3>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-bold text-red-600">{b.bookingDate}</span>
                      <span>•</span>
                      <span>{b.timeSlot}</span>
                      <span>•</span>
                      <span>{b.roomName}</span>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">ĐÃ XÁC NHẬN</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
