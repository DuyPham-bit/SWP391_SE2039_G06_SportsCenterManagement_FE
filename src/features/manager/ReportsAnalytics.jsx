import React, { useEffect, useState } from 'react';
import { reportApi } from '../../services/api.js';
import { createRevenueAnalyticsCsv } from '../../services/reportExport.js';
import { StatCard } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { useToast } from '../../context/ToastContext.js';

const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
const button = 'rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';
const pageSize = 25;
const presets = [
  ['WEEK', 'Tuần này'],
  ['MONTH', 'Tháng này'],
  ['QUARTER', 'Quý này'],
  ['YEAR', 'Năm nay']
];
const dimensions = [
  { id: 'rooms', label: 'Sân / phòng', icon: 'stadium', activity: 'lượt đặt' },
  { id: 'sports', label: 'Môn tập', icon: 'sports', activity: 'lượt đặt' },
  { id: 'packages', label: 'Gói tập', icon: 'card_membership', activity: 'giao dịch' },
  { id: 'coaches', label: 'Huấn luyện viên', icon: 'sports_martial_arts', activity: 'lượt đặt' },
  { id: 'members', label: 'Thành viên', icon: 'group', activity: 'giao dịch' }
];

const getVietnamToday = () => new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
const toIsoDate = date => date.toISOString().slice(0, 10);

function getPresetRange(preset, today = getVietnamToday()) {
  const currentDate = new Date(`${today}T00:00:00.000Z`);
  const year = currentDate.getUTCFullYear();
  const month = currentDate.getUTCMonth() + 1;
  let from = new Date(currentDate);
  let groupBy = 'day';

  if (preset === 'WEEK') {
    const mondayOffset = (currentDate.getUTCDay() + 6) % 7;
    from.setUTCDate(from.getUTCDate() - mondayOffset);
  } else if (preset === 'MONTH') {
    from = new Date(Date.UTC(year, month - 1, 1));
  } else if (preset === 'QUARTER') {
    const quarterStartMonth = Math.floor((month - 1) / 3) * 3;
    from = new Date(Date.UTC(year, quarterStartMonth, 1));
    groupBy = 'week';
  } else if (preset === 'YEAR') {
    from = new Date(Date.UTC(year, 0, 1));
    groupBy = 'month';
  }

  return { from: toIsoDate(from), to: today, groupBy };
}

const formatMoney = value => `${Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫`;
const formatCompactMoney = value => {
  const amount = Number(value || 0);
  const absolute = Math.abs(amount);
  const divisor = absolute >= 1_000_000_000 ? 1_000_000_000 : absolute >= 1_000_000 ? 1_000_000 : absolute >= 1_000 ? 1_000 : 1;
  const suffix = divisor === 1_000_000_000 ? ' tỷ' : divisor === 1_000_000 ? ' tr' : divisor === 1_000 ? ' k' : '';
  return `${(amount / divisor).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}${suffix}`;
};

