import React, { useState, useEffect } from 'react';
import { coachApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Badge } from '../../components/common/StatCard.js';

export function AIRecommendation() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [coachClasses, setCoachClasses] = useState([]);
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [selectedMemberCompositeKey, setSelectedMemberCompositeKey] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('Tăng cơ & Bền tim mạch');
  const [currentLevel, setCurrentLevel] = useState('Trung cấp (Tập đều 6 - 12 tháng)');
  const [notes, setNotes] = useState('Khớp gối từng mỏi nhẹ khi vận động nặng');

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const isManager = currentUser?.role === 'MANAGER';
        const classesData = await coachApi.getCoachClassesAndMembers(
          currentUser?.id,
          currentUser?.fullName,
          isManager
        );
        setCoachClasses(classesData);

        // Set initial member selection
        for (const cls of classesData) {
          if (cls.members && cls.members.length > 0) {
            setSelectedMemberCompositeKey(`${cls.members[0].id}_${cls.id}`);
            updateDefaultGoalForSport(cls.sportName);
            break;
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser?.id]);

  // Distinct sports taught by this coach
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

  const currentPair = classMemberPairs.find(p => p.compositeKey === selectedMemberCompositeKey)
    || classMemberPairs[0]
    || null;

  const updateDefaultGoalForSport = (sport) => {
    if (!sport) return;
    if (sport.includes('Bơi')) {
      setFitnessGoal('Tăng dung tích phổi, tối ưu hóa nhịp thở và sức bền sải tay');
    } else if (sport.includes('Gym') || sport.includes('Fitness')) {
      setFitnessGoal('Tăng khối lượng cơ nạc (Hypertrophy), giảm mỡ InBody và tăng sức mạnh cốt lõi');
    } else if (sport.includes('Cầu lông') || sport.includes('Tennis')) {
      setFitnessGoal('Tăng tốc độ bứt tốc, sức bền phản xạ mắt - tay và độ linh hoạt cổ chân');
    } else if (sport.includes('Võ thuật') || sport.includes('Boxing')) {
      setFitnessGoal('Tăng lực phát quyền bộc phát, phản xạ tự vệ và thể lực đối kháng');
    } else {
      setFitnessGoal('Tăng cường thể lực toàn diện và sự dẻo dai cơ xương khớp');
    }
  };

  const handleSelectMember = (compositeKey) => {
    setSelectedMemberCompositeKey(compositeKey);
    const pair = classMemberPairs.find(p => p.compositeKey === compositeKey);
    if (pair) {
      updateDefaultGoalForSport(pair.sportName);
    }
  };

  const handleGenerateAI = async (e) => {
    e.preventDefault();
    if (!currentPair) {
      showError('Vui lòng chọn học viên từ lớp học!');
      return;
    }

    setGenerating(true);
    try {
      const result = await coachApi.getAIRecommendation({
        memberName: currentPair.fullName,
        fitnessGoal,
        currentLevel,
        notes,
        sportName: currentPair.sportName,
        className: currentPair.className
      });
      setAiResult(result);
      showSuccess(`AI đã phân tích và thiết lập giáo án thể lực cho ${currentPair.fullName} môn ${currentPair.sportName}!`);
    } catch (err) {
      showError(err.message || 'Lỗi kết nối dịch vụ AI');
    } finally {
      setGenerating(false);
    }
  };

  const handleApplyToPlan = () => {
    showSuccess('Đã chuyển đổi giáo án AI thành bản nháp chính thức! HLV có thể tùy chỉnh trước khi giao học viên.');
    window.location.hash = '#/coach/training-plan';
  };

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu học viên theo từng môn và từng lớp..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
          GET AI WORKOUT RECOMMENDATION • ORGANIZED BY SPORT & CLASS
        </span>
        <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
          Trợ Lý AI Đề Xuất Giáo Án Thể Lực
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Sử dụng trí tuệ nhân tạo để tính toán khối lượng vận động, vùng nhịp tim và chu kỳ bài tập cho học viên trong các lớp bạn phụ trách.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Parameters (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-chivo text-xs font-bold uppercase text-slate-900">
            <span className="material-symbols-outlined text-red-600">tune</span>
            <span>Chọn Học Viên Theo Môn & Lớp Phụ Trách</span>
          </div>

          <form onSubmit={handleGenerateAI} className="space-y-4">
            {/* Step 1: Filter by Sport Chips */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                <span>1. Lọc theo môn thể thao:</span>
                <span className="text-red-600 font-bold">{distinctSports.length} môn</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => { setSelectedSport('ALL'); setSelectedClassId('ALL'); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-chivo uppercase tracking-wider transition-all ${
                    selectedSport === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả môn
                </button>
                {distinctSports.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setSelectedSport(s); setSelectedClassId('ALL'); }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-chivo uppercase tracking-wider transition-all ${
                      selectedSport === s
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Filter by Class */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                2. Chọn lớp học ({activeClassList.length} lớp):
              </label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-semibold text-slate-900"
              >
                <option value="ALL">-- Tất cả các lớp --</option>
                {filteredClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    [{cls.sportName}] {cls.name} ({cls.members?.length || 0} HV)
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Member Selector (Grouped by Class & Sport) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                3. Chọn học viên nhận giáo án AI *
              </label>
              <select
                value={currentPair?.compositeKey || ''}
                onChange={e => handleSelectMember(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-bold text-slate-900 shadow-sm"
              >
                {activeClassList.map(cls => {
                  const membersInThisClass = cls.members || [];
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
                            {m.fullName} - Mã thẻ: {m.memberCode}
                          </option>
                        ))
                      )}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            {/* Selected Student Highlight Card */}
            {currentPair && (
              <div className="p-3 bg-red-50/50 rounded-xl border border-red-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{currentPair.fullName}</span>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded text-red-600 font-bold border border-red-200">
                    {currentPair.memberCode}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px] flex items-center gap-1">
                  <span>Môn & Lớp:</span>
                  <strong className="text-red-700 font-bold">{currentPair.sportName}</strong>
                  <span>• {currentPair.className}</span>
                </div>
                <div className="text-slate-400 text-[10px]">
                  Thời gian: {currentPair.timeSlot} ({currentPair.dayOfWeek}) - {currentPair.roomName}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Mục tiêu rèn luyện thể lực *
              </label>
              <input
                type="text"
                required
                value={fitnessGoal}
                onChange={e => setFitnessGoal(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Trình độ thể lực hiện tại *
              </label>
              <select
                value={currentLevel}
                onChange={e => setCurrentLevel(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-medium"
              >
                <option value="Căn bản (Mới tập dưới 3 tháng)">Căn bản (Mới tập dưới 3 tháng)</option>
                <option value="Trung cấp (Tập đều 6 - 12 tháng)">Trung cấp (Tập đều 6 - 12 tháng)</option>
                <option value="Nâng cao (Vận động viên phong trào)">Nâng cao (Vận động viên phong trào)</option>
                <option value="Chuyên sâu Olympic">Chuyên sâu Olympic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Lưu ý tiền sử / Chấn thương
              </label>
              <textarea
                rows="2"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="VD: Cổ chân từng bong gân nhẹ, hạn chế nhảy cao..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={generating || !currentPair}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-red-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">psychology</span>
              <span>{generating ? 'AI Đang Tính Toán...' : 'Khởi Chạy Trợ Lý AI Gợi Ý'}</span>
            </button>
          </form>
        </div>

        {/* Right Output: AI Recommendation Card (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-chivo text-xs font-black uppercase text-slate-900 tracking-wide flex items-center gap-1.5">
              <span className="material-symbols-outlined text-red-600">auto_awesome</span>
              <span>Kết Quả Đề Xuất Từ Trí Tuệ Nhân Tạo SCMS</span>
            </h2>
            {aiResult && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase border border-emerald-200">
                AI GENERATED
              </span>
            )}
          </div>

          {generating ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin mx-auto" />
              <p className="font-chivo text-xs font-bold uppercase tracking-wider text-slate-500">
                Đang xử lý dữ liệu sinh trắc học & vùng nhịp tim...
              </p>
            </div>
          ) : !aiResult ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <span className="material-symbols-outlined text-5xl text-slate-300">smart_toy</span>
              <p className="text-xs font-medium">
                Vui lòng chọn học viên theo môn/lớp và nhấn nút "Khởi Chạy Trợ Lý AI Gợi Ý"
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <h3 className="font-chivo text-base font-black text-white">{aiResult.title}</h3>
                <div className="text-xs text-slate-300">Áp dụng cho: <strong className="text-red-400">{aiResult.targetAudience}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Khối lượng rèn luyện</span>
                  <span className="font-semibold text-slate-900 mt-1 block">{aiResult.weeklyVolume}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Vùng nhịp tim mục tiêu</span>
                  <span className="font-semibold text-red-600 mt-1 block">{aiResult.heartRateZone}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
                <span className="font-bold text-amber-900 block mb-1">Gợi ý dinh dưỡng & Bổ sung khoáng:</span>
                <p className="text-amber-800 leading-relaxed">{aiResult.nutritionGuidance}</p>
              </div>

              {/* Exercises */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Chuỗi bài tập gợi ý:
                </span>
                <div className="space-y-2">
                  {aiResult.exercises.map((ex, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{idx + 1}. {ex.name}</div>
                        <div className="text-[11px] text-slate-500">{ex.note}</div>
                      </div>
                      <div className="font-chivo font-black text-slate-800 text-xs">
                        {ex.sets} x {ex.reps}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HLV Disclaimer & Action */}
              <div className="p-3 rounded-xl bg-slate-100 text-[11px] text-slate-600 italic">
                {aiResult.coachReviewNote}
              </div>

              <button
                onClick={handleApplyToPlan}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Thẩm Định & Chuyển Thành Giáo Án Chính Thức</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
