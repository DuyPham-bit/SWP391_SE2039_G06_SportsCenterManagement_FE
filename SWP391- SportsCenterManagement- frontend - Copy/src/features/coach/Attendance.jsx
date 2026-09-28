import { classApi, coachApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../../components/common/Table.js';

const { useState, useEffect } = React;

export function Attendance() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [members, setMembers] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [notesMap, setNotesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadClasses() {
      try {
        const all = await classApi.getAll();
        setClasses(all);
        if (all.length > 0) setSelectedClassId(all[0].id);
      } finally {
        setLoading(false);
      }
    }
    loadClasses();
  }, []);

  useEffect(() => {
    async function loadMembers() {
      if (!selectedClassId) return;
      try {
        const list = await coachApi.getClassMembers(selectedClassId);
        setMembers(list);

        // Default all to PRESENT
        const initialMap = {};
        const initialNotes = {};
        list.forEach(m => {
          initialMap[m.memberId] = 'PRESENT';
          initialNotes[m.memberId] = '';
        });
        setAttendanceMap(initialMap);
        setNotesMap(initialNotes);
      } catch (e) {
        console.error(e);
      }
    }
    loadMembers();
  }, [selectedClassId]);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const toggleStatus = (memberId, status) => {
    setAttendanceMap(prev => ({ ...prev, [memberId]: status }));
  };

  const handleNoteChange = (memberId, val) => {
    setNotesMap(prev => ({ ...prev, [memberId]: val }));
  };

  const handleSubmitAttendance = async () => {
    if (members.length === 0) {
      showError('Lớp học này hiện chưa có học viên đăng ký!');
      return;
    }

    const records = members.map(m => ({
      memberId: m.memberId,
      memberName: m.memberName,
      status: attendanceMap[m.memberId] || 'PRESENT',
      note: notesMap[m.memberId] || ''
    }));

    setSubmitting(true);
    try {
      await coachApi.takeAttendance(
        selectedClassId,
        selectedClass?.name || 'Lớp học',
        currentUser?.id,
        currentUser?.fullName || 'HLV',
        records
      );
      showSuccess(`Đã lưu kết quả điểm danh cho lớp ${selectedClass?.name} (${records.length} học viên)!`);
    } catch (err) {
      showError('Lỗi lưu điểm danh');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Đang tải danh sách điểm danh..." />;

  const presentCount = Object.values(attendanceMap).filter(s => s === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter(s => s === 'ABSENT').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
          TAKE CLASS ATTENDANCE
        </span>
        <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
          Điểm Danh Lớp Học Thể Thao
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Ghi nhận có mặt hoặc vắng mặt của học viên trong ca dạy, theo dõi tỷ lệ tham gia rèn luyện.
        </p>
      </div>

      {/* Class Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
            Chọn ca dạy:
          </span>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-semibold text-slate-900"
          >
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.timeSlot} • {cls.roomName})
              </option>
            ))}
          </select>
        </div>

        {/* Quick Tally Chips */}
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold font-chivo">
            Có mặt: {presentCount}
          </span>
          <span className="px-3 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-bold font-chivo">
            Vắng: {absentCount}
          </span>
        </div>
      </div>

      {/* Attendance Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {members.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl text-slate-300">group_off</span>
            <p className="text-xs font-medium mt-2">Chưa có học viên nào đăng ký lớp học này</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((m, idx) => {
              const currentStatus = attendanceMap[m.memberId] || 'PRESENT';
              return (
                <div key={m.memberId || idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <img
                      src={m.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-900">{m.memberName}</div>
                      <div className="text-xs text-red-600 font-semibold">{m.memberCode} • SĐT: {m.phone}</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <input
                      type="text"
                      placeholder="Ghi chú (đến muộn, xin về sớm...)"
                      value={notesMap[m.memberId] || ''}
                      onChange={e => handleNoteChange(m.memberId, e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 w-full sm:w-48 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
                    />

                    {/* Status Toggle Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleStatus(m.memberId, 'PRESENT')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-chivo font-bold uppercase transition-all flex items-center gap-1 ${currentStatus === 'PRESENT'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        <span>Có mặt</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleStatus(m.memberId, 'ABSENT')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-chivo font-bold uppercase transition-all flex items-center gap-1 ${currentStatus === 'ABSENT'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                        <span>Vắng mặt</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer with Submit Button */}
        {members.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Tổng số học viên cần điểm danh: <strong>{members.length}</strong>
            </span>
            <button
              onClick={handleSubmitAttendance}
              disabled={submitting}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>{submitting ? 'Đang lưu...' : 'Lưu Kết Quả Điểm Danh'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
