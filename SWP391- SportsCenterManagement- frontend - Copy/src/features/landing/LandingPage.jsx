import { useAuth } from '../../context/AuthContext.js';
import { INITIAL_SPORTS } from '../../services/mockData.js';
import { FacilitiesSection, SCMS_FACILITIES } from './FacilitiesSection.js';

const { useState, useEffect } = React;

// Ánh xạ 15 môn thể thao tới 9 cụm sân tiêu chuẩn SCMS
export const SPORT_FACILITY_MAP = {
  'boi-loi': 'room-01',          // Bể bơi 4 mùa nước ấm 25m
  'bong-da': 'room-02',          // Sân bóng đá cỏ nhân tạo (Sân 5 & Sân 7)
  'cau-long': 'room-03',         // Cụm sân cầu lông thảm chống trượt
  'nhay-hien-dai': 'room-04',    // Phòng tập aerobic & vũ đạo trẻ trung
  'bong-ro': 'room-05',          // Sân bóng rổ tiêu chuẩn phong trào
  'tennis': 'room-06',           // Cụm sân tennis & pickleball phong trào
  'vo-thuat': 'room-07',         // Phòng tập võ thuật & thể lực tự vệ
  'gym-fitness': 'room-08',      // Phòng tập gym & thể hình tiện nghi
  'yoga-pilates': 'room-09',     // Phòng tập yoga & dưỡng sinh yên tĩnh
  'bong-chuyen': 'room-05',      // Sân bóng rổ & bóng chuyền đa năng
  'bong-ban': 'room-03',         // Cụm sân cầu lông & bóng bàn trong nhà
  'dien-kinh': 'room-02',        // Khu thể thao ngoài trời & đường chạy
  'ban-cung': 'room-06',         // Khu sân bãi thể thao ngoài trời
  'dap-xe': 'room-08',           // Phòng tập gym, cardio & spinning
  'leo-nui': 'room-07'           // Khu tập võ thuật & leo núi thể lực
};

