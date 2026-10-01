import React, { useState, useEffect } from 'react';
import { checkBackendConnection, isMockModeForced, setMockMode } from '../../services/httpClient.js';
import { Modal } from './Modal.js';

export function ApiStatusModal({ isOpen, onClose }) {
  const [checking, setChecking] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null); // { online: boolean, message: string }
  const [isMock, setIsMock] = useState(isMockModeForced());
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

  const handleCheckConnection = async () => {
    setChecking(true);
    const res = await checkBackendConnection();
    setBackendStatus(res);
    setChecking(false);
  };

  useEffect(() => {
    if (isOpen) {
      handleCheckConnection();
      setIsMock(isMockModeForced());
    }
  }, [isOpen]);

  const handleToggleMock = (enableMock) => {
    setMockMode(enableMock);
    setIsMock(enableMock);
    if (!enableMock) {
      handleCheckConnection();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trạng thái Kết nối Backend REST API">
      <div className="space-y-5 text-sm">
        {/* Status Banner */}
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          isMock
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : backendStatus?.online
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="mt-0.5">
            <span className={`inline-block w-3.5 h-3.5 rounded-full ${
              isMock
                ? 'bg-amber-500'
                : backendStatus?.online
                ? 'bg-emerald-500 animate-pulse'
                : 'bg-rose-500'
            }`} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-base flex items-center justify-between">
              <span>
                {isMock
                  ? 'Chế độ Mock Dữ liệu (Offline / Local DB)'
                  : backendStatus?.online
                  ? 'Đã kết nối Backend REST API thành công'
                  : 'Backend Chưa Kết Nối (Tự động Fallback)'}
              </span>
            </div>
            <p className="text-xs mt-1 leading-relaxed opacity-90">
              {isMock
                ? 'Đang cưỡng chế sử dụng Mock DB (dữ liệu lưu trữ trong trình duyệt để demo/kiểm thử không cần Backend).'
                : backendStatus?.online
                ? `Hệ thống đang gửi và nhận dữ liệu thật từ máy chủ Backend tại: ${baseUrl}`
                : `Máy chủ Backend tại ${baseUrl} chưa khởi động hoặc từ chối kết nối. Hệ thống tự động chuyển sang chế độ Mock Fallback để trải nghiệm không bị gián đoạn.`}
            </p>
          </div>
        </div>

        {/* Configuration Details */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Base URL:</span>
            <code className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-red-600 font-bold">
              {baseUrl}
            </code>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">JWT Header:</span>
            <code className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-slate-700">
              Authorization: Bearer &lt;token&gt;
            </code>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Cơ chế Fallback:</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Tự động bật khi Backend offline
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={handleCheckConnection}
            disabled={checking}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${checking ? 'animate-spin' : ''}`}>
              refresh
            </span>
            {checking ? 'Đang kiểm tra...' : 'Kiểm tra kết nối lại'}
          </button>

          {isMock ? (
            <button
              onClick={() => handleToggleMock(false)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">cloud</span>
              Bật chế độ gọi REST API
            </button>
          ) : (
            <button
              onClick={() => handleToggleMock(true)}
              className="px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 font-semibold text-xs hover:bg-amber-100 transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">devices</span>
              Chuyển sang Mock Mode
            </button>
          )}
        </div>

        {/* Endpoints Directory Preview */}
        <div>
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-red-600">api</span>
            Các Endpoint REST API chính đã tích hợp:
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2.5 bg-white text-xs">
            <div className="flex items-center justify-between text-slate-600 font-mono">
              <span className="text-blue-600 font-bold">POST</span>
              <span>/api/auth/login</span>
              <span className="text-[10px] text-slate-400">Đăng nhập JWT</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 font-mono">
              <span className="text-emerald-600 font-bold">GET</span>
              <span>/api/staff</span>
              <span className="text-[10px] text-slate-400">DS Nhân sự</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 font-mono">
              <span className="text-emerald-600 font-bold">GET</span>
              <span>/api/packages</span>
              <span className="text-[10px] text-slate-400">DS Gói tập</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 font-mono">
              <span className="text-emerald-600 font-bold">GET</span>
              <span>/api/classes</span>
              <span className="text-[10px] text-slate-400">Lớp học & Sân</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 font-mono">
              <span className="text-blue-600 font-bold">POST</span>
              <span>/api/bookings</span>
              <span className="text-[10px] text-slate-400">Đặt chỗ lớp</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 font-mono">
              <span className="text-blue-600 font-bold">POST</span>
              <span>/api/reception/check-in</span>
              <span className="text-[10px] text-slate-400">Check-in cổng</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 font-mono">
              <span className="text-emerald-600 font-bold">GET</span>
              <span>/api/reports/overview</span>
              <span className="text-[10px] text-slate-400">Thống kê Dashboard</span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 text-center">
          Xem tài liệu đầy đủ tại file <span className="font-semibold text-slate-600 font-mono">SCMS_API_Specification.md</span>
        </div>
      </div>
    </Modal>
  );
}
