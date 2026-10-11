function cell(value) {
  const text = String(value ?? '');
  // Spreadsheet programs must treat database labels as text, never as formulas.
  const safe = /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function createReportCsv(metrics, period) {
  const rows = [
    ['Chỉ tiêu', 'Giá trị', 'Kỳ'],
    ['Doanh thu thuần', metrics.monthlyRevenue, period],
    ['Tổng hội viên', metrics.totalMembers, period],
    ['Hội viên hoạt động', metrics.activeMembers, period],
    ['Lượt đặt lớp', metrics.totalBookings, period],
    ['Check-in hôm nay', metrics.todayCheckins, 'TODAY'],
    [], ['Ngày', 'Doanh thu thuần'],
    ...(metrics.revenuePeriods || []).map(item => [item.periodStart, item.net]),
    [], ['Môn thể thao', 'Đã đặt', 'Sức chứa', 'Tỷ lệ (%)'],
    ...(metrics.utilizationBySport || []).map(item => [item.name, item.booked, item.capacity, item.percentage])
  ];
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}
