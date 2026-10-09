import React from 'react';
import { classApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge } from '../../components/common/StatCard.jsx';
import { LoadingSpinner } from '../../components/common/Table.jsx';

const { useState, useEffect } = React;

export function TeachingSchedule() {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState([]);
  const [filterDay, setFilterDay] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const all = await classApi.getForCoach(currentUser?.id, { isManager: currentUser?.role === 'MANAGER' });
        setClasses(all);
      } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, [currentUser]);

  const filtered = filterDay === 'ALL'
    ? classes
    : classes.filter(c => c.dayOfWeek.includes(filterDay));

  if (loading) return <LoadingSpinner text="Đang tải lịch giảng dạy..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
          VIEW TEACHING SCHEDULE
        </span>
        <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
          Lịch Giảng Dạy Của Huấn Luyện Viên
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Theo dõi thời gian biểu, ca trực tiếp và địa điểm các cụm sân tiêu chuẩn Olympic.
        </p>
      </div>

      {/* Day Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Lọc ca dạy:</span>
        {['ALL', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map(d => (
          <button
            key={d}
            onClick={() => setFilterDay(d)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-all ${filterDay === d
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
          >
            {d === 'ALL' ? 'Tất cả' : d}
          </button>
        ))}
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(cls => (
          <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="primary" size="sm">{cls.sportName}</Badge>
                <span className="text-xs text-slate-500 font-bold">{cls.dayOfWeek}</span>
              </div>

              <h3 className="font-chivo text-base font-bold text-slate-900 leading-tight">
                {cls.name}
              </h3>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="material-symbols-outlined text-[18px] text-red-600">schedule</span>
                  <span className="font-bold">{cls.timeSlot}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">stadium</span>
                  <span>{cls.roomName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">group</span>
                  <span>Sĩ số: <strong>{cls.enrolledCount} / {cls.capacity} học viên</strong></span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <a
                href="#/coach/members"
                className="text-xs font-bold text-slate-700 hover:text-red-600 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>Học viên</span>
              </a>

              <a
                href="#/coach/attendance"
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">fact_check</span>
                <span>Điểm danh</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
