import { reportApi, systemApi } from '../../services/api.js';
import { StatCard, Badge } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';

const { useState, useEffect } = React;

export function ManagerDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [overview, logs] = await Promise.all([
          reportApi.getOverview(),
          systemApi.getAuditLogs()
        ]);
        setMetrics(overview);
        setRecentLogs(logs.slice(0, 6));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu Quản lý..." />;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <span className="font-chivo text-xs uppercase tracking-widest text-red-500 font-bold">
            TRUNG TÂM ĐIỀU HÀNH SCMS
          </span>
          <h1 className="font-chivo text-2xl md:text-3xl font-black mt-1">
            Bảng Quản Lý Tổng Quan (Manager Dashboard)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi thời gian thực 9 cụm sân, 15 bộ môn và hiệu suất hoạt động toàn trung tâm thể thao.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <a
            href="#/manager/reports"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-colors shadow-md flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">analytics</span>
            <span>Báo Cáo</span>
          </a>
          <a
            href="#/manager/staff"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-colors border border-slate-700 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Thêm Nhân Viên</span>
          </a>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng Hội Viên"
          value={metrics?.totalMembers || 0}
          subtitle={`Đang kích hoạt: ${metrics?.activeMembers}`}
          icon="group"
          trend="+12% tháng này"
          color="red"
        />
        <StatCard
          title="Doanh Thu Tháng"
          value={`${(metrics?.monthlyRevenue || 0).toLocaleString()}đ`}
          subtitle="Doanh số gói tập"
          icon="payments"
          trend={metrics?.revenueGrowth}
          color="slate"
        />
        <StatCard
          title="Tỷ Lệ Lấp Đầy Sân"
          value={`${metrics?.occupancyRate || 0}%`}
          subtitle={`Đang mở: ${metrics?.totalClasses} lớp học`}
          icon="pie_chart"
          trend="Chuẩn Olympic"
          color="slate"
        />
        <StatCard
          title="Check-in Hôm Nay"
          value={metrics?.todayCheckins || 0}
          subtitle="Lượt quét thẻ vào sân"
          icon="fact_check"
          trend="Trực tiếp"
          color="red"
        />
      </div>

      {/* Middle Section: Quick Management Grid & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Management Shortcuts */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-chivo text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600">tune</span>
            Nghiệp Vụ Quản Trị Trọng Yếu
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <a
              href="#/manager/staff"
              className="p-4 rounded-xl border border-slate-200 hover:border-red-500 hover:bg-red-50/20 transition-all flex items-start gap-3 group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[22px]">badge</span>
              </div>
              <div>
                <span className="font-chivo text-xs font-bold text-slate-900 block group-hover:text-red-600">
                  Quản lý Nhân sự
                </span>
                <span className="text-[11px] text-slate-500">
                  Phê duyệt HLV, lễ tân, kỹ thuật viên sân bãi.
                </span>
              </div>
            </a>

            <a
              href="#/manager/packages"
              className="p-4 rounded-xl border border-slate-200 hover:border-red-500 hover:bg-red-50/20 transition-all flex items-start gap-3 group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[22px]">card_membership</span>
              </div>
              <div>
                <span className="font-chivo text-xs font-bold text-slate-900 block group-hover:text-red-600">
                  Gói tập Hội viên
                </span>
                <span className="text-[11px] text-slate-500">
                  Cấu hình giá cước, thời hạn và số môn cho phép.
                </span>
              </div>
            </a>

            <a
              href="#/manager/classes-rooms"
              className="p-4 rounded-xl border border-slate-200 hover:border-red-500 hover:bg-red-50/20 transition-all flex items-start gap-3 group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[22px]">sports_score</span>
              </div>
              <div>
                <span className="font-chivo text-xs font-bold text-slate-900 block group-hover:text-red-600">
                  Lớp học & Sân bãi
                </span>
                <span className="text-[11px] text-slate-500">
                  9 cụm sân Olympic, sức chứa và kiểm tra xung đột phòng.
                </span>
              </div>
            </a>

            <a
              href="#/manager/coach-assignment"
              className="p-4 rounded-xl border border-slate-200 hover:border-red-500 hover:bg-red-50/20 transition-all flex items-start gap-3 group"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[22px]">assignment_ind</span>
              </div>
              <div>
                <span className="font-chivo text-xs font-bold text-slate-900 block group-hover:text-red-600">
                  Phân công HLV
                </span>
                <span className="text-[11px] text-slate-500">
                  Gán HLV theo chuyên môn môn học, tránh trùng lịch.
                </span>
              </div>
            </a>
          </div>

          {/* Package Distribution Bar */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span>Tỷ lệ phân bổ Gói tập hội viên</span>
              <span className="text-red-600">100% Olympic</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex">
              <div style={{ width: '35%' }} className="bg-red-600" title="All-Access 35%" />
              <div style={{ width: '40%' }} className="bg-slate-900" title="Pro 40%" />
              <div style={{ width: '15%' }} className="bg-amber-500" title="Elite 15%" />
              <div style={{ width: '10%' }} className="bg-slate-400" title="Basic 10%" />
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-[10px] text-slate-500 font-medium">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-600" /> All-Access Olympic (35%)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-900" /> Pro Bứt Phá (40%)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> Elite (15%)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-400" /> Basic (10%)</span>
            </div>
          </div>
        </div>

        {/* Live Audit Log Feed */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-chivo text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 text-[18px]">history</span>
                Audit Logs Gần Đây
              </h2>
              <a href="#/manager/audit-logs" className="text-[11px] text-red-600 font-bold hover:underline">
                Xem tất cả
              </a>
            </div>

            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                    <span>{log.userName} ({log.role})</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <p className="font-semibold text-slate-800 text-[11px] leading-tight">
                    {log.details}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <a
            href="#/manager/audit-logs"
            className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg text-center transition-colors block"
          >
            Mở Toàn Bộ Nhật Ký Hệ Thống
          </a>
        </div>
      </div>
    </div>
  );
}
