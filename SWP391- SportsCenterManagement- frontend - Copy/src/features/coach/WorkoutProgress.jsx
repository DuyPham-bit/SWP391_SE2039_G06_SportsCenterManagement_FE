import React, { useState, useEffect } from 'react';
import { coachApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.js';
import { Badge } from '../../components/common/StatCard.js';

export function WorkoutProgress() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [coachClasses, setCoachClasses] = useState([]);
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [selectedMemberCompositeKey, setSelectedMemberCompositeKey] = useState(''); // memberId_classId
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [weight, setWeight] = useState(68.5);
  const [bodyFat, setBodyFat] = useState(14.5);
  const [muscleMass, setMuscleMass] = useState(34.0);
  const [workoutResult, setWorkoutResult] = useState('');
  const [coachFeedback, setCoachFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const isManager = currentUser?.role === 'MANAGER';
      const classesData = await coachApi.getCoachClassesAndMembers(
        currentUser?.id,
        currentUser?.fullName,
        isManager
      );
      setCoachClasses(classesData);

      const allRecords = await coachApi.getAllProgress();
      setRecords(allRecords || []);

      // Select initial member if not set
      if (!selectedMemberCompositeKey) {
        for (const cls of classesData) {
          if (cls.members && cls.members.length > 0) {
            setSelectedMemberCompositeKey(`${cls.members[0].id}_${cls.id}`);
            break;
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

  // Extract distinct sports taught by this coach
  const distinctSports = Array.from(new Set(coachClasses.map(c => c.sportName).filter(Boolean)));

  // Filter classes according to selected sport
  const filteredClasses = selectedSport === 'ALL'
    ? coachClasses
    : coachClasses.filter(c => c.sportName === selectedSport);

  // Filter classes according to selected class ID
  const activeClassList = selectedClassId === 'ALL'
    ? filteredClasses
    : filteredClasses.filter(c => c.id === selectedClassId);

  // Flatten enrolled members across the active classes (organized by class & sport)
  const classMemberPairs = [];
  activeClassList.forEach(cls => {
    (cls.members || []).forEach(m => {
      classMemberPairs.push({
        ...m,
        classId: cls.id,
        className: cls.name,
        sportName: cls.sportName,
        timeSlot: cls.timeSlot,
        dayOfWeek: cls.dayOfWeek,
        roomName: cls.roomName,
        compositeKey: `${m.id}_${cls.id}`
      });
    });
  });

  // Find currently selected member pair
  const currentPair = classMemberPairs.find(p => p.compositeKey === selectedMemberCompositeKey)
    || classMemberPairs[0]
    || null;

  const selectedMemberId = currentPair ? currentPair.id : '';
  const memberRecords = records.filter(r => r.memberId === selectedMemberId);

  const handleSaveProgress = async (e) => {
    e.preventDefault();
    if (!currentPair) {
      showError('Vui lòng chọn học viên!');
      return;
    }
    if (!workoutResult.trim()) {
      showError('Vui lòng nhập kết quả bài tập thực tế!');
      return;
    }

    setSaving(true);
    try {
      await coachApi.recordWorkoutProgress({
        memberId: currentPair.id,
        memberName: currentPair.fullName,
        classId: currentPair.classId,
        className: currentPair.className,
        sportName: currentPair.sportName,
        weight: Number(weight),
        bodyFat: Number(bodyFat),
        muscleMass: Number(muscleMass),
        workoutResult: workoutResult.trim(),
        coachFeedback: coachFeedback.trim(),
        coachName: currentUser?.fullName || 'HLV Huấn luyện'
      });
      showSuccess(`Ghi nhận tiến độ cho ${currentPair.fullName} (${currentPair.className}) thành công!`);
      setModalOpen(false);
      setWorkoutResult('');
      setCoachFeedback('');
      loadData();
    } catch (err) {
      showError('Lỗi lưu tiến độ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Đang tải danh sách học viên theo lớp phụ trách..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
            RECORD WORKOUT PROGRESS • ASSIGNED CLASSES ONLY
          </span>
          <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
            Ghi Nhận Chỉ Số & Tiến Độ Tập Luyện
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý và ghi nhận chỉ số InBody cho học viên trong các lớp học bạn được phân công giảng dạy. Sắp xếp khoa học theo từng môn và từng lớp học.
          </p>
        </div>

        <button
          onClick={() => {
            if (!currentPair) {
              showError('Chưa có học viên nào được chọn!');
              return;
            }
            setModalOpen(true);
          }}
          disabled={!currentPair}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add_chart</span>
          <span>Ghi Chỉ Số Mới</span>
        </button>
      </div>

      {/* Sport & Class Organization Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Tier 1: Sport Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-red-600">sports</span>
            <span>Môn phụ trách:</span>
          </span>
          <button
            onClick={() => { setSelectedSport('ALL'); setSelectedClassId('ALL'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-all ${
              selectedSport === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả môn ({coachClasses.length} lớp)
          </button>
          {distinctSports.map(sport => {
            const count = coachClasses.filter(c => c.sportName === sport).length;
            return (
              <button
                key={sport}
                onClick={() => { setSelectedSport(sport); setSelectedClassId('ALL'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-all ${
                  selectedSport === sport
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sport} ({count})
              </button>
            );
          })}
        </div>

        {/* Tier 2: Class Selection & Member Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              1. Lọc theo lớp học ({activeClassList.length} lớp):
            </label>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-semibold text-slate-900"
            >
              <option value="ALL">-- Tất cả các lớp được phân công --</option>
              {filteredClasses.map(cls => (
                <option key={cls.id} value={cls.id}>
                  [{cls.sportName}] {cls.name} ({cls.members?.length || 0} học viên) - {cls.dayOfWeek}
                </option>
              ))}
            </select>
          </div>

          {/* Member Selector (Grouped by Class & Sport) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              2. Chọn học viên theo lớp ({classMemberPairs.length} học viên):
            </label>
            <select
              value={currentPair?.compositeKey || ''}
              onChange={e => setSelectedMemberCompositeKey(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-semibold text-slate-900"
            >
              {activeClassList.map(cls => {
                const membersInThisClass = (cls.members || []);
                return (
                  <optgroup
                    key={cls.id}
                    label={`[${cls.sportName}] ${cls.name} (${cls.timeSlot})`}
                  >
                    {membersInThisClass.length === 0 ? (
                      <option disabled value="">(Chưa có học viên nào đặt lớp này)</option>
                    ) : (
                      membersInThisClass.map(m => (
                        <option key={`${m.id}_${cls.id}`} value={`${m.id}_${cls.id}`}>
                          {m.fullName} - Mã: {m.memberCode}
                        </option>
                      ))
                    )}
                  </optgroup>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Selected Member Detail Banner */}
      {currentPair ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={currentPair.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
              alt={currentPair.fullName}
              className="w-14 h-14 rounded-full object-cover border-2 border-red-600 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-chivo text-lg font-bold text-slate-900">{currentPair.fullName}</h2>
                <Badge variant="primary" size="sm">{currentPair.memberCode}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  <span className="material-symbols-outlined text-[14px]">sports</span>
                  <span>{currentPair.sportName}</span>
                </span>
                <span className="font-medium">• Lớp: <strong>{currentPair.className}</strong></span>
                <span className="text-slate-400">({currentPair.timeSlot} | {currentPair.dayOfWeek})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Ghi Chỉ Số Cho Học Viên Này</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <span className="material-symbols-outlined text-4xl text-slate-400">group_off</span>
          <h3 className="font-chivo text-sm font-bold text-slate-800 mt-2">
            Không tìm thấy học viên trong các lớp được phân công
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Hệ thống chỉ hiển thị học viên đã đăng ký đặt chỗ vào các lớp mà bạn trực tiếp phụ trách.
          </p>
        </div>
      )}

      {/* Member Progress Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-chivo text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600">timeline</span>
            <span>Lịch Sử Chỉ Số Rèn Luyện ({memberRecords.length} lần ghi nhận)</span>
          </h3>
          {currentPair && (
            <span className="text-xs text-slate-500">
              Đang xem chỉ số của: <strong className="text-slate-900 font-bold">{currentPair.fullName}</strong>
            </span>
          )}
        </div>

        {memberRecords.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 max-w-xl mx-auto">
            <span className="material-symbols-outlined text-5xl text-slate-300">bar_chart</span>
            <h3 className="font-chivo text-base font-bold text-slate-900 mt-2">
              Chưa Có Lịch Sử Chỉ Số
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Hãy nhấn nút "Ghi Chỉ Số Mới" để cập nhật dữ liệu InBody và nhận xét đầu tiên cho học viên này.
            </p>
          </div>
        ) : (
          memberRecords.map(rec => (
            <div key={rec.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-chivo font-black text-xs">
                    IN
                  </div>
                  <div>
                    <h3 className="font-chivo text-sm font-bold text-slate-900">
                      Ghi nhận ngày {rec.date}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>HLV đánh giá: <strong>{rec.coachName}</strong></span>
                      {rec.className && <span>• Lớp: <strong>{rec.className}</strong></span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Cân nặng</span>
                    <span className="font-chivo text-base font-bold text-slate-900">{rec.weight} kg</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Tỷ lệ mỡ</span>
                    <span className="font-chivo text-base font-bold text-red-600">{rec.bodyFat}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Khối cơ</span>
                    <span className="font-chivo text-base font-bold text-emerald-600">{rec.muscleMass} kg</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-bold text-slate-700 block mb-1">Kết quả bài tập thực tế:</span>
                <p className="text-slate-700 leading-relaxed">{rec.workoutResult}</p>
              </div>

              {rec.coachFeedback && (
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
                  <span className="font-bold text-blue-900 block mb-1">Nhận xét & Dặn dò của HLV:</span>
                  <p className="text-blue-800 leading-relaxed italic">"{rec.coachFeedback}"</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Record Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Ghi Nhận Chỉ Số Thể Lực: ${currentPair?.fullName || ''}`}
      >
        {currentPair && (
          <form onSubmit={handleSaveProgress} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Học viên:</span>
                <strong className="font-bold text-slate-900 text-sm">{currentPair.fullName}</strong>
                <span className="text-slate-400 block text-[11px]">Mã thẻ: {currentPair.memberCode}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Bộ môn & Lớp:</span>
                <strong className="text-red-600 font-bold">{currentPair.sportName}</strong>
                <span className="text-slate-600 block text-[11px]">{currentPair.className}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Cân nặng (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tỷ lệ mỡ (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={bodyFat}
                  onChange={e => setBodyFat(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Khối lượng cơ (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={muscleMass}
                  onChange={e => setMuscleMass(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Kết quả bài rèn luyện thực tế *
              </label>
              <textarea
                rows="3"
                required
                placeholder="VD: Bơi 1000m trong 19p15s, Hoàn thành 4 hiệp Squat 65kg, Nhịp tim ổn định..."
                value={workoutResult}
                onChange={e => setWorkoutResult(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Lời khuyên & Đánh giá của Huấn luyện viên
              </label>
              <textarea
                rows="2"
                placeholder="Nhận xét về tư thế, nhịp thở hoặc dặn dò dinh dưỡng..."
                value={coachFeedback}
                onChange={e => setCoachFeedback(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
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
                {saving ? 'Đang lưu...' : 'Lưu Kết Quả'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
