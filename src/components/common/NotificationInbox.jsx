import React, { useState } from 'react';
import { notificationApi } from '../../services/api.js';

export function NotificationInbox() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toggle = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true); setLoading(true); setError('');
    try { setItems(await notificationApi.getMine()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  const markRead = async item => {
    if (item.isRead) return;
    try {
      await notificationApi.markRead(item.id);
      setItems(previous => previous.map(n => n.id === item.id ? { ...n, isRead: true } : n));
    } catch (err) { setError(err.message); }
  };
  return <div className="relative">
    <button type="button" onClick={toggle} aria-label="Thông báo" aria-expanded={open} className="p-2 rounded-lg hover:bg-slate-100">
      <span className="material-symbols-outlined">notifications</span>
    </button>
    {open && <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white border rounded-xl shadow-xl p-3 space-y-2">
      <h2 className="font-bold text-sm">Thông báo của bạn</h2>
      {loading && <p role="status" className="text-xs">Đang tải...</p>}
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="text-xs text-slate-500">Chưa có thông báo.</p>}
      {items.map(item => <button key={item.id} type="button" onClick={() => markRead(item)} className={`block w-full text-left rounded p-3 ${item.isRead ? 'bg-slate-50' : 'bg-red-50'}`}>
        <span className="block text-sm font-semibold">{item.title}</span>
        <span className="block text-xs whitespace-pre-wrap">{item.content}</span>
        <span className="text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleString('vi-VN')} · {item.isRead ? 'Đã đọc' : 'Chưa đọc'}</span>
      </button>)}
    </div>}
  </div>;
}