export function LandingPage() {
  const { isAuthenticated, role } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedFacilityForModal, setSelectedFacilityForModal] = useState(null);
  const [activeNav, setActiveNav] = useState('trang-chu');

  const navItems = [
    { id: 'trang-chu', href: '#/', label: 'TRANG CHỦ', targetId: 'trang-chu' },
    { id: 've-chung-toi', href: '#ve-chung-toi', label: 'VỀ CHÚNG TÔI', targetId: 've-chung-toi' },
    { id: 'khoa-hoc', href: '#khoa-hoc', label: 'KHÓA HỌC (15 MÔN)', targetId: 'khoa-hoc' },
    { id: 'co-so-vat-chat', href: '#co-so-vat-chat', label: 'CƠ SỞ VẬT CHẤT', targetId: 'co-so-vat-chat' }
  ];

  const handleSportClick = (sport) => {
    const facilityId = SPORT_FACILITY_MAP[sport.id] || 'room-02';
    const facility = SCMS_FACILITIES.find(f => f.id === facilityId) || SCMS_FACILITIES[0];
    setSelectedFacilityForModal(facility);
  };

  const handleNavClick = (item, e) => {
    e.preventDefault();
    setActiveNav(item.id);
    window.location.hash = item.href;

    if (item.id === 'trang-chu') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(item.targetId);
      if (el) {
        const headerOffset = 80;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }
  };

  // ScrollSpy & Hash synchronization
  useEffect(() => {
    const sectionIds = ['trang-chu', 've-chung-toi', 'khoa-hoc', 'co-so-vat-chat'];

    const syncFromHash = () => {
      const raw = window.location.hash || '';
      const anchor = raw.replace(/^#\/?/, '').split('?')[0];
      if (anchor && sectionIds.includes(anchor)) {
        setActiveNav(anchor);
        const el = document.getElementById(anchor);
        if (el) {
          setTimeout(() => {
            const headerOffset = 80;
            const elementPosition = el.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
          }, 100);
        }
      } else if (!anchor || anchor === '/') {
        setActiveNav('trang-chu');
      }
    };

    syncFromHash();

    const handleScroll = () => {
      if (window.scrollY < 250) {
        setActiveNav('trang-chu');
        return;
      }

      const scrollPos = window.scrollY + 140;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el && scrollPos >= el.offsetTop) {
          setActiveNav(id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('hashchange', syncFromHash);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', syncFromHash);
    };
  }, []);

  const categories = ['Tất cả', 'Thể thao đối kháng', 'Bóng & Vợt', 'Sức bền & Tĩnh tâm'];

  const filteredSports = selectedCategory === 'Tất cả'
    ? INITIAL_SPORTS
    : INITIAL_SPORTS.filter(s => s.category === selectedCategory);

  const getDashboardLink = () => {
    switch (role) {
      case 'MANAGER': return '#/manager/dashboard';
      case 'RECEPTIONIST': return '#/receptionist/dashboard';
      case 'COACH': return '#/coach/dashboard';
      case 'MEMBER': return '#/member/dashboard';
      default: return '#/login';
    }
  };

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 font-inter antialiased">
      {/* LANDING HEADER */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="h-20 w-full max-w-[1280px] mx-auto px-4 md:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md font-chivo font-black text-xl">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-chivo text-xl font-extrabold uppercase tracking-tight text-slate-900 leading-none">
                SCMS
              </span>
              <span className="font-chivo text-[11px] tracking-widest text-red-600 uppercase font-bold leading-none mt-1">
                Sports Center
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 font-chivo text-xs uppercase tracking-wider">
            {navItems.map(item => {
              const isActive = activeNav === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(item, e)}
                  className={`pb-1 border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? 'text-red-600 border-red-600 font-extrabold'
                      : 'text-slate-600 hover:text-red-600 border-transparent font-bold'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Action / Auth Button */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <a
                href={getDashboardLink()}
                className="bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                <span>Vào Dashboard ({role})</span>
              </a>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href="#/login"
                  className="text-slate-700 hover:text-red-600 font-chivo text-xs font-bold uppercase px-3.5 py-2 transition-colors"
                >
                  ĐĂNG NHẬP
                </a>
                <a
                  href="#/register"
                  className="bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                >
                  <span>ĐĂNG KÝ</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="trang-chu" className="relative w-full min-h-[85vh] flex flex-col justify-center items-center text-center px-4 overflow-hidden pt-28 pb-16 bg-slate-950">
        {/* Background Image with Dark Olympic Scrim */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-40 scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop')"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/60" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 shadow-sm mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <span className="font-chivo text-xs uppercase tracking-widest text-white font-bold">
              TRUNG TÂM THỂ THAO ĐẲNG CẤP QUỐC TẾ SCMS
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-chivo text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-black tracking-tight leading-tight uppercase max-w-4xl mx-auto drop-shadow-md">
            SHAPING RESILIENCE THROUGH SPORTS
          </h1>

          {/* Subtext */}
          <p className="font-inter text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mt-6 leading-relaxed">
            Phát triển thể lực, tôi luyện ý chí và bứt phá mọi giới hạn cùng hệ thống 9 cụm sân và 15 bộ môn rèn luyện tiêu chuẩn Olympic.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto">
            <a
              href="#/register"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase px-8 py-4 rounded-lg shadow-lg hover:shadow-red-600/40 transition-all transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
            >
              <span>ĐĂNG KÝ HỘI VIÊN MỚI</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </a>
            <a
              href="#khoa-hoc"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-chivo text-xs font-bold uppercase px-8 py-4 rounded-lg border border-white/20 transition-all transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">sports_score</span>
              <span>KHÁM PHÁ 15 MÔN HỌC</span>
            </a>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-14 pt-8 w-full max-w-4xl bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex flex-col items-center">
              <span className="font-chivo text-3xl font-black text-red-500">100%</span>
              <span className="font-chivo text-xs text-slate-300 uppercase tracking-wider mt-1 font-bold">Chuẩn Thi Đấu</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-chivo text-3xl font-black text-red-500">24/7</span>
              <span className="font-chivo text-xs text-slate-300 uppercase tracking-wider mt-1 font-bold">Lọc Khí & Điều Hòa</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-chivo text-3xl font-black text-red-500">50+</span>
              <span className="font-chivo text-xs text-slate-300 uppercase tracking-wider mt-1 font-bold">Chuyên Gia Huấn Luyện</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-chivo text-3xl font-black text-red-500">5.0 ★</span>
              <span className="font-chivo text-xs text-slate-300 uppercase tracking-wider mt-1 font-bold">Đánh Giá Hội Viên</span>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT US SECTION */}
      <section className="w-full bg-white py-20 px-4 md:px-10" id="ve-chung-toi">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column (6 cols) */}
          <div className="lg:col-span-6 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-50 text-red-600 font-chivo text-xs uppercase tracking-widest font-bold mb-4 border border-red-200">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              TẠI SAO NÊN CHỌN SCMS
            </div>
            <h2 className="font-chivo text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Nền Tảng Vững Chắc Cho Hành Trình Chinh Phục Đỉnh Cao
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mt-5">
              SCMS tự hào là tổ hợp thể thao đa năng chuẩn quốc tế, mang đến không gian tập luyện chuyên nghiệp, đội ngũ huấn luyện viên chứng chỉ AFC & NASM cùng quy trình cá nhân hóa toàn diện cho từng học viên.
            </p>

            <div className="w-full space-y-4 mt-8">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
                </div>
                <div>
                  <h3 className="font-chivo text-sm font-bold text-slate-900">Huấn luyện viên đạt chuẩn quốc tế</h3>
                  <p className="text-xs text-slate-500 mt-1">100% đội ngũ huấn luyện sở hữu chứng chỉ AFC, FIBA, BWF hoặc NASM với kinh nghiệm đào tạo thực chiến.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">tune</span>
                </div>
                <div>
                  <h3 className="font-chivo text-sm font-bold text-slate-900">Giáo án cá nhân hóa theo từng thể trạng</h3>
                  <p className="text-xs text-slate-500 mt-1">Đo lường chỉ số InBody định kỳ, thiết lập biểu đồ vận động riêng biệt và AI Workout Recommender theo mục tiêu.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">local_fire_department</span>
                </div>
                <div>
                  <h3 className="font-chivo text-sm font-bold text-slate-900">Môi trường năng động và truyền cảm hứng</h3>
                  <p className="text-xs text-slate-500 mt-1">Cộng đồng hội viên văn minh, các giải đấu nội bộ định kỳ và hệ thống sân bãi đạt chuẩn thi đấu Olympic.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 4 Stat Cards (6 cols) */}
          <div className="lg:col-span-6 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Card 1 */}
              <div className="bg-red-600 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center text-center hover:-translate-y-1.5 transition-transform duration-300 justify-center min-h-[180px] relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 text-white/10 pointer-events-none">
                  <span className="material-symbols-outlined text-[100px]">stadium</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-[22px]">stadium</span>
                </div>
                <div className="font-chivo text-5xl font-black tracking-tight leading-none text-white">9</div>
                <div className="font-chivo text-base font-extrabold uppercase tracking-wide mt-2">SÂN TẬP</div>
                <div className="text-xs text-white/80 mt-1 font-medium">Tiêu chuẩn thi đấu chuyên nghiệp</div>
              </div>

              {/* Card 2 */}
              <div className="bg-red-600 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center text-center hover:-translate-y-1.5 transition-transform duration-300 justify-center min-h-[180px] relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 text-white/10 pointer-events-none">
                  <span className="material-symbols-outlined text-[100px]">sports_soccer</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-[22px]">sports_kabaddi</span>
                </div>
                <div className="font-chivo text-5xl font-black tracking-tight leading-none text-white">15</div>
                <div className="font-chivo text-base font-extrabold uppercase tracking-wide mt-2">MÔN THỂ THAO</div>
                <div className="text-xs text-white/80 mt-1 font-medium">Đa dạng lựa chọn cho mọi lứa tuổi</div>
              </div>

              {/* Card 3 */}
              <div className="bg-red-600 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center text-center hover:-translate-y-1.5 transition-transform duration-300 justify-center min-h-[180px] relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 text-white/10 pointer-events-none">
                  <span className="material-symbols-outlined text-[100px]">groups</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-[22px]">diversity_3</span>
                </div>
                <div className="font-chivo text-5xl font-black tracking-tight leading-none text-white">400+</div>
                <div className="font-chivo text-base font-extrabold uppercase tracking-wide mt-2">HỌC VIÊN</div>
                <div className="text-xs text-white/80 mt-1 font-medium">Thường xuyên rèn luyện mỗi ngày</div>
              </div>

              {/* Card 4 */}
              <div className="bg-red-600 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center text-center hover:-translate-y-1.5 transition-transform duration-300 justify-center min-h-[180px] relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 text-white/10 pointer-events-none">
                  <span className="material-symbols-outlined text-[100px]">aspect_ratio</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-[22px]">domain</span>
                </div>
                <div className="font-chivo text-3xl font-black tracking-tight leading-none text-white">13.000 m²</div>
                <div className="font-chivo text-base font-extrabold uppercase tracking-wide mt-2">DIỆN TÍCH</div>
                <div className="text-xs text-white/80 mt-1 font-medium">Tổ hợp liên hợp khép kín hiện đại</div>
              </div>
            </div>

            {/* Extra Trust Strip */}
            <div className="mt-6 p-4 rounded-xl bg-slate-100 flex items-center justify-between gap-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-600 text-[28px]">verified_user</span>
                <div>
                  <div className="font-chivo text-xs font-bold text-slate-900">Bảo hiểm rèn luyện toàn diện</div>
                  <div className="text-xs text-slate-500">Tất cả hội viên được trang bị y tế sơ cấp cứu tại sân 24/7</div>
                </div>
              </div>
              <span className="font-chivo text-xs font-bold text-red-600 px-3 py-1 bg-white rounded shadow-sm shrink-0 border border-slate-200">
                ISO 9001
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 15 COURSES SECTION */}
      <section className="w-full bg-slate-900 py-20 px-4 md:px-10 text-white" id="khoa-hoc">
        <div className="max-w-[1280px] mx-auto flex flex-col items-center">
          {/* Section Header */}
          <div className="text-center max-w-3xl mb-10">
            <span className="font-chivo text-xs uppercase tracking-widest text-red-400 font-bold px-4 py-1.5 rounded-full bg-white/10 inline-block mb-3 border border-white/10">
              CHƯƠNG TRÌNH ĐÀO TẠO CHUYÊN NGHIỆP
            </span>
            <h2 className="font-chivo text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-wide">
              15 KHÓA HỌC THỂ THAO ĐA NĂNG
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-3">
              Thiết kế đa dạng từ nền tảng đến chuyên sâu thi đấu, đáp ứng mọi nhu cầu rèn luyện thể chất của học viên nhí, thanh thiếu niên và người trưởng thành.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-chivo text-xs font-bold uppercase tracking-wider transition-all ${selectedCategory === cat
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid of 15 Courses + 1 CTA Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
            {filteredSports.map(sport => (
              <div
                key={sport.id}
                onClick={() => handleSportClick(sport)}
                className="bg-white text-slate-900 p-6 rounded-xl shadow-md hover:shadow-xl hover:bg-slate-50 transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[160px] group cursor-pointer border border-slate-100 hover:border-red-400 transform hover:-translate-y-1 relative overflow-hidden"
                title={`Bấm để xem thông tin sân tập ${sport.venue} & đăng ký trải nghiệm`}
              >
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all shadow-xs">
                  <span className="material-symbols-outlined text-[28px]">{sport.icon}</span>
                </div>
                <span className="font-chivo text-base font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                  {sport.name}
                </span>
                <span className="text-xs text-slate-500 font-medium mt-1">
                  {sport.venue}
                </span>
                <span className="text-[11px] text-red-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex items-center gap-0.5">
                  <span>Xem thông tin sân</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            ))}

            {/* CTA 16th Card */}
            <div
              onClick={() => {
                const el = document.getElementById('co-so-vat-chat');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-red-600 text-white p-6 rounded-xl shadow-lg hover:bg-red-700 transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[160px] group cursor-pointer hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-full bg-white text-red-600 flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform shadow-md">
                <span className="material-symbols-outlined text-[28px]">stadium</span>
              </div>
              <span className="font-chivo text-base font-black uppercase text-white leading-tight">
                Đặt Thuê Cụm Sân
              </span>
              <span className="text-xs text-white/90 mt-1 font-semibold flex items-center gap-1">
                Xem 9 cụm sân &amp; đặt chỗ ngay <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FACILITIES SECTION FROM FONTMAU */}
      <FacilitiesSection
        externalFacility={selectedFacilityForModal}
        onModalClose={() => setSelectedFacilityForModal(null)}
      />

      {/* MEMBERSHIP CALLOUT BANNER */}
      <section className="w-full bg-slate-100 py-16 px-4 md:px-10" id="uu-dai">
        <div className="max-w-[1280px] mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8 border border-slate-200">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-red-600 font-chivo text-xs uppercase tracking-wider font-bold mb-2">
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              ƯU ĐÃI THÀNH VIÊN MỚI 2026
            </div>
            <h3 className="font-chivo text-2xl sm:text-3xl font-extrabold text-slate-900">
              Trải nghiệm toàn bộ 15 bộ môn với gói All-Access Pass
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Giảm ngay 20% cho học viên đăng ký theo nhóm từ 3 người. Miễn phí kiểm tra thể lực chuyên sâu InBody và định lượng cơ xương khớp cùng huấn luyện viên trưởng SCMS.
            </p>
          </div>
          <div className="shrink-0">
            <a
              href="#/register"
              className="bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase px-8 py-4 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span>NHẬN ƯU ĐÃI NGAY</span>
              <span className="material-symbols-outlined text-[20px]">card_membership</span>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full bg-slate-950 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-chivo font-black">
                  S
                </div>
                <span className="font-chivo text-lg font-black uppercase text-white">SCMS Sports</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400 mb-4">
                Trung tâm huấn luyện thể thao phức hợp công nghệ cao hàng đầu, cung cấp môi trường tập luyện chuẩn thi đấu Olympic cho các vận động viên và hội viên phong trào.
              </p>
            </div>

            <div>
              <h4 className="font-chivo text-xs uppercase tracking-wider text-white mb-4 font-bold">
                Thông Tin Liên Hệ
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-red-500 text-[18px] shrink-0">location_on</span>
                  <span>Khu công nghệ cao, Thủ Đức, TP. Hồ Chí Minh</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-[18px] shrink-0">call</span>
                  <span>Phone: 0859859367</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-[18px] shrink-0">mail</span>
                  <span>lienhe@scmsportscenter.vn</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-chivo text-xs uppercase tracking-wider text-white mb-4 font-bold">
                Thời Gian Hoạt Động
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="flex justify-between py-1 border-b border-slate-800">
                  <span>Thứ Hai - Thứ Sáu:</span>
                  <span className="font-bold text-white">05:30 - 22:30</span>
                </li>
                <li className="flex justify-between py-1 border-b border-slate-800">
                  <span>Thứ Bảy - Chủ Nhật:</span>
                  <span className="font-bold text-white">06:00 - 22:00</span>
                </li>
                <li className="flex justify-between py-1">
                  <span>Ngày Lễ:</span>
                  <span className="font-bold text-red-500">Mở cửa linh hoạt</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-chivo text-xs uppercase tracking-wider text-white mb-4 font-bold">
                Cơ Sở & Tiện Ích
              </h4>
              <ul className="space-y-1.5 text-xs">
                <li>• Bể bơi 4 mùa nước ấm 25m</li>
                <li>• Sân bóng đá cỏ nhân tạo tiêu chuẩn</li>
                <li>• Cụm sân cầu lông thảm chống trượt</li>
                <li>• Khu tập Gym &amp; thể hình tiện nghi</li>
                <li>• Phòng Yoga &amp; vũ đạo thoáng mát</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <p>© 2026 SCMS Sports Center. Bản quyền thuộc về Trung tâm Thể thao SCMS.</p>
            <div className="flex flex-wrap items-center gap-6">
              <a href="#/login" className="hover:text-white">Đăng nhập Quản trị</a>
              <a href="#/login" className="hover:text-white">Cổng Lễ tân</a>
              <a href="#/login" className="hover:text-white">Cổng Huấn luyện viên</a>
              <a href="#/login" className="hover:text-white">Cổng Hội viên</a>
              <a href="#/register" className="text-red-400 hover:text-red-300 font-bold">Đăng ký Hội viên mới</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
