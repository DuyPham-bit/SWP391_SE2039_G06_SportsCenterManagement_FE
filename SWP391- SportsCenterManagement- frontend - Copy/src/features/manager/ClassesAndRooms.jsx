import { SUPPORTED_SPORTS } from '../../services/sportsCatalog.js';
import React from 'react';
import { classApi, roomApi, staffApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Table, LoadingSpinner } from '../../components/common/Table.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Badge } from '../../components/common/StatCard.jsx';

const { useState, useEffect } = React;

export function ClassesAndRooms() {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('classes'); // 'classes' | 'rooms'

  const [classes, setClasses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Class Modal State
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [className, setClassName] = useState('');
  const [classSport, setClassSport] = useState('Bơi lội');
  const [classCoachId, setClassCoachId] = useState('');
  const [classRoomId, setClassRoomId] = useState('');
  const [classDay, setClassDay] = useState('Thứ 2, 4, 6');
  const [classSlot, setClassSlot] = useState('06:30 - 08:00');
  const [classCapacity, setClassCapacity] = useState(20);
  const [classLevel, setClassLevel] = useState('Căn bản');
  const [savingClass, setSavingClass] = useState(false);

  // Room Modal State
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState('Bể bơi');
  const [roomCapacity, setRoomCapacity] = useState(30);
  const [roomLocation, setRoomLocation] = useState('Khu A - Tầng 1');
  const [savingRoom, setSavingRoom] = useState(false);

  const loadData = React.useCallback(async () => {
    try {
      const [classList, roomList, staffList] = await Promise.all([
        classApi.getAll(),
        roomApi.getAll(),
        staffApi.getAll()
      ]);
      setClasses(classList);
      setRooms(roomList);
      setCoaches(staffList.filter(s => s.role === 'COACH'));
    } catch (e) {
      showError('Lỗi tải dữ liệu lớp học và phòng');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateClassModal = () => {
    setEditingClass(null);
    setClassName('');
    setClassSport('Bơi lội');
    setClassCoachId(coaches[0]?.id || '');
    setClassRoomId(rooms[0]?.id || '');
    setClassDay('Thứ 2, 4, 6');
    setClassSlot('06:30 - 08:00');
    setClassCapacity(20);
    setClassLevel('Căn bản');
    setClassModalOpen(true);
  };

  const handleSaveClass = async (e) => {
    e.preventDefault();
    if (!className.trim()) {
      showError('Vui lòng nhập tên lớp học!');
      return;
    }

    const selectedCoach = coaches.find(c => c.id === classCoachId);
    const selectedRoom = rooms.find(r => r.id === classRoomId);

    setSavingClass(true);
    try {
      if (editingClass) {
        await classApi.update(editingClass.id, {
          name: className.trim(),
          sportName: classSport,
          coachId: classCoachId,
          coachName: selectedCoach?.fullName || 'Chưa phân công',
          roomId: classRoomId,
          roomName: selectedRoom?.name || 'Chưa chọn phòng',
          dayOfWeek: classDay,
          timeSlot: classSlot,
          capacity: Number(classCapacity),
          level: classLevel
        });
        showSuccess('Cập nhật lớp học thành công!');
      } else {
        await classApi.create({
          name: className.trim(),
          sportName: classSport,
          coachId: classCoachId,
          coachName: selectedCoach?.fullName || 'Chưa phân công',
          roomId: classRoomId,
          roomName: selectedRoom?.name || 'Chưa chọn phòng',
          dayOfWeek: classDay,
          timeSlot: classSlot,
          capacity: Number(classCapacity),
          level: classLevel
        });
        showSuccess('Tạo lớp học mới thành công!');
      }
      setClassModalOpen(false);
      loadData();
    } catch (err) {
      showError(err.message || 'Lỗi lưu lớp học!');
    } finally {
      setSavingClass(false);
    }
  };

  const openCreateRoomModal = () => {
    setEditingRoom(null);
    setRoomName('');
    setRoomType('Bể bơi');
    setRoomCapacity(30);
    setRoomLocation('Khu A - Tầng 1');
    setRoomModalOpen(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      showError('Vui lòng nhập tên cụm sân/phòng tập!');
      return;
    }
    setSavingRoom(true);
    try {
      if (editingRoom) {
        await roomApi.update(editingRoom.id, {
          name: roomName.trim(),
          type: roomType,
          capacity: Number(roomCapacity),
          location: roomLocation.trim()
        });
        showSuccess('Cập nhật phòng thành công!');
      } else {
        await roomApi.create({
          name: roomName.trim(),
          type: roomType,
          capacity: Number(roomCapacity),
          location: roomLocation.trim()
        });
        showSuccess('Thêm phòng tập mới thành công!');
      }
      setRoomModalOpen(false);
      loadData();
    } catch (err) {
      showError(err.message || 'Lỗi lưu phòng!');
    } finally {
      setSavingRoom(false);
    }
  };

  const classColumns = [
    {
      header: 'Tên Lớp Học',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.name}</div>
          <div className="text-xs text-red-600 font-semibold">{row.sportName} • {row.level}</div>
        </div>
      )
    },
    {
      header: 'Huấn Luyện Viên',
      accessor: 'coachName'
    },
    {
      header: 'Phòng / Sân',
      accessor: 'roomName'
    },
    {
      header: 'Thời Gian',
      render: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">{row.timeSlot}</div>
          <div className="text-slate-500">{row.dayOfWeek}</div>
        </div>
      )
    },
    {
      header: 'Sĩ Số / Sức Chứa',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="font-chivo font-bold text-slate-800">
            {row.enrolledCount} / {row.capacity}
          </div>
          <Badge variant={row.enrolledCount >= row.capacity ? 'FULL' : 'OPEN'} size="sm">
            {row.enrolledCount >= row.capacity ? 'FULL' : 'CÒN CHỖ'}
          </Badge>
        </div>
      )
    }
  ];

  const roomColumns = [
    {
      header: 'Tên Cụm Sân / Phòng Tập',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.name}</div>
          <div className="text-xs text-slate-500">{row.location}</div>
        </div>
      )
    },
    {
      header: 'Loại Cơ Sở',
      accessor: 'type'
    },
    {
      header: 'Sức Chứa Tối Đa',
      render: (row) => <span className="font-bold text-slate-900">{row.capacity} người</span>
    },
    {
      header: 'Trạng Thái Vận Hành',
      render: (row) => <Badge variant={row.status}>{row.status}</Badge>
    }
  ];

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu lớp & sân tập..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
            MANAGE CLASSES & ROOMS
          </span>
          <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Lớp Học & Phòng Tập
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Phối hợp lịch mở lớp theo 9 cụm sân tiêu chuẩn Olympic và kiểm tra xung đột thời gian.
          </p>
        </div>

        {activeTab === 'classes' ? (
          <button
            onClick={openCreateClassModal}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Mở Lớp Học Mới</span>
          </button>
        ) : (
          <button
            onClick={openCreateRoomModal}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add_business</span>
            <span>Thêm Cụm Sân Mới</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('classes')}
          className={`pb-3 px-5 text-xs font-chivo font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${activeTab === 'classes'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">sports_score</span>
          <span>Danh Sách Lớp Học ({classes.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`pb-3 px-5 text-xs font-chivo font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${activeTab === 'rooms'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">stadium</span>
          <span>9 Cụm Sân & Phòng Tập ({rooms.length})</span>
        </button>
      </div>

      {activeTab === 'classes' ? (
        <Table
          columns={classColumns}
          data={classes}
          searchKey="name"
          searchPlaceholder="Tìm theo tên lớp học..."
        />
      ) : (
        <Table
          columns={roomColumns}
          data={rooms}
          searchKey="name"
          searchPlaceholder="Tìm theo tên sân/phòng..."
        />
      )}

      {/* Create / Edit Class Modal */}
      <Modal
        isOpen={classModalOpen}
        onClose={() => setClassModalOpen(false)}
        title="Mở Lớp Học Mới"
      >
        <form onSubmit={handleSaveClass} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Tên lớp học *
            </label>
            <input
              type="text"
              required
              placeholder="VD: Bơi sải tốc độ & Kỹ thuật thở"
              value={className}
              onChange={e => setClassName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Bộ môn thể thao *
              </label>
              <select
                value={classSport}
                onChange={e => setClassSport(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              >
                {SUPPORTED_SPORTS.map(sport => <option key={sport.id} value={sport.name}>{sport.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Cấp độ
              </label>
              <select
                value={classLevel}
                onChange={e => setClassLevel(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              >
                <option value="Căn bản">Căn bản</option>
                <option value="Trung cấp">Trung cấp</option>
                <option value="Nâng cao">Nâng cao</option>
                <option value="Mọi cấp độ">Mọi cấp độ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Huấn luyện viên phụ trách
              </label>
              <select
                value={classCoachId}
                onChange={e => setClassCoachId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              >
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>{c.fullName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Phòng / Cụm sân tập
              </label>
              <select
                value={classRoomId}
                onChange={e => setClassRoomId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              >
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name} (Tối đa {r.capacity})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Ngày học
              </label>
              <input
                type="text"
                placeholder="Thứ 2, 4, 6"
                value={classDay}
                onChange={e => setClassDay(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Khung giờ
              </label>
              <input
                type="text"
                placeholder="18:00 - 19:30"
                value={classSlot}
                onChange={e => setClassSlot(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Sức chứa tối đa
              </label>
              <input
                type="number"
                min="1"
                value={classCapacity}
                onChange={e => setClassCapacity(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setClassModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={savingClass}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors"
            >
              {savingClass ? 'Đang lưu...' : 'Lưu Lớp Học'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create / Edit Room Modal */}
      <Modal
        isOpen={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        title="Thêm Cụm Sân / Phòng Tập"
      >
        <form onSubmit={handleSaveRoom} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Tên cụm sân / phòng tập *
            </label>
            <input
              type="text"
              required
              placeholder="VD: Sân Bóng Rổ Maple Olympic"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Loại tiện ích
              </label>
              <input
                type="text"
                placeholder="VD: Sân bóng, Phòng Gym, Bể bơi"
                value={roomType}
                onChange={e => setRoomType(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Sức chứa tối đa (người)
              </label>
              <input
                type="number"
                min="1"
                value={roomCapacity}
                onChange={e => setRoomCapacity(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Vị trí trong khu phức hợp
            </label>
            <input
              type="text"
              placeholder="VD: Tòa B - Tầng 2"
              value={roomLocation}
              onChange={e => setRoomLocation(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRoomModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={savingRoom}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-colors"
            >
              {savingRoom ? 'Đang lưu...' : 'Lưu Cơ Sở'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
