import { coachApi } from '../../services/api.js';
import { db, DB_KEYS } from '../../services/dbStorage.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.js';

const { useState, useEffect } = React;

export function TrainingPlan() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [exercises, setExercises] = useState([
    { name: 'Khởi động xoay khớp & chạy nhẹ', sets: '2', reps: '5 phút', note: 'Làm nóng toàn thân' },
    { name: 'Bài tập chính chuyên sâu', sets: '4', reps: '10 - 12', note: 'RPE 8.0, nghỉ 60s' }
  ]);
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    const userList = db.get(DB_KEYS.USERS).filter(u => u.role === 'MEMBER');
    const planList = db.get(DB_KEYS.TRAINING_PLANS);
    setMembers(userList);
    setPlans(planList);
    if (userList.length > 0) setSelectedMemberId(userList[0].id);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddExercise = () => {
    setExercises([...exercises, { name: '', sets: '3', reps: '10', note: '' }]);
  };

  const handleRemoveExercise = (idx) => {
    setExercises(exercises.filter((_, i) => i !== idx));
  };

  const handleExerciseChange = (idx, field, val) => {
    const next = [...exercises];
    next[idx][field] = val;
    setExercises(next);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!title.trim() || !goal.trim()) {
      showError('Vui lòng nhập tên giáo án và mục tiêu!');
      return;
    }

    const member = members.find(m => m.id === selectedMemberId);

    setSaving(true);
    try {
      await coachApi.createTrainingPlan({
        memberId: selectedMemberId,
        memberName: member?.fullName || 'Hội viên',
        coachId: currentUser?.id,
        coachName: currentUser?.fullName || 'Huấn luyện viên',
        title: title.trim(),
        goal: goal.trim(),
        startDate,
        endDate: endDate || '2026-10-30',
        exercises
      });
      showSuccess(`Thiết lập giáo án cho ${member?.fullName} thành công!`);
      setModalOpen(false);
      loadData();
    } catch (err) {
      showError(err.message || 'Lỗi lưu giáo án');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Đang tải danh sách giáo án..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
            CREATE TRAINING PLAN
          </span>
          <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
            Thiết Lập Giáo Án Huấn Luyện Thể Lực
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Xây dựng phác đồ rèn luyện cá nhân hóa theo từng thể trạng và mục tiêu bứt phá của học viên.
          </p>
        </div>

        <button
          onClick={() => {
            setTitle('');
            setGoal('');
            setModalOpen(true);
          }}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add_task</span>
          <span>Soạn Giáo Án Mới</span>
        </button>
      </div>

      {/* Existing Plans Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-chivo text-[10px] font-black uppercase text-red-600 tracking-wider">
                  GIÁO ÁN ĐÃ DUYỆT BỞI HLV
                </span>
                <h3 className="font-chivo text-lg font-black text-slate-900 leading-tight mt-1">
                  {plan.title}
                </h3>
                <div className="text-xs text-slate-500 mt-1">
                  Học viên: <strong className="text-slate-900">{plan.memberName}</strong> • HLV: <strong>{plan.coachName}</strong>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold text-xs uppercase border border-emerald-200">
                ACTIVE
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-bold text-slate-700 block mb-0.5">Mục tiêu huấn luyện:</span>
              <p className="text-slate-600 italic">"{plan.goal}"</p>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Các bài tập trong giáo án ({plan.exercises?.length || 0}):
              </span>
              <div className="space-y-2">
                {plan.exercises?.map((ex, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-100 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{idx + 1}. {ex.name}</div>
                      <div className="text-[11px] text-slate-500">{ex.note}</div>
                    </div>
                    <div className="text-right font-chivo font-bold text-slate-800 text-[11px]">
                      {ex.sets} hiệp x {ex.reps}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Plan Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Soạn Thảo Giáo Án Cá Nhân Hóa"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Chọn học viên *
              </label>
              <select
                value={selectedMemberId}
                onChange={e => setSelectedMemberId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-medium"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.fullName} ({m.memberCode})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Tên giáo án *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Tối ưu sải bơi 50m & Tăng cơ"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Mục tiêu rèn luyện cụ thể *
            </label>
            <input
              type="text"
              required
              placeholder="VD: Cải thiện sức bền tim mạch, tăng 1kg cơ bắp trong 4 tuần"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Ngày kết thúc
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
            </div>
          </div>

          {/* Exercise items builder */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Danh sách bài tập chi tiết
              </label>
              <button
                type="button"
                onClick={handleAddExercise}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Thêm bài tập</span>
              </button>
            </div>

            {exercises.map((ex, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="Tên bài tập"
                    value={ex.name}
                    onChange={e => handleExerciseChange(idx, 'name', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Số hiệp"
                    value={ex.sets}
                    onChange={e => handleExerciseChange(idx, 'sets', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 bg-white text-center"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Lặp lại"
                    value={ex.reps}
                    onChange={e => handleExerciseChange(idx, 'reps', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 bg-white text-center"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Lưu ý kỹ thuật"
                    value={ex.note}
                    onChange={e => handleExerciseChange(idx, 'note', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 bg-white"
                  />
                </div>
                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(idx)}
                    className="text-slate-400 hover:text-red-600 p-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors"
            >
              {saving ? 'Đang lưu...' : 'Lưu & Giao Giáo Án'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