const formatPeriodLabel = (periodStart, groupBy) => {
  const [year, month, day] = String(periodStart).split('-').map(Number);
  if (groupBy === 'week') return `Tuần ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
  if (groupBy === 'month') return `T${month}/${year}`;
  if (groupBy === 'quarter') return `Q${Math.ceil(month / 3)}/${year}`;
  if (groupBy === 'year') return String(year);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
};

function RevenueTrendChart({ periods = [], groupBy = 'day' }) {
  if (!periods.length) {
    return <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">Chưa có dữ liệu trong kỳ này.</div>;
  }

  const values = periods.map(item => Number(item.net || 0));
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values, 1);
  const valueRange = maximum - minimum || 1;
  const width = Math.max(720, periods.length * 58);
  const height = 280;
  const left = 72;
  const right = 20;
  const top = 18;
  const bottom = 48;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const xAt = index => periods.length === 1 ? left + chartWidth / 2 : left + index * chartWidth / (periods.length - 1);
  const yAt = value => top + (maximum - value) / valueRange * chartHeight;
  const zeroY = yAt(0);
  const coordinates = values.map((value, index) => ({ x: xAt(index), y: yAt(value), value, item: periods[index] }));
  const linePath = coordinates.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const areaPath = coordinates.length
    ? `M ${coordinates[0].x} ${zeroY} ${coordinates.map(point => `L ${point.x} ${point.y}`).join(' ')} L ${coordinates[coordinates.length - 1].x} ${zeroY} Z`
    : '';
  const tickStep = Math.max(1, Math.ceil(periods.length / 10));

  return <div className="overflow-x-auto rounded-xl bg-slate-50 p-3 sm:p-4">
    <svg className="h-[280px] w-full min-w-[720px]" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Biểu đồ doanh thu thuần theo ${groupBy}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="revenue-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#dc2626" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#dc2626" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map(tick => {
        const value = maximum - valueRange * tick;
        const y = yAt(value);
        return <g key={tick}>
          <line x1={left} x2={width - right} y1={y} y2={y} stroke="#cbd5e1" strokeDasharray="4 5" />
          <text x={left - 10} y={y + 4} textAnchor="end" fill="#64748b" fontSize="11">{formatCompactMoney(value)}</text>
        </g>;
      })}
      <line x1={left} x2={width - right} y1={zeroY} y2={zeroY} stroke="#94a3b8" strokeWidth="1.5" />
      <path d={areaPath} fill="url(#revenue-area)" />
      <path d={linePath} fill="none" stroke="#dc2626" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {coordinates.map((point, index) => <g key={point.item.periodStart}>
        <circle cx={point.x} cy={point.y} r="4" fill="#fff" stroke="#dc2626" strokeWidth="2.5">
          <title>{`${formatPeriodLabel(point.item.periodStart, groupBy)} · ${formatMoney(point.value)}`}</title>
        </circle>
        {(index % tickStep === 0 || index === coordinates.length - 1) && <text x={point.x} y={height - 15} textAnchor="middle" fill="#475569" fontSize="11">
          {formatPeriodLabel(point.item.periodStart, groupBy)}
        </text>}
      </g>)}
    </svg>
  </div>;
}

function BreakdownBars({ items = [], activityLabel }) {
  const topItems = [...items]
    .filter(item => Number(item.gross || 0) !== 0 || Number(item.refunds || 0) !== 0)
    .sort((a, b) => Math.abs(Number(b.net || 0)) - Math.abs(Number(a.net || 0)))
    .slice(0, 8);
  const maxNet = Math.max(1, ...topItems.map(item => Math.abs(Number(item.net || 0))));

  if (!topItems.length) {
    return <div className="flex h-56 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">Chưa phát sinh doanh thu trong nhóm này.</div>;
  }

  return <div className="space-y-4" aria-label={`Top ${activityLabel}`}>
    {topItems.map(item => {
      const net = Number(item.net || 0);
      const width = Math.abs(net) / maxNet * 100;
      return <div key={item.id ?? 'unassigned'} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1.5">
        <div className="truncate text-sm font-semibold text-slate-700" title={item.name}>{item.name}</div>
        <div className="text-right text-sm font-bold tabular-nums text-slate-900">{formatMoney(net)}</div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${net < 0 ? 'bg-amber-500' : 'bg-red-600'}`} style={{ width: `${width}%` }} />
        </div>
        <div className="text-right text-xs text-slate-500">{Number(item.activityCount || 0).toLocaleString('vi-VN')} {activityLabel}</div>
      </div>;
    })}
    <p className="pt-1 text-xs text-slate-500">Xếp theo giá trị doanh thu thuần tuyệt đối.</p>
  </div>;
}

