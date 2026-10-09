import { receptionApi } from '../../services/api.js';
import { Badge } from '../../components/common/StatCard.jsx';

const { useState, useEffect } = React;

export function MemberLookup() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Auto-search if query parameter exists in URL
  useEffect(() => {
    const hash = window.location.hash || '';
    const match = hash.match(/[?&]query=([^&]+)/);
    if (match && match[1]) {
      const q = decodeURIComponent(match[1]);
      setQuery(q);
      executeSearch(q);
    }
  }, []);

  const executeSearch = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchError('Nhập ít nhất 2 ký tự để tìm hội viên.');
      return;
    }
    setSearching(true);
    setSearchError('');
    try {
      const data = await receptionApi.lookupMember(searchTerm.trim());
      setResults(data);
      setHasSearched(true);
      if (data.length === 1) {
        setSelectedMember(data[0]);
      } else {
        setSelectedMember(null);
      }
    } catch (error) {
      setResults([]);
      setSelectedMember(null);
      setHasSearched(true);
      setSearchError(error.message || 'Không thể tra cứu hội viên.');
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    executeSearch(query);
  };

  // Load subscriptions whenever selectedMember changes
  useEffect(() => {
    if (!selectedMember?.id) {
      setSubscriptions([]);
      return;
    }

    let isMounted = true;
    setLoadingSubs(true);
    receptionApi.getMemberSubscriptions(selectedMember.id)
      .then(data => {
        if (isMounted) {
          const list = Array.isArray(data) ? data : (data?.items || []);
          setSubscriptions(list);
        }
      })
      .catch(() => {
        if (isMounted) setSubscriptions([]);
      })
      .finally(() => {
        if (isMounted) setLoadingSubs(false);
      });

    return () => { isMounted = false; };
  }, [selectedMember?.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
          LOOKUP MEMBER PROFILE
        </span>
        <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
          Tra Cứu Hồ Sơ Hội Viên Tại Quầy
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Nhập mã thẻ hội viên, số điện thoại hoặc email để kiểm tra tình trạng thẻ và gói tập đã gia hạn.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="max-w-2xl bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400">
            search
          </span>
          <input
            type="text"
            placeholder="Nhập mã thẻ (MEM-8899), Số điện thoại (0912...), Email hoặc Họ tên..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-0 text-slate-900 font-medium"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-colors shrink-0"
        >
          {searching ? 'Đang tra cứu...' : 'Tra Cứu'}
        </button>
      </form>

      {searchError && <p role="alert" className="text-sm text-red-700">{searchError}</p>}

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-6">
          {results.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 max-w-xl mx-auto">
              <span className="material-symbols-outlined text-5xl text-slate-300">person_off</span>
              <h3 className="font-chivo text-base font-bold text-slate-900 mt-2">
                Không Tìm Thấy Hội Viên
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Không có dữ liệu trùng khớp với từ khóa "{query}". Vui lòng kiểm tra lại số điện thoại hoặc mã thẻ.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Member list column if multiple */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Kết quả tìm kiếm ({results.length})
                </span>
                {results.map(member => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedMember?.id === member.id
                        ? 'bg-red-50/50 border-red-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">{member.fullName}</div>
                        <div className="text-[11px] text-red-600 font-semibold">{member.memberCode}</div>
                        <div className="text-[10px] text-slate-400">{member.phone}</div>
                      </div>
                      <Badge variant={member.packageStatus} size="sm">{member.packageStatus}</Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detail Profile Card (2 cols) */}
              {selectedMember && (
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                  <div className="flex items-start justify-between pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedMember.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                        alt=""
                        className="w-16 h-16 rounded-full object-cover border-2 border-red-600 shadow"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-chivo text-xl font-black text-slate-900">{selectedMember.fullName}</h2>
                          <Badge variant={selectedMember.status}>{selectedMember.status}</Badge>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{selectedMember.email} • {selectedMember.phone}</div>
                        <div className="text-xs font-bold text-red-600 mt-1">Mã Thẻ SCMS: {selectedMember.memberCode}</div>
                      </div>
                    </div>

                    <Badge variant={selectedMember.packageStatus} size="md">
                      {selectedMember.packageStatus === 'ACTIVE' ? 'ĐÃ GIA HẠN / ACTIVE' : selectedMember.packageStatus}
                    </Badge>
                  </div>

                  {/* Membership Card Information */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-chivo text-xs uppercase tracking-widest text-red-400 font-bold">
                        THẺ TẬP HỘI VIÊN SCMS OLYMPIC
                      </span>
                      <span className="material-symbols-outlined text-white/50 text-[28px]">sports_kabaddi</span>
                    </div>

                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-slate-400">Gói Đang Sở Hữu</div>
                      <div className="font-chivo text-xl font-black text-white mt-0.5">
                        {selectedMember.packageName || 'Chưa đăng ký gói'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Hạn Sử Dụng</span>
                        <span className="font-bold text-white text-sm">{selectedMember.packageExpiry || 'Không khả dụng'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Trạng Thái Thẻ</span>
                        {selectedMember.packageStatus === 'ACTIVE' ? (
                          <span className="font-bold text-sm text-emerald-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">verified</span>
                            Hợp lệ - Đã gia hạn / Cho phép vào sân
                          </span>
                        ) : selectedMember.packageStatus === 'PENDING' ? (
                          <span className="font-bold text-sm text-amber-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            Chờ thanh toán kích hoạt
                          </span>
                        ) : (
                          <span className="font-bold text-sm text-red-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">error</span>
                            Hết hạn - Cần gia hạn
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Subscriptions History Table */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-chivo text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">history</span>
                        <span>Lịch Sử Gói Tập & Gia Hạn ({subscriptions.length})</span>
                      </h3>
                    </div>

                    {loadingSubs ? (
                      <div className="p-4 text-center text-xs text-slate-400">Đang tải lịch sử gói tập...</div>
                    ) : subscriptions.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                        Hội viên chưa có lịch sử đăng ký gói tập nào.
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">Gói Tập</th>
                              <th className="py-2.5 px-3">Thời Hạn</th>
                              <th className="py-2.5 px-3">Hạn Đến</th>
                              <th className="py-2.5 px-3">Giá Tiền</th>
                              <th className="py-2.5 px-3">Trạng Thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {subscriptions.map(sub => (
                              <tr key={sub.subscriptionId} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 font-semibold text-slate-900">{sub.packageName}</td>
                                <td className="py-2 px-3 text-slate-600">
                                  {sub.startDate ? `${sub.startDate} → ${sub.endDate}` : `${sub.durationDays} ngày`}
                                </td>
                                <td className="py-2 px-3 font-medium text-slate-700">
                                  {sub.endDate || '—'}
                                </td>
                                <td className="py-2 px-3 font-mono font-bold text-red-600">
                                  {sub.price?.toLocaleString()}đ
                                </td>
                                <td className="py-2 px-3">
                                  <Badge variant={sub.status} size="sm">{sub.status}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Action Shortcuts for Receptionist */}
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                    <a
                      href={`#/receptionist/counter-register?query=${encodeURIComponent(selectedMember.memberCode || selectedMember.phone || '')}`}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
                      <span>Gia Hạn Gói Tại Quầy</span>
                    </a>

                    <a
                      href={`#/receptionist/check-in?query=${encodeURIComponent(selectedMember.memberCode || selectedMember.phone || '')}`}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                      <span>Check-in Ngay</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
