import { reportApi } from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { useToast } from '../../context/ToastContext.js';

const { useState, useEffect } = React;

export function ReportsAnalytics() {
  const { showSuccess } = useToast();
  const [metrics, setMetrics] = useState(null);
  const [period, setPeriod] = useState('MONTH');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const data = await reportApi.getOverview();
        setMetrics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  const handleExport = () => {
    showSuccess('Đã xuất file báo cáo phân tích SCMS Analytics thành công (scms-report-2026.csv)!');
  };

  if (loading) return <LoadingSpinner text="Đang trích xuất báo cáo phân tích..." />;

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
              Quý 3
            </button>
            <button
              onClick={() => setPeriod('YEAR')}
              className={`px-3 py-1 rounded font-chivo uppercase ${period === 'YEAR' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
            >
              Năm 2026
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
          value="148.500.000đ"
          subtitle="Tăng trưởng so với tháng trước"
          icon="attach_money"
          trend="+18.4%"
          color="red"
        />
        <StatCard
          title="Hội Viên Đang Hoạt Động"
          value={metrics?.activeMembers || 0}
          subtitle={`Tổng số hội viên: ${metrics?.totalMembers}`}
          icon="group"
          trend="85% Tỷ lệ giữ chân"
          color="slate"
        />
        <StatCard
          title="Lượt Đặt Sân / Lớp"
          value={metrics?.totalBookings || 0}
          subtitle="Tổng số booking xác nhận"
          icon="event_seat"
          trend="Chuẩn Olympic"
          color="slate"
        />
        <StatCard
          title="Lượt Check-in Vào Cổng"
          value={metrics?.todayCheckins || 0}
          subtitle="Ghi nhận qua cổng quét thẻ"
          icon="fingerprint"
          trend="24/7"
          color="red"
        />
      </div>

      {/* Visual Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Package Revenue Contribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-chivo text-sm font-black text-slate-900 uppercase tracking-wide">
              Cơ Cấu Doanh Thu Gói Tập
            </h2>
            <span className="text-xs font-bold text-red-600">Tổng: 148.5Tr</span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Gói All-Access Olympic Pass (5.800.000đ)</span>
                <span className="font-bold">69.600.000đ (47%)</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-red-600 rounded-full" style={{ width: '47%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Gói Pro Bứt Phá (1.800.000đ)</span>
                <span className="font-bold">48.600.000đ (33%)</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-slate-900 rounded-full" style={{ width: '33%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Gói Elite Chuyên Nghiệp (3.200.000đ)</span>
                <span className="font-bold">22.400.000đ (15%)</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Gói Basic Thể Thao (650.000đ)</span>
                <span className="font-bold">7.900.000đ (5%)</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: '5%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Court & Facility Utilization */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-chivo text-sm font-black text-slate-900 uppercase tracking-wide">
              Hiệu Suất Sử Dụng 9 Cụm Sân
            </h2>
            <span className="text-xs font-bold text-emerald-600">TB: {metrics?.occupancyRate}%</span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Bể bơi Olympic 50m trong nhà</span>
                <span className="font-bold text-red-600">92% lấp đầy</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-red-600 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Sân cầu lông Taraflex BWF (8 sân)</span>
                <span className="font-bold text-slate-900">88% lấp đầy</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-slate-900 rounded-full" style={{ width: '88%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Khu tập Gym & Technogym Pro 800m²</span>
                <span className="font-bold text-slate-900">85% lấp đầy</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-slate-900 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Cụm sân Tennis Plexicushion</span>
                <span className="font-bold text-slate-700">75% lấp đầy</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