export function ReportsAnalytics() {
  const { showError } = useToast();
  const [initialRange] = useState(() => getPresetRange('MONTH'));
  const [preset, setPreset] = useState('MONTH');
  const [range, setRange] = useState(initialRange);
  const [appliedRange, setAppliedRange] = useState(initialRange);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [revision, setRevision] = useState(0);
  const [dimension, setDimension] = useState('rooms');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError('');
    setReport(null);
    reportApi.getRevenueAnalytics(appliedRange, controller.signal)
      .then(data => { if (active) setReport(data); })
      .catch(reason => { if (active && reason.name !== 'AbortError') setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [appliedRange, revision]);

  useEffect(() => setPage(0), [dimension, search]);

  const selectPreset = id => {
    const nextRange = getPresetRange(id);
    setPreset(id);
    setRange(nextRange);
    setAppliedRange(nextRange);
    setFormError('');
  };

  const applyCustomRange = event => {
    event.preventDefault();
    setFormError('');
    if (!range.from || !range.to || range.from > range.to) {
      setFormError('Vui lòng chọn khoảng ngày hợp lệ.');
      return;
    }
    const from = new Date(`${range.from}T00:00:00.000Z`);
    const to = new Date(`${range.to}T00:00:00.000Z`);
    if ((to - from) / 86400000 > 366) {
      setFormError('Khoảng ngày tối đa là 367 ngày.');
      return;
    }
    setPreset('CUSTOM');
    setAppliedRange({ ...range });
  };

  const exportReport = () => {
    try {
      const url = URL.createObjectURL(new Blob([createRevenueAnalyticsCsv(report)], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `SCMS-doanh-thu-${appliedRange.from}-${appliedRange.to}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) {
      showError(reason.message);
    }
  };

  const activeDimension = dimensions.find(item => item.id === dimension) || dimensions[0];
  const breakdown = report?.[dimension] || [];
  const normalizedSearch = search.trim().toLocaleLowerCase('vi');
  const filteredRows = breakdown
    .filter(item => !normalizedSearch || `${item.name} ${item.code || ''}`.toLocaleLowerCase('vi').includes(normalizedSearch))
    .sort((a, b) => Number(b.net || 0) - Number(a.net || 0) || a.name.localeCompare(b.name, 'vi'));
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">Phân tích hoạt động tài chính</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Báo cáo doanh thu</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">Theo dõi doanh thu theo thời gian và tra cứu chi tiết theo sân, môn tập, gói, huấn luyện viên hoặc thành viên.</p>
      </div>
      <button type="button" className={`${button} bg-slate-900 text-white hover:bg-slate-800`} disabled={loading || !report} onClick={exportReport}>
        <span className="material-symbols-outlined mr-1 align-middle text-[18px]">download</span> Xuất CSV
      </button>
    </header>

    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Bộ lọc kỳ báo cáo">
      <div className="mb-4 flex flex-wrap gap-2">
        {presets.map(([id, label]) => <button
          key={id}
          type="button"
          className={`${button} ${preset === id ? 'bg-red-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          aria-pressed={preset === id}
          onClick={() => selectPreset(id)}
        >{label}</button>)}
      </div>
      <form className="flex flex-wrap items-end gap-3" onSubmit={applyCustomRange}>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">Từ ngày
          <input className={field} type="date" required value={range.from} onChange={event => { setPreset('CUSTOM'); setRange(current => ({ ...current, from: event.target.value })); }} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">Đến ngày
          <input className={field} type="date" required min={range.from} value={range.to} onChange={event => { setPreset('CUSTOM'); setRange(current => ({ ...current, to: event.target.value })); }} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">Gom biểu đồ theo
          <select className={field} value={range.groupBy} onChange={event => { setPreset('CUSTOM'); setRange(current => ({ ...current, groupBy: event.target.value })); }}>
            <option value="day">Ngày</option>
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
            <option value="quarter">Quý</option>
            <option value="year">Năm</option>
          </select>
        </label>
        <button className={`${button} bg-red-600 text-white hover:bg-red-700`} disabled={loading}>Áp dụng</button>
      </form>
      {formError && <p role="alert" className="mt-3 text-sm text-red-700">{formError}</p>}
    </section>

    {loading ? <LoadingSpinner text="Đang tải báo cáo doanh thu..." /> : error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
      <p className="font-semibold">Không tải được báo cáo</p>
      <p className="mt-1 text-sm">{error}</p>
      <button type="button" className={`${button} mt-3 bg-red-700 text-white hover:bg-red-800`} onClick={() => setRevision(value => value + 1)}>Thử lại</button>
    </div> : report && <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">Kỳ báo cáo: {report.from} – {report.to} · Gom theo {report.groupBy === 'day' ? 'ngày' : report.groupBy === 'week' ? 'tuần' : report.groupBy === 'month' ? 'tháng' : report.groupBy === 'quarter' ? 'quý' : 'năm'}</p>
        <p className="text-xs text-slate-500">Múi giờ báo cáo: {report.timeZone}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Doanh thu thuần" value={formatMoney(report.net)} subtitle="Đã trừ hoàn tiền" icon="payments" color="red" />
        <StatCard title="Doanh thu gộp" value={formatMoney(report.gross)} subtitle="Giao dịch thành công" icon="account_balance_wallet" color="slate" />
        <StatCard title="Hoàn tiền" value={formatMoney(report.refunds)} subtitle="Hoàn tiền thành công" icon="currency_exchange" color="slate" />
        <StatCard title="Giao dịch" value={Number(report.successfulPaymentCount || 0).toLocaleString('vi-VN')} subtitle="Thanh toán thành công trong kỳ" icon="receipt_long" color="red" />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div><h2 className="text-lg font-bold text-slate-900">Xu hướng doanh thu thuần</h2><p className="mt-1 text-xs text-slate-500">Doanh thu gộp trừ khoản hoàn tiền theo ngày ghi nhận.</p></div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-red-700"><span className="h-2.5 w-2.5 rounded-full bg-red-600" /> Doanh thu thuần</span>
        </div>
        <RevenueTrendChart periods={report.periods} groupBy={report.groupBy} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Doanh thu theo từng nhóm</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Doanh thu gói và thành viên lấy trực tiếp từ hóa đơn. Doanh thu theo sân, môn và HLV được phân bổ theo tỷ trọng lượt đặt còn hiệu lực hoặc hủy muộn tính phí gắn với subscription của giao dịch trong toàn thời hạn gói. Lượt đặt chưa xác định được sân hoặc HLV và giao dịch chưa có lịch sử sử dụng được giữ trong mục “Chưa phân bổ”.</p>
        </div>

        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Nhóm doanh thu">
          {dimensions.map(item => <button
            type="button"
            key={item.id}
            role="tab"
            aria-selected={dimension === item.id}
            className={`${button} inline-flex items-center gap-1.5 ${dimension === item.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            onClick={() => setDimension(item.id)}
          ><span className="material-symbols-outlined text-[17px]">{item.icon}</span>{item.label}</button>)}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <h3 className="mb-4 text-sm font-bold text-slate-800">Xếp hạng {activeDimension.label.toLocaleLowerCase('vi')}</h3>
            <BreakdownBars items={breakdown} activityLabel={activeDimension.activity} />
          </div>
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-800">Chi tiết đầy đủ ({filteredRows.length.toLocaleString('vi-VN')})</h3>
              <label className="relative block w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
                <input className={`${field} w-full pl-9`} type="search" placeholder="Tìm theo tên hoặc mã" value={search} onChange={event => setSearch(event.target.value)} aria-label={`Tìm ${activeDimension.label.toLocaleLowerCase('vi')}`} />
              </label>
            </div>
            <div className="max-h-[460px] overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-[700px] w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                  <tr><th className="px-3 py-3">#</th><th className="px-3 py-3">{activeDimension.label}</th><th className="px-3 py-3 text-right">Gộp</th><th className="px-3 py-3 text-right">Hoàn</th><th className="px-3 py-3 text-right">Thuần</th><th className="px-3 py-3 text-right">{activeDimension.activity === 'lượt đặt' ? 'Lượt đặt' : 'Giao dịch'}</th></tr>
                </thead>
                <tbody>
                  {visibleRows.map((item, index) => <tr key={item.id ?? 'unassigned'} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-3 text-slate-500">{page * pageSize + index + 1}</td>
                    <td className="max-w-[260px] px-3 py-3"><div className="truncate font-semibold text-slate-800" title={item.name}>{item.name}</div>{item.code && <div className="mt-0.5 text-xs text-slate-500">{item.code}</div>}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-slate-600">{formatMoney(item.gross)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-amber-700">{formatMoney(item.refunds)}</td>
                    <td className={`whitespace-nowrap px-3 py-3 text-right font-bold tabular-nums ${Number(item.net) < 0 ? 'text-amber-700' : 'text-slate-900'}`}>{formatMoney(item.net)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-slate-600">{Number(item.activityCount || 0).toLocaleString('vi-VN')}</td>
                  </tr>)}
                  {!visibleRows.length && <tr><td colSpan="6" className="px-4 py-10 text-center text-sm text-slate-500">Không có mục nào khớp với tìm kiếm.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
              <span>Trang {page + 1} / {pageCount}</span>
              <div className="flex gap-2">
                <button type="button" className={`${button} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`} disabled={page === 0} onClick={() => setPage(value => Math.max(0, value - 1))}>Trước</button>
                <button type="button" className={`${button} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`} disabled={page + 1 >= pageCount} onClick={() => setPage(value => Math.min(pageCount - 1, value + 1))}>Sau</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>}
  </div>;
}
