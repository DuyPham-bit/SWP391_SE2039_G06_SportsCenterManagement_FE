import { classApi, coachApi } from '../../services/api.js';
import { Table, LoadingSpinner } from '../../components/common/Table.js';
import { Badge } from '../../components/common/StatCard.js';

const { useState, useEffect } = React;

export function ClassMembers() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClasses() {
      try {
        const classList = await classApi.getAll();
        setClasses(classList);
        if (classList.length > 0) {
          setSelectedClassId(classList[0].id);
        }
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
      } catch (e) {
        console.error(e);
      }
    }
    loadMembers();
  }, [selectedClassId]);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const columns = [
    {
      header: 'Học Viên',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt=""
            className="w-9 h-9 rounded-full object-cover border border-slate-200"
          />
          <div>
            <div className="font-bold text-slate-900">{row.memberName}</div>
            <div className="text-xs text-slate-500">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Mã Thẻ',
      render: (row) => <span className="font-chivo font-bold text-red-600">{row.memberCode}</span>
    },
    {
      header: 'Số Điện Thoại',
      accessor: 'phone'
    },
    {
      header: 'Trạng Thái Booking',
      render: () => <Badge variant="success">CONFIRMED</Badge>
    },
    {
      header: 'Thao Tác Chuyên Môn',
      render: (row) => (
        <div className="flex items-center gap-2">
          <a
            href="#/coach/training-plan"
            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold font-chivo uppercase tracking-wider transition-colors"
          >
            Tạo Giáo Án
          </a>
          <a
            href="#/coach/progress"
            className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold font-chivo uppercase tracking-wider transition-colors"
          >
            Ghi Chỉ Số
          </a>
        </div>
      )
    }
  ];

  if (loading) return <LoadingSpinner text="Đang tải danh sách học viên..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
          MANAGE CLASS MEMBERS
        </span>
        <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
          Danh Sách Học Viên Theo Lớp Học
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Theo dõi hồ sơ, số điện thoại liên lạc và tình trạng đăng ký của học viên trong từng ca dạy.
        </p>
      </div>

      {/* Class Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
            Chọn lớp học:
          </span>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-semibold text-slate-900"
          >
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.sportName} • {cls.timeSlot} • {cls.dayOfWeek})
              </option>
            ))}
          </select>
        </div>

        {selectedClass && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">Địa điểm: <strong className="text-slate-900">{selectedClass.roomName}</strong></span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Sĩ số: <strong className="text-red-600 font-bold">{members.length} / {selectedClass.capacity}</strong></span>
          </div>
        )}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={members}
        searchKey="memberName"
        searchPlaceholder="Tìm theo tên học viên..."
        emptyMessage="Chưa có học viên nào đặt chỗ cho lớp này"
      />
    </div>
  );
}
