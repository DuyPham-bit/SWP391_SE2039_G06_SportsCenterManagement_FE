import { systemApi } from '../../services/api.js';
import { Table, LoadingSpinner } from '../../components/common/Table.js';
import { Badge } from '../../components/common/StatCard.js';
import { useToast } from '../../context/ToastContext.js';

const { useState, useEffect } = React;

export function AuditLogs() {
  const { showError } = useToast();
  const [logs, setLogs] = useState([]);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      const data = await systemApi.getAuditLogs();
      setLogs(data);
    } catch (e) {
      showError(e.message || 'Không thể tải nhật ký từ backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = actionFilter === 'ALL'
    ? logs
    : logs.filter(l => l.action.includes(actionFilter));

  const columns = [
    {
      header: 'Thời Gian',
      render: (row) => (
        <span className="font-chivo text-xs text-slate-500 font-semibold">{row.timestamp}</span>
      )
    },
    {
      header: 'Người Thực Hiện',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">{row.userName}</span>
          <Badge variant={row.role} size="sm">{row.role}</Badge>
        </div>
      )
    },
    {
      header: 'Hành Động Hệ Thống',
      render: (row) => (
        <span className="font-chivo text-xs font-bold text-red-600 uppercase tracking-wider">
          {row.action}
        </span>
      )
    },
    {
      header: 'Chi Tiết Thao Tác',
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium">{row.details}</span>
      )
    },
    {
      header: 'Kết Quả',
      render: (row) => <Badge variant={row.status || 'SUCCESS'}>{row.status || 'SUCCESS'}</Badge>
    }
  ];

  if (loading) return <LoadingSpinner text="Đang tải nhật ký kiểm toán hệ thống..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
            VIEW AUDIT LOGS
          </span>
          <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
            Nhật Ký Kiểm Toán Hệ Thống (Audit Logs)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi truy vết toàn bộ hoạt động đăng nhập, giao dịch, mở lớp, phân công và check-in.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold font-chivo uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          <span>Làm Mới</span>
        </button>
      </div>

      {/* Action Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Lọc hành động:</span>
        {['ALL', 'LOGIN', 'STAFF', 'PACKAGE', 'CLASS', 'CHECK_IN', 'BOOK_CLASS'].map(act => (
          <button
            key={act}
            onClick={() => setActionFilter(act)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-all ${actionFilter === act
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
          >
            {act === 'ALL' ? 'Tất cả' : act}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <Table
        columns={columns}
        data={filteredLogs}
        searchKey="details"
        searchPlaceholder="Tìm kiếm theo chi tiết thao tác..."
        emptyMessage="Không có nhật ký nào phù hợp với bộ lọc"
        pageSize={10}
      />
    </div>
  );
}
