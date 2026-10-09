import { reportApi } from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { useToast } from '../../context/ToastContext.js';

const { useState, useEffect } = React;

export function ReportsAnalytics() {
  const { showError } = useToast();
  const [metrics, setMetrics] = useState(null);
  const [period, setPeriod] = useState('MONTH');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const data = await reportApi.getOverview(period);
        setMetrics(data);
      } catch (e) {
        showError(e.message || 'Không thể tải báo cáo từ backend.');
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, [period]);

  const handleExport = () => {
    showError('Backend hiện chưa có API xuất báo cáo.');
  };

  if (loading) return <LoadingSpinner text="Đang trích xuất báo cáo phân tích..." />;

  const revenuePeriods = metrics?.revenuePeriods || [];
  const maxRevenue = Math.max(1, ...revenuePeriods.map(item => Number(item.net || 0)));
  const utilizationBySport = metrics?.utilizationBySport || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
            VIEW REPORTS & ANALYTICS
          </span>
          <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
            Báo Cáo & Thống Kê Hoạt Động SCMS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu tổng hợp về doanh thu gói tập, tỷ lệ lấp đầy sân bãi và tăng trưởng hội viên.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg bg-white border border-slate-200 p-1 text-xs font-bold">
            <button
              onClick={() => setPeriod('MONTH')}
              className={`px-3 py-1 rounded font-chivo uppercase ${period === 'MONTH' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
            >
              Tháng Này
            </button>
            <button
              onClick={() => setPeriod('QUARTER')}
              className={`px-3 py-1 rounded font-chivo uppercase ${period === 'QUARTER' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
            >
              Quý này
            </button>
            <button
              onClick={() => setPeriod('YEAR')}
              className={`px-3 py-1 rounded font-chivo uppercase ${period === 'YEAR' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
            >
              Năm Này
            </button>
          </div>

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-chivo uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Xuất Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Doanh Thu Gói Tập"
          value={`${Number(metrics?.monthlyRevenue || 0).toLocaleString()}đ`}
          subtitle="Doanh thu thuần theo kỳ đã chọn"
          icon="attach_money"
          trend={metrics?.revenueGrowth || '—'}
          color="red"
        />
        <StatCard
          title="Hội Viên Đang Hoạt Động"
          value={metrics?.activeMembers || 0}
          subtitle={`Tổng số hội viên: ${metrics?.totalMembers}`}
          icon="group"
          trend=""
          color="slate"
        />
        <StatCard
          title="Lượt Đặt Sân / Lớp"
          value={metrics?.totalBookings || 0}
          subtitle="Theo thống kê lớp của backend"
          icon="event_seat"
          trend=""
          color="slate"
        />
        <StatCard
          title="Lượt Check-in Vào Cổng"
          value={metrics?.todayCheckins ?? '—'}
          subtitle="Backend chưa có API check-in"
          icon="fingerprint"
          trend=""
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-chivo text-sm font-black text-slate-900 uppercase tracking-wide">Doanh Thu Theo Ngày</h2>
            <span className="text-xs font-bold text-red-600">{Number(metrics?.monthlyRevenue || 0).toLocaleString()}đ</span>
          </div>
          <div className="space-y-3 pt-2">
            {revenuePeriods.length === 0 ? <p className="text-xs text-slate-500">Backend chưa có dữ liệu trong kỳ này.</p> : revenuePeriods.map(item => (
              <div key={item.periodStart}>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>{item.periodStart}</span>
                  <span>{Number(item.net || 0).toLocaleString()}đ</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-red-600 rounded-full" style={{ width: `${Math.max(0, Math.min(100, Number(item.net || 0) / maxRevenue * 100))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-chivo text-sm font-black text-slate-900 uppercase tracking-wide">Tỷ Lệ Đặt Chỗ Theo Môn</h2>
            <span className="text-xs font-bold text-emerald-600">TB: {metrics?.occupancyRate ?? 0}%</span>
          </div>
          <div className="space-y-3 pt-2">
            {utilizationBySport.length === 0 ? <p className="text-xs text-slate-500">Chưa có ca học được lên lịch trong kỳ này.</p> : utilizationBySport.map(item => (
              <div key={item.name}>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>{item.name}</span>
                  <span>{item.booked}/{item.capacity} chỗ ({item.percentage}%)</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-slate-900 rounded-full" style={{ width: `${Math.max(0, Math.min(100, item.percentage))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
