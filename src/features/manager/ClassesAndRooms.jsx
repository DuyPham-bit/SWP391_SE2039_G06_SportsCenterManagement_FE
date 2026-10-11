import { classApi, roomApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/Table.js';

const { useState, useEffect } = React;
const field = 'border border-slate-300 rounded-lg p-2 w-full text-sm';
const button = 'rounded-lg px-3 py-2 bg-slate-900 text-white text-xs disabled:opacity-50';
const today = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);

export function ClassesAndRooms() {
  const { showSuccess, showError } = useToast();
  const [tab, setTab] = useState('classes');
  const [data, setData] = useState({ classes: [], rooms: [], sports: [], coaches: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [schedules, setSchedules] = useState([]);
  const load = async () => {
    try {
      const [classes, rooms, sports, coaches] = await Promise.all([
        classApi.getManagementClasses(), roomApi.getAll(), classApi.getSports(), classApi.getCoaches()
      ]);
      setData({ classes, rooms, sports, coaches });
    } catch (e) { showError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const openClass = row => {
    setForm(row ? { ...row } : { name: '', sportId: data.sports[0]?.id || '', roomId: '', capacity: 20, durationMinutes: 60, level: '', description: '', allowWaitlist: true });
    setModal({ type: 'class', row });
  };
  const openRoom = row => {
    setForm(row ? { ...row } : { name: '', type: '', capacity: 30, location: '' });
    setModal({ type: 'room', row });
  };
  const openSchedules = async row => {
    try {
      setSchedules(await classApi.getSchedules(row.id));
      setForm({ roomId: row.roomId || '', dayOfWeek: 1, startTime: '08:00', endTime: '09:00', startDate: today(), endDate: today() });
      setModal({ type: 'schedule', row });
    } catch (e) { showError(e.message); }
  };
  const action = async fn => {
    setBusy(true);
    try { await fn(); showSuccess('Đã lưu thay đổi.'); await load(); }
    catch (e) { showError(e.message); }
    finally { setBusy(false); }
  };
  const save = async e => {
    e.preventDefault();
    await action(async () => {
      if (modal.type === 'class') {
        const body = { ...form, sportId: Number(form.sportId), capacity: Number(form.capacity), durationMinutes: Number(form.durationMinutes) };
        if (modal.row) await classApi.update(modal.row.id, body); else await classApi.create(body);
      } else if (modal.type === 'room') {
        const body = { ...form, capacity: Number(form.capacity) };
        if (modal.row) await roomApi.update(modal.row.id, body); else await roomApi.create(body);
      } else {
        await classApi.createSchedule(modal.row.id, { ...form, roomId: form.roomId ? Number(form.roomId) : null, dayOfWeek: Number(form.dayOfWeek), startTime: form.startTime + ':00', endTime: form.endTime + ':00' });
      }
      setModal(null);
    });
  };
  if (loading) return <LoadingSpinner text="Đang tải lớp và phòng tập..." />;
  return <div className="space-y-5">
    <h1 className="text-2xl font-bold">Quản lý lớp học, phòng tập và lịch hoạt động</h1>
    <div className="flex gap-3">
      <button className={button} onClick={() => setTab('classes')}>Lớp học ({data.classes.length})</button>
      <button className={button} onClick={() => setTab('rooms')}>Phòng tập ({data.rooms.length})</button>
      <button className={button} onClick={() => tab === 'classes' ? openClass(null) : openRoom(null)}>Thêm mới</button>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      {(tab === 'classes' ? data.classes : data.rooms).map(row => <article key={row.id} className="bg-white border rounded-xl p-5 space-y-3">
        <h2 className="font-bold">{row.name}</h2>
        <p className="text-sm">{row.sportName || row.type} · Sức chứa: {row.capacity} · {row.status}</p>
        {tab === 'classes' && <p className="text-sm">{row.coachName || 'Chưa phân công HLV'} · {row.roomName || 'Chưa chọn phòng'}</p>}
        <div className="flex flex-wrap gap-2">
          <button className={button} disabled={busy} onClick={() => tab === 'classes' ? openClass(row) : openRoom(row)}>Sửa</button>
          {tab === 'classes' && <>
            <button className={button} disabled={busy} onClick={() => openSchedules(row)}>Lịch học</button>
            {row.status === 'Draft' && <button className={button} disabled={busy} onClick={() => action(() => classApi.publish(row.id))}>Công bố</button>}
            {!['Cancelled','Completed'].includes(row.status) && <button className={button} disabled={busy} onClick={() => { setModal({ type: 'cancel', row }); }}>Hủy lớp</button>}
          </>}
        </div>
      </article>)}
    </div>
    <Modal isOpen={Boolean(modal)} onClose={() => !busy && setModal(null)} title={modal?.type === 'schedule' ? 'Quản lý lịch học' : modal?.type === 'cancel' ? 'Xác nhận hủy lớp' : 'Thông tin lớp / phòng'}>
      {modal?.type === 'cancel' ? <div className="space-y-4"><p>Hủy lớp {modal.row.name} sẽ hủy các buổi học và đăng ký liên quan.</p><button className={button} disabled={busy} onClick={() => action(async () => { await classApi.cancel(modal.row.id); setModal(null); })}>Xác nhận hủy</button></div> :
      <form onSubmit={save} className="space-y-3">
        {modal?.type !== 'schedule' && <label className="block">Tên<input className={field} name="name" required maxLength={100} value={form.name || ''} onChange={change} /></label>}
        {modal?.type === 'class' && <>
          <label className="block"><input type="checkbox" checked={form.allowWaitlist !== false} onChange={e => setForm(f => ({ ...f, allowWaitlist: e.target.checked }))} /> Cho phép danh sách chờ</label>
          <label className="block">Bộ môn<select className={field} name="sportId" required value={form.sportId || ''} onChange={change}><option value="">Chọn bộ môn</option>{data.sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label className="block">Cấp độ<input className={field} name="level" value={form.level || ''} onChange={change} /></label>
          <label className="block">Thời lượng (phút)<input className={field} name="durationMinutes" type="number" min="1" required value={form.durationMinutes || ''} onChange={change} /></label>
        </>}
        {modal?.type !== 'room' && <label className="block">Phòng<select className={field} name="roomId" value={form.roomId || ''} onChange={change}><option value="">Theo phòng mặc định / chưa chọn</option>{data.rooms.filter(r => r.status === 'Active').map(r => <option key={r.id} value={r.id}>{r.name} ({r.capacity})</option>)}</select></label>}
        {modal?.type !== 'schedule' && <label className="block">Sức chứa<input className={field} name="capacity" type="number" min="1" required value={form.capacity || ''} onChange={change} /></label>}
        {modal?.type === 'room' && <><label className="block">Loại phòng<input className={field} maxLength={100} name="type" value={form.type || ''} onChange={change} /></label><label className="block">Vị trí<input className={field} maxLength={255} name="location" value={form.location || ''} onChange={change} /></label></>}
        {modal?.type === 'schedule' && <>
          {schedules.map(s => <div key={s.id} className="border rounded p-2 text-sm">{s.startDate} – {s.endDate} · Ngày {s.dayOfWeek} · {s.startTime}–{s.endTime} · {s.status}{s.status === 'Active' && <button type="button" className={button} disabled={busy} onClick={() => action(async () => { await classApi.cancelSchedule(modal.row.id, s.id); setSchedules(await classApi.getSchedules(modal.row.id)); })}>Hủy lịch</button>}</div>)}
          <label className="block">Ngày trong tuần<select className={field} name="dayOfWeek" value={form.dayOfWeek ?? 1} onChange={change}>{['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'].map((d,i) => <option key={i} value={i}>{d}</option>)}</select></label>
          {['startDate','endDate','startTime','endTime'].map(name => <label className="block" key={name}>{({ startDate: 'Từ ngày', endDate: 'Đến ngày', startTime: 'Giờ bắt đầu', endTime: 'Giờ kết thúc' })[name]}<input className={field} required type={name.endsWith('Date') ? 'date' : 'time'} name={name} value={form[name] || ''} onChange={change} /></label>)}
        </>}
        <button className={button} type="submit" disabled={busy}>{busy ? 'Đang lưu...' : modal?.type === 'schedule' ? 'Thêm lịch và tạo buổi học' : 'Lưu'}</button>
      </form>}
    </Modal>
  </div>;
}
