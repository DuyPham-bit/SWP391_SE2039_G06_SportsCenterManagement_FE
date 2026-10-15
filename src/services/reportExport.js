function cell(value) {
  const text = String(value ?? '');
  // Spreadsheet programs must treat database labels as text, never as formulas.
  const safe = /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function createReportCsv(metrics, period) {
  const rows = [
    ['Chỉ tiêu', 'Giá trị', 'Kỳ'],
    ['Từ ngày', metrics.from, ''],
    ['Đến ngày', metrics.to, ''],
    ['Nhóm theo', metrics.groupBy, ''],
    ['Doanh thu thuần', metrics.monthlyRevenue, period],
    ['Tổng hội viên', metrics.totalMembers, period],
    ['Hội viên hoạt động', metrics.activeMembers, period],
    ['Hội viên mới trong kỳ', metrics.newMembers, period],
    ['Đăng ký lớp hiện tại', metrics.totalBookings, 'CURRENT'],
    ['Check-in hôm nay', metrics.todayCheckins, 'TODAY'],
    [], ['Kỳ', 'Doanh thu thuần'],
    ...(metrics.revenuePeriods || []).map(item => [item.periodStart, item.net]),
    [], ['Môn thể thao', 'Đã đặt', 'Sức chứa', 'Tỷ lệ (%)'],
    ...(metrics.utilizationBySport || []).map(item => [item.name, item.booked, item.capacity, item.percentage]),
    [], ['Kỳ', 'Hội viên mới'],
    ...(metrics.membershipPeriods || []).map(item => [item.periodStart, item.newMembers]),
    [], ['Trạng thái đăng ký hiện tại', 'Số lượng'],
    ...Object.entries(metrics.classStatusCounts || {}),
    [], ['Kỳ', 'Trạng thái đăng ký', 'Số lượng'],
    ...(metrics.classPeriods || []).flatMap(item => Object.entries(item.statusCounts || {}).map(([status, count]) => [item.periodStart, status, count]))
  ];
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}

export function createRevenueAnalyticsCsv(report) {
  const rows = [
    ['Báo cáo doanh thu theo thời gian'],
    ['Từ ngày', report.from],
    ['Đến ngày', report.to],
    ['Nhóm theo', report.groupBy],
    ['Doanh thu gộp', report.gross],
    ['Hoàn tiền', report.refunds],
    ['Doanh thu thuần', report.net],
    ['Giao dịch thành công', report.successfulPaymentCount],
    [], ['Kỳ', 'Doanh thu gộp', 'Hoàn tiền', 'Doanh thu thuần'],
    ...(report.periods || []).map(item => [item.periodStart, item.gross, item.refunds, item.net])
  ];

  const sections = [
    ['Sân/phòng tập', 'rooms', 'Lượt đặt'],
    ['Môn tập', 'sports', 'Lượt đặt'],
    ['Gói tập', 'packages', 'Giao dịch'],
    ['Huấn luyện viên', 'coaches', 'Lượt đặt'],
    ['Thành viên', 'members', 'Giao dịch']
  ];
  for (const [label, key, activityLabel] of sections) {
    rows.push([], [label], ['Tên', 'Mã', 'Doanh thu gộp', 'Hoàn tiền', 'Doanh thu thuần', activityLabel]);
    for (const item of report[key] || []) {
      rows.push([item.name, item.code, item.gross, item.refunds, item.net, item.activityCount]);
    }
  }

  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}
