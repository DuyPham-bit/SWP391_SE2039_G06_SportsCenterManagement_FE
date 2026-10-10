import React from 'react';
import { reportApi } from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.jsx';
import { LoadingSpinner } from '../../components/common/Table.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { downloadCsv } from '../../services/csvExport.js';
import { toLocalDateInput } from '../../services/dateUtils.js';

const { useState, useEffect } = React;

export function ReportsAnalytics() {
  const { showSuccess } = useToast();
  const [metrics, setMetrics] = useState(null);
  const [period, setPeriod] = useState('MONTH');
  const [loading, setLoading] = useState(true);
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      setMetrics(null);
      setReportError('');
      try {
        const data = await reportApi.getOverview(period);
        setMetrics(data);
      } catch (e) {
        setReportError(e.message || 'Không tải được báo cáo.');
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, [period]);

  const handleExport = () => {
    if (!metrics) return;
    downloadCsv(`scms-report-${toLocalDateInput()}.csv`, [
      ['Chỉ số', 'Giá trị'],
      ['Tổng hội viên', metrics.totalMembers],
      ['Hội viên hoạt động', metrics.activeMembers],
      ['Huấn luyện viên', metrics.totalCoaches],
      ['Lớp học', metrics.totalClasses],
      ['Ghi danh lớp', metrics.totalBookings],
      ['Lượt check-in', metrics.todayCheckins],
      ['Tỷ lệ lấp đầy (%)', metrics.occupancyRate],
      ['Doanh thu tháng (VND)', metrics.monthlyRevenue]
    ]);
    showSuccess('Đã xuất dữ liệu đang hiển thị ra file CSV.');
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
              Quý Này
            </button>
            <button
              onClick={() => setPeriod('YEAR')}
              className={`px-3 py-1 rounded font-chivo uppercase ${period === 'YEAR' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
            >
              Năm Nay
            </button>
          </div>

          <button
            onClick={handleExport}
            disabled={!metrics}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-chivo uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Xuất Báo Cáo</span>
          </button>
        </div>
      </div>

      {reportError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{reportError}</p>}
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Doanh Thu Gói Tập"
          value={metrics ? `${metrics.monthlyRevenue.toLocaleString()}đ` : "—"}
          subtitle="Doanh thu ròng trong kỳ"
          icon="attach_money"
          
          color="red"
        />
        <StatCard
          title="Hội Viên Đang Hoạt Động"
          value={metrics?.activeMembers ?? "—"}
          subtitle={`Tổng số hội viên: ${metrics?.totalMembers}`}
          icon="group"
          
          color="slate"
        />
        <StatCard
          title="Ghi Danh Lớp"
          value={metrics?.totalBookings ?? "—"}
          subtitle="Tổng số ghi danh theo báo cáo máy chủ"
          icon="event_seat"
          trend="Chuẩn Olympic"
          color="slate"
        />
        <StatCard
          title="Lượt Check-in Vào Cổng"
          value="Chưa có API"
          subtitle="Ghi nhận qua cổng quét thẻ"
          icon="fingerprint"
          trend="24/7"
          color="red"
        />
      </div>

      {/* Visual Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <h2 className="font-bold">Doanh thu theo kỳ</h2>
          {(metrics?.revenue?.periods || []).map(p => <div key={p.periodStart} className="flex justify-between text-sm"><span>{p.periodStart}</span><strong>{p.net.toLocaleString()}đ</strong></div>)}
          {!metrics?.revenue?.periods?.length && <p>Không có doanh thu trong kỳ.</p>}
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <h2 className="font-bold">Trạng thái ghi danh lớp</h2>
          {Object.entries(metrics?.classes?.currentStatusCounts || {}).map(([status, count]) => <div key={status} className="flex justify-between text-sm"><span>{status}</span><strong>{count}</strong></div>)}
          <p className="text-xs text-slate-500">Phân bố doanh thu từng gói, công suất sân và check-in chưa có API tổng hợp.</p>
        </div>
      </div>
    </div>
  );
}
