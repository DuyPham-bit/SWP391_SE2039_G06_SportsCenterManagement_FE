import React from 'react';
import { receptionApi } from '../../services/api.js';
import { StatCard, Badge } from '../../components/common/StatCard.jsx';
import { LoadingSpinner } from '../../components/common/Table.jsx';

const { useState, useEffect } = React;

export function ReceptionistDashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await receptionApi.getCheckInHistory();
        setHistory(Array.isArray(data) ? data : []);
        setHistoryError('');
      } catch (e) {
        setHistoryError(e.message || 'Không thể tải lịch sử check-in.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu quầy lễ tân..." />;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <span className="font-chivo text-xs uppercase tracking-widest text-red-500 font-bold">
            QUẦY LỄ TÂN & ĐÓN TIẾP KHÁCH
          </span>
          <h1 className="font-chivo text-2xl md:text-3xl font-black mt-1">
            Tổng Quan Ca Trực Lễ Tân (Reception Desk)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tra cứu hội viên nhanh, đăng ký gia hạn gói tập tại quầy và kiểm soát check-in vào sân.
          </p>
        </div>

        <div className="flex gap-2">
          <a href="#/receptionist/check-in"
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold font-chivo uppercase flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            <span>Ghi nhận Check-in</span>
          </a>
          <a
            href="#/receptionist/counter-register"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-colors border border-slate-700 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
            <span>Thu Ngân / Gia Hạn</span>
          </a>
        </div>
      </div>

      {historyError && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Không tải được lịch sử check-in:</strong> {historyError}
          <p className="mt-1">Các chức năng tra cứu hội viên và thanh toán tại quầy vẫn có thể truy cập từ mục thao tác bên dưới.</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Lượt Check-in Hôm Nay"
          value={historyError ? "—" : history.length}
          subtitle={historyError ? "Chưa có dữ liệu từ máy chủ" : "Số bản ghi mới nhất (tối đa 100)"}
          icon="fact_check"
          color="red"
        />
        <StatCard
          title="Trạng Thái Quầy"
          value="Chưa xác định"
          subtitle="Chưa có API trạng thái quầy"
          icon="check_circle"
          color="slate"
        />
        <StatCard
          title="Tỷ Lệ Hợp Lệ"
          value="—"
          subtitle="Chưa có API thống kê tính hợp lệ"
          icon="verified"
          color="slate"
        />
      </div>

      {/* Quick Action Cards & Live Check-in Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation Action Buttons */}
        <div className="space-y-4">
          <h2 className="font-chivo text-xs font-black text-slate-900 uppercase tracking-wide">
            Thao Tác Nghiệp Vụ Tại Bàn
          </h2>

          <a
            href="#/receptionist/lookup"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-red-500 hover:shadow-md transition-all flex items-start gap-4 block group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[26px]">person_search</span>
            </div>
            <div>
              <h3 className="font-chivo text-sm font-bold text-slate-900 group-hover:text-red-600">
                Tra Cứu Hồ Sơ Hội Viên
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tra cứu nhanh số điện thoại, email, hạn sử dụng thẻ và lịch sử tham gia lớp học.
              </p>
            </div>
          </a>

          <a
            href="#/receptionist/counter-register"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-red-500 hover:shadow-md transition-all flex items-start gap-4 block group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[26px]">credit_card</span>
            </div>
            <div>
              <h3 className="font-chivo text-sm font-bold text-slate-900 group-hover:text-red-600">
                Gia Hạn Gói Tại Quầy
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Thu tiền mặt/POS và ghi nhận hóa đơn thật; gói chỉ được kích hoạt khi máy chủ xác nhận thanh toán.
              </p>
            </div>
          </a>

          <a href="#/receptionist/check-in"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-red-500 flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[26px]">how_to_reg</span>
            </div>
            <div>
              <h3 className="font-chivo text-sm font-bold text-slate-900 group-hover:text-red-600">
                Ghi Nhận Check-in Hội Viên
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tra cứu mã hội viên, kiểm tra gói tập và lưu lịch sử trên máy chủ. Không kích hoạt cổng RFID.
              </p>
            </div>
          </a>
        </div>

        {/* Live Feed */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-chivo text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${historyError ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                Lịch sử quét thẻ vào sân
              </h2>
              <span className="text-xs font-bold text-slate-400">Hôm nay</span>
            </div>

            <div className="divide-y divide-slate-100">
              {!historyError && history.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-500">Chưa có bản ghi check-in.</p>
              )}
              {historyError && (
                <p className="py-6 text-center text-sm text-slate-500">Không thể tải lịch sử check-in từ máy chủ.</p>
              )}
              {history.map(item => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-chivo font-black text-xs">
                      OK
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{item.memberName}</div>
                      <div className="text-[11px] text-slate-500">Mã thẻ: <strong>{item.memberCode}</strong> • {item.packageName || 'Gói tập đã xác minh'}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-slate-700 block">{new Date(item.checkInTime).toLocaleTimeString('vi-VN')}</span>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">Đã ghi nhận</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p role="status" className="mt-4 w-full py-2.5 bg-slate-100 text-slate-600 font-chivo text-xs font-bold rounded-lg text-center">
            Thống kê được truy xuất từ Backend theo ngày Việt Nam; không có chức năng mở cổng vật lý.
          </p>
        </div>
      </div>
    </div>
  );
}
