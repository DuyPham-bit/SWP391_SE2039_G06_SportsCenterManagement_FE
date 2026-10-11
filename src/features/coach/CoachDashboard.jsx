import { classApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { StatCard, Badge } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';

const { useState, useEffect } = React;

export function CoachDashboard() {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const all = await classApi.getAll();
        // Filter classes for current coach or show relevant
        const myClasses = all.filter(c => c.coachId === currentUser?.id || c.coachName?.includes(currentUser?.fullName?.split(' ')[0]));
        setClasses(myClasses.length > 0 ? myClasses : all.slice(0, 3));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu Huấn luyện viên..." />;

  const totalStudents = classes.reduce((sum, c) => sum + c.enrolledCount, 0);

  return (
    <div className="space-y-6">
      {/* Coach Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-4">
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'}
            alt=""
            className="w-16 h-16 rounded-full object-cover border-2 border-red-600 shadow"
          />
          <div>
            <span className="font-chivo text-xs uppercase tracking-widest text-red-500 font-bold">
              BẢNG CHUYÊN MÔN HUẤN LUYỆN VIÊN
            </span>
            <h1 className="font-chivo text-2xl font-black mt-0.5">
              Chào HLV {currentUser?.fullName}
            </h1>
            <p className="text-xs text-slate-300">
              {currentUser?.specialty || 'Bơi lội & Thể lực Olympic'} • {currentUser?.certification || 'AFC & NASM Certified'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <a
            href="#/coach/attendance"
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-colors shadow-md flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">fact_check</span>
            <span>Điểm Danh</span>
          </a>
          <a
            href="#/coach/ai-recommendation"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-colors border border-slate-700 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">psychology</span>
            <span>Gợi Ý AI</span>
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Lớp Đang Phụ Trách"
          value={classes.length}
          subtitle="Ca dạy trong tuần"
          icon="sports_score"
          color="red"
        />
        <StatCard
          title="Tổng Số Học Viên"
          value={totalStudents}
          subtitle="Đang rèn luyện theo giáo án"
          icon="group"
          color="slate"
        />
        <StatCard
          title="Chứng Chỉ Huấn Luyện"
          value="CHUẨN QUỐC TẾ"
          subtitle="AFC / NASM / BWF"
          icon="verified"
          color="slate"
        />
      </div>

      {/* Assigned Classes Quick Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="font-chivo text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600">calendar_month</span>
            Lịch Dạy & Các Lớp Đang Đảm Nhiệm
          </h2>
          <a href="#/coach/schedule" className="text-xs font-bold text-red-600 hover:underline">
            Xem toàn bộ lịch dạy
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classes.map(cls => (
            <div key={cls.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="primary" size="sm">{cls.sportName}</Badge>
                  <span className="text-xs text-slate-500 font-bold">{cls.dayOfWeek}</span>
                </div>
                <h3 className="font-chivo text-sm font-bold text-slate-900 leading-tight">
                  {cls.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                  <span>{cls.timeSlot}</span>
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">stadium</span>
                  <span>{cls.roomName}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Sĩ số: <strong className="text-slate-900">{cls.enrolledCount}/{cls.capacity}</strong>
                </span>
                <a
                  href="#/coach/attendance"
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-chivo text-[11px] font-bold uppercase transition-colors"
                >
                  Điểm danh
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
