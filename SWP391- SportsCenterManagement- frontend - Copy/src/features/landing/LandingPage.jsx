import { useAuth } from '../../context/AuthContext.js';
import { SUPPORTED_SPORTS } from '../../services/sportsCatalog.js';
import { FacilitiesSection, SCMS_FACILITIES } from './FacilitiesSection.js';

const { useState, useEffect, useRef } = React;

// Danh mục trang chủ và cơ sở tập luyện tương ứng cho từng môn.
export const LANDING_SPORTS = SUPPORTED_SPORTS.map(sport => ({
  ...sport,
  venue: SCMS_FACILITIES.find(facility => facility.id === sport.facilityId).name
}));

export const SPORT_FACILITY_MAP = Object.fromEntries(
  LANDING_SPORTS.map(sport => [sport.id, sport.facilityId])
);

// Component đếm số nhảy động khi mới lướt trúng (chỉ nhảy 1 lần duy nhất khi F5 hay mới vào trang)
export function AnimatedNumber({ value, duration = 1400, suffix = '', prefix = '', formatThousands = false }) {
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Nếu đã nhảy rồi thì giữ nguyên giá trị đích
    if (hasAnimatedRef.current) {
      setDisplayValue(value);
      return;
    }

    // Fallback cho môi trường không có IntersectionObserver
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setDisplayValue(value);
      hasAnimatedRef.current = true;
      return;
    }

    let animationFrameId = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Chỉ kích hoạt khi lướt trúng lần đầu tiên
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            hasAnimatedRef.current = true;
            observer.disconnect(); // Ngắt observer ngay để không bao giờ reset hay nhảy lại khi cuộn lên/xuống

            let startTime = null;

            const animate = (currentTime) => {
              if (!startTime) startTime = currentTime;
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);

              // Ease Out Cubic: 1 - (1 - progress)^3 giúp số nhảy mượt dần về đích
              const easeOut = 1 - Math.pow(1 - progress, 3);
              const currentVal = Math.round(easeOut * value);
              setDisplayValue(currentVal);

              if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
              } else {
                setDisplayValue(value);
              }
            };

            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(animate);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  const formatted = formatThousands
    ? displayValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    : displayValue;

  return (
    <span ref={elementRef} className="tabular-nums inline-block">
      {prefix}{formatted}{suffix}
    </span>
  );
}

export function LandingPage() {
  const { isAuthenticated, role, logout } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedFacilityForModal, setSelectedFacilityForModal] = useState(null);
  const [activeNav, setActiveNav] = useState('trang-chu');
  const [isCoursesDropdownOpen, setIsCoursesDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCoursesOpen, setIsMobileCoursesOpen] = useState(false);
  const [highlightedSportId, setHighlightedSportId] = useState(null);
  const [selectedSportFromMenu, setSelectedSportFromMenu] = useState('all');
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const videoRef = useRef(null);
  const coursesDropdownRef = useRef(null);
  const closeTimerRef = useRef(null);

  const leftSports = [
    { id: 'all', name: 'Tất cả' },
    { id: 'bong-ban', name: 'Bóng bàn' },
    { id: 'bong-da', name: 'Bóng đá' },
    { id: 'bong-ro', name: 'Bóng rổ' },
    { id: 'boi-loi', name: 'Bơi lội' },
  ];

  const rightSports = [
    { id: 'cau-long', name: 'Cầu lông' },
    { id: 'gym-fitness', name: 'Gym & Fitness' },
    { id: 'pickleball', name: 'Pickleball' },
    { id: 'vo-thuat', name: 'Võ thuật & Boxing' },
    { id: 'yoga-pilates', name: 'Yoga & Pilates' },
  ];

  const navItems = [
    { id: 'trang-chu', href: '#/', label: 'TRANG CHỦ', targetId: 'trang-chu' },
    { id: 've-chung-toi', href: '#ve-chung-toi', label: 'VỀ CHÚNG TÔI', targetId: 've-chung-toi' },
    { id: 'khoa-hoc', href: '#khoa-hoc', label: 'KHÓA HỌC', targetId: 'khoa-hoc' },
    { id: 'co-so-vat-chat', href: '#co-so-vat-chat', label: 'CƠ SỞ VẬT CHẤT', targetId: 'co-so-vat-chat' }
  ];

  const handleSportClick = (sport) => {
    const facility = SCMS_FACILITIES.find(f => f.id === SPORT_FACILITY_MAP[sport.id]);
    if (facility) setSelectedFacilityForModal(facility);
  };

  const handleCoursesMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsCoursesDropdownOpen(true);
  };

  const handleCoursesMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsCoursesDropdownOpen(false);
    }, 220);
  };

  const toggleCoursesDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCoursesDropdownOpen(prev => !prev);
  };

  const handleSelectMenuItem = (item) => {
    setIsCoursesDropdownOpen(false);
    setIsMobileMenuOpen(false);
    setActiveNav('khoa-hoc');
    setSelectedSportFromMenu(item.id);

    if (item.id === 'all') {
      setSelectedCategory('Tất cả');
      setHighlightedSportId(null);
      const sectionEl = document.getElementById('khoa-hoc');
      if (sectionEl) {
        const headerOffset = 80;
        const elementPosition = sectionEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
      return;
    }

    const sport = LANDING_SPORTS.find(s => s.id === item.id);
    if (sport) {
      setSelectedCategory('Tất cả');
      setHighlightedSportId(sport.id);

      const targetEl = document.getElementById(`sport-card-${sport.id}`) || document.getElementById('khoa-hoc');
      if (targetEl) {
        const headerOffset = 80;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }

      const facility = SCMS_FACILITIES.find(f => f.id === SPORT_FACILITY_MAP[sport.id]);
      if (facility) {
        setTimeout(() => {
          setSelectedFacilityForModal(facility);
        }, 350);
      }

      setTimeout(() => {
        setHighlightedSportId(null);
      }, 4500);
    }
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

  // Close dropdown on outside click or ESC key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (coursesDropdownRef.current && !coursesDropdownRef.current.contains(e.target)) {
        setIsCoursesDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsCoursesDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

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
    ? LANDING_SPORTS
    : LANDING_SPORTS.filter(s => s.category === selectedCategory);

  const getDashboardLink = () => {
    const normalized = String(role || '').toUpperCase();
    switch (normalized) {
      case 'SYSTEMADMIN':
      case 'ADMIN':
      case 'MANAGER': return '#/manager/dashboard';
      case 'RECEPTIONIST': return '#/receptionist/dashboard';
      case 'COACH': return '#/coach/dashboard';
      case 'MEMBER': return '#/member/dashboard';
      default: return '#/login';
    }
  };

  return (
    <div className="landing-page-root w-full min-h-screen bg-white text-slate-900 font-inter antialiased">
      {/* LANDING HEADER */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="h-20 w-full max-w-[1720px] mx-auto px-6 sm:px-10 md:px-14 lg:px-20 flex items-center justify-between">
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

              if (item.id === 'khoa-hoc') {
                return (
                  <div
                    key={item.id}
                    ref={coursesDropdownRef}
                    className="relative"
                    onMouseEnter={handleCoursesMouseEnter}
                    onMouseLeave={handleCoursesMouseLeave}
                  >
                    <button
                      type="button"
                      onClick={toggleCoursesDropdown}
                      className={`font-chivo text-xs uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1 focus:outline-none ${
                        isCoursesDropdownOpen
                          ? 'bg-red-600 text-white font-extrabold px-4 py-2.5 rounded-none shadow-sm'
                          : isActive
                            ? 'text-red-600 border-b-2 border-red-600 font-extrabold pb-1'
                            : 'text-slate-700 hover:text-red-600 border-transparent font-bold pb-1'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="material-symbols-outlined text-[16px] leading-none">
                        {isCoursesDropdownOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                      </span>
                    </button>

                    {/* Simple 2-column Dropdown Menu matching user request */}
                    {isCoursesDropdownOpen && (
                      <div className="absolute top-full left-0 z-50 animate-in fade-in duration-150">
                        <div className="w-[280px] bg-white rounded-none shadow-2xl border border-slate-200 p-5">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                            {/* Left Column */}
                            <div className="flex flex-col space-y-3.5">
                              {leftSports.map(sportItem => {
                                const isSelected = selectedSportFromMenu === sportItem.id;
                                return (
                                  <button
                                    key={sportItem.id}
                                    type="button"
                                    onClick={() => handleSelectMenuItem(sportItem)}
                                    className={`text-left text-[14px] leading-snug transition-colors cursor-pointer ${
                                      isSelected
                                        ? 'text-red-600 font-semibold'
                                        : 'text-slate-800 hover:text-red-600 font-medium'
                                    }`}
                                  >
                                    {sportItem.name}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Right Column */}
                            <div className="flex flex-col space-y-3.5">
                              {rightSports.map(sportItem => {
                                const isSelected = selectedSportFromMenu === sportItem.id;
                                return (
                                  <button
                                    key={sportItem.id}
                                    type="button"
                                    onClick={() => handleSelectMenuItem(sportItem)}
                                    className={`text-left text-[14px] leading-snug transition-colors cursor-pointer ${
                                      isSelected
                                        ? 'text-red-600 font-semibold'
                                        : 'text-slate-800 hover:text-red-600 font-medium'
                                    }`}
                                  >
                                    {sportItem.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

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
              <div className="flex items-center gap-2">
                <a
                  href={getDashboardLink()}
                  className="bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase px-4 sm:px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                  <span>Vào Dashboard ({role})</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    window.location.hash = '#/login';
                  }}
                  className="border border-slate-300 hover:border-red-600 hover:bg-red-50 hover:text-red-600 text-slate-700 font-chivo text-xs font-bold uppercase px-3.5 py-2.5 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Đăng xuất tài khoản"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
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

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-[24px]">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed top-20 left-0 right-0 bg-white border-b border-slate-200 px-4 py-5 shadow-2xl max-h-[calc(100vh-80px)] overflow-y-auto z-50">
            <div className="flex flex-col space-y-1">
              <a
                href="#/"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  handleNavClick(navItems[0], e);
                }}
                className={`px-3 py-2.5 rounded-lg font-chivo text-xs uppercase tracking-wider font-bold ${
                  activeNav === 'trang-chu' ? 'bg-red-50 text-red-600' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                TRANG CHỦ
              </a>

              <a
                href="#ve-chung-toi"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  handleNavClick(navItems[1], e);
                }}
                className={`px-3 py-2.5 rounded-lg font-chivo text-xs uppercase tracking-wider font-bold ${
                  activeNav === 've-chung-toi' ? 'bg-red-50 text-red-600' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                VỀ CHÚNG TÔI
              </a>

              {/* Mobile Courses Accordion */}
              <div className="rounded-none overflow-hidden border border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMobileCoursesOpen(!isMobileCoursesOpen)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 font-chivo text-xs uppercase tracking-wider font-bold ${
                    activeNav === 'khoa-hoc' || isMobileCoursesOpen ? 'bg-red-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>KHÓA HỌC</span>
                  <span className="material-symbols-outlined text-[18px]">
                    {isMobileCoursesOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                  </span>
                </button>

                {isMobileCoursesOpen && (
                  <div className="bg-white p-4 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div className="flex flex-col space-y-3">
                        {leftSports.map(sportItem => (
                          <button
                            key={sportItem.id}
                            type="button"
                            onClick={() => handleSelectMenuItem(sportItem)}
                            className={`text-left text-sm transition-colors ${
                              selectedSportFromMenu === sportItem.id
                                ? 'text-red-600 font-semibold'
                                : 'text-slate-800 hover:text-red-600 font-medium'
                            }`}
                          >
                            {sportItem.name}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-col space-y-3">
                        {rightSports.map(sportItem => (
                          <button
                            key={sportItem.id}
                            type="button"
                            onClick={() => handleSelectMenuItem(sportItem)}
                            className={`text-left text-sm transition-colors ${
                              selectedSportFromMenu === sportItem.id
                                ? 'text-red-600 font-semibold'
                                : 'text-slate-800 hover:text-red-600 font-medium'
                            }`}
                          >
                            {sportItem.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <a
                href="#co-so-vat-chat"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  handleNavClick(navItems[3], e);
                }}
                className={`px-3 py-2.5 rounded-lg font-chivo text-xs uppercase tracking-wider font-bold ${
                  activeNav === 'co-so-vat-chat' ? 'bg-red-50 text-red-600' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                CƠ SỞ VẬT CHẤT
              </a>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <a
                    href={getDashboardLink()}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full bg-red-600 text-white font-chivo text-xs font-bold uppercase py-2.5 rounded-lg text-center shadow-md flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                    <span>Vào Dashboard ({role})</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                      window.location.hash = '#/login';
                    }}
                    className="w-full text-center py-2 text-slate-700 hover:text-red-600 font-chivo text-xs font-bold uppercase border border-slate-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>Đăng xuất tài khoản</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <a
                    href="#/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-slate-700 font-chivo text-xs font-bold uppercase border border-slate-300 rounded-lg"
                  >
                    ĐĂNG NHẬP
                  </a>
                  <a
                    href="#/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 bg-red-600 text-white font-chivo text-xs font-bold uppercase rounded-lg shadow-md"
                  >
                    ĐĂNG KÝ HỘI VIÊN MỚI
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION - FULL 1 PAGE WEB VIEWPORT */}
      <section
        id="trang-chu"
        className="relative w-full min-h-screen flex flex-col justify-between items-center text-center px-4 overflow-hidden pt-24 pb-6 bg-slate-950"
      >
        {/* Background Video with Cinematic Dark Scrim */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover scale-105"
            poster="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop"
          >
            <source src="./hero-video.mp4" type="video/mp4" />
          </video>
          {/* Olympic Scrim Overlay: ensures sharp readability of headings, badges, and stats */}
          <div className="absolute inset-0 bg-slate-950/65" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/70" />
        </div>

        {/* Top spacer for vertical balance with fixed header */}
        <div className="w-full h-4 pointer-events-none shrink-0" />

        {/* Main Hero Content (Centered vertically) */}
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center my-auto py-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/15 shadow-sm mb-6">
            <span className="w-2.5 h-2.5 bg-red-600 animate-pulse" />
            <span className="font-chivo text-xs uppercase tracking-widest text-white font-bold">
              TRUNG TÂM THỂ THAO ĐẲNG CẤP QUỐC TẾ SCMS
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-chivo text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-black tracking-tight leading-tight uppercase max-w-4xl mx-auto drop-shadow-md">
            SHAPING RESILIENCE THROUGH SPORTS
          </h1>

          {/* Subtext */}
          <p className="font-inter text-base sm:text-lg text-slate-200 max-w-2xl mx-auto mt-6 leading-relaxed">
            Phát triển thể lực, tôi luyện ý chí và bứt phá mọi giới hạn cùng hệ thống {SCMS_FACILITIES.length} cụm sân, phòng tập phục vụ {LANDING_SPORTS.length} bộ môn thể thao.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto">
            <a
              href="#/register"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase px-8 py-4 shadow-lg hover:shadow-red-600/40 transition-all transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
            >
              <span>ĐĂNG KÝ HỘI VIÊN MỚI</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </a>
            <a
              href="#khoa-hoc"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-chivo text-xs font-bold uppercase px-8 py-4 border border-white/20 transition-all transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">sports_score</span>
              <span>KHÁM PHÁ {LANDING_SPORTS.length} MÔN HỌC</span>
            </a>
          </div>
        </div>

        {/* Quick Metrics Strip & Scroll Indicator Anchored at Bottom of 1st Page */}
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full bg-white/5 backdrop-blur-md p-6 border border-white/10 shadow-xl">
            <div className="flex flex-col items-center">
              <span className="font-chivo text-3xl font-black text-red-500">100%</span>
              <span className="font-chivo text-xs text-slate-300 uppercase tracking-wider mt-1 font-bold">Chuẩn Thi Đấu</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-chivo text-3xl font-black text-red-500">24/7</span>
              <span className="font-chivo text-xs text-slate-300 uppercase tracking-wider mt-1 font-bold">Lọc Khí &amp; Điều Hòa</span>
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

          {/* Subtle scroll down indicator */}
          <a
            href="#ve-chung-toi"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-xs font-chivo tracking-widest uppercase mt-3 transition-colors animate-bounce"
          >
            <span>Cuộn xuống khám phá</span>
            <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
          </a>
        </div>

        {/* Sound Toggle Button (Bottom-Right of Hero) */}
        <button
          type="button"
          onClick={() => {
            if (videoRef.current) {
              const nextMuted = !videoRef.current.muted;
              videoRef.current.muted = nextMuted;
              setIsVideoMuted(nextMuted);
            }
          }}
          aria-label={isVideoMuted ? 'Bật âm thanh video' : 'Tắt âm thanh video'}
          className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-3 py-1.5 bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs font-chivo font-bold tracking-wider transition-all cursor-pointer shadow-lg"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isVideoMuted ? 'volume_off' : 'volume_up'}
          </span>
          <span className="hidden sm:inline">
            {isVideoMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          </span>
        </button>
      </section>

      {/* ABOUT US SECTION - FULL 1 PAGE VIEWPORT */}
      <section className="w-full bg-white min-h-screen flex items-center justify-center py-24 px-6 sm:px-10 md:px-14 lg:px-20" id="ve-chung-toi">
        <div className="w-full max-w-[1720px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-center">
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
                <div className="font-chivo text-5xl font-black tracking-tight leading-none text-white">
                  <AnimatedNumber value={SCMS_FACILITIES.length} duration={1000} />
                </div>
                <div className="font-chivo text-base font-extrabold uppercase tracking-wide mt-2">CỤM SÂN &amp; PHÒNG TẬP</div>
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
                <div className="font-chivo text-5xl font-black tracking-tight leading-none text-white">
                  <AnimatedNumber value={LANDING_SPORTS.length} duration={1000} />
                </div>
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
                <div className="font-chivo text-5xl font-black tracking-tight leading-none text-white">
                  <AnimatedNumber value={400} duration={1400} suffix="+" />
                </div>
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
                <div className="font-chivo text-4xl sm:text-5xl font-black tracking-tight leading-none text-white whitespace-nowrap">
                  <AnimatedNumber value={13000} duration={1600} suffix=" m²" formatThousands={true} />
                </div>
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

      {/* COURSES SECTION - FULL 1 PAGE VIEWPORT */}
      <section className="w-full bg-slate-900 min-h-screen flex flex-col justify-center py-24 px-6 sm:px-10 md:px-14 lg:px-20 text-white" id="khoa-hoc">
        <div className="w-full max-w-[1720px] mx-auto flex flex-col items-center">
          {/* Section Header */}
          <div className="text-center max-w-3xl mb-10">
            <span className="font-chivo text-xs uppercase tracking-widest text-red-400 font-bold px-4 py-1.5 rounded-full bg-white/10 inline-block mb-3 border border-white/10">
              CHƯƠNG TRÌNH ĐÀO TẠO CHUYÊN NGHIỆP
            </span>
            <h2 className="font-chivo text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-wide">
              {LANDING_SPORTS.length} KHÓA HỌC THỂ THAO ĐA NĂNG
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

          {/* Courses and facility booking CTA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 xl:gap-6 w-full">
            {filteredSports.map(sport => {
              const isHighlighted = highlightedSportId === sport.id;
              return (
                <div
                  key={sport.id}
                  id={`sport-card-${sport.id}`}
                  onClick={() => handleSportClick(sport)}
                  className={`bg-white text-slate-900 p-5 rounded-none shadow-md hover:shadow-xl hover:bg-slate-50 transition-all duration-300 flex flex-col items-center justify-center text-center aspect-square group cursor-pointer border transform hover:-translate-y-1 relative overflow-hidden ${
                    isHighlighted
                      ? 'border-red-600 ring-4 ring-red-500/50 shadow-2xl shadow-red-500/30 scale-105 z-10'
                      : 'border-slate-100 hover:border-red-400'
                  }`}
                  title={`Bấm để xem thông tin sân tập ${sport.venue} & đăng ký trải nghiệm`}
                >
                  {isHighlighted && (
                    <span className="absolute top-2.5 right-2.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
                    </span>
                  )}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all shadow-xs ${
                    isHighlighted
                      ? 'bg-red-600 text-white scale-110 shadow-md'
                      : 'bg-red-100 text-red-600 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white'
                  }`}>
                    <span className="material-symbols-outlined text-[28px]">{sport.icon}</span>
                  </div>
                  <span className={`font-chivo text-base font-bold transition-colors ${
                    isHighlighted ? 'text-red-600' : 'text-slate-900 group-hover:text-red-600'
                  }`}>
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
              );
            })}

            {/* Facility booking CTA */}
            <div
              onClick={() => {
                const el = document.getElementById('co-so-vat-chat');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-red-600 text-white p-5 rounded-none shadow-lg hover:bg-red-700 transition-all duration-300 flex flex-col items-center justify-center text-center aspect-square group cursor-pointer hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-full bg-white text-red-600 flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform shadow-md">
                <span className="material-symbols-outlined text-[28px]">stadium</span>
              </div>
              <span className="font-chivo text-base font-black uppercase text-white leading-tight">
                Đặt Thuê Cụm Sân
              </span>
              <span className="text-xs text-white/90 mt-1 font-semibold flex items-center gap-1">
                Xem {SCMS_FACILITIES.length} cụm sân &amp; đặt chỗ ngay <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
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
      <section className="w-full bg-slate-100 py-20 px-6 sm:px-10 md:px-14 lg:px-20" id="uu-dai">
        <div className="w-full max-w-[1720px] mx-auto bg-white p-8 md:p-14 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8 border border-slate-200">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-red-600 font-chivo text-xs uppercase tracking-wider font-bold mb-2">
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              ƯU ĐÃI THÀNH VIÊN MỚI 2026
            </div>
            <h3 className="font-chivo text-2xl sm:text-3xl font-extrabold text-slate-900">
              Trải nghiệm toàn bộ {LANDING_SPORTS.length} bộ môn với gói All-Access Pass
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
      <footer className="w-full bg-slate-950 text-slate-400 pt-14 pb-8 border-t border-slate-800">
        <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-10 md:px-14 lg:px-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 mb-10">
            <div>
              <a
                href="#/"
                onClick={e => handleNavClick(navItems[0], e)}
                aria-label="SCMS Sports - Về trang chủ"
                className="inline-flex items-center gap-3 mb-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-chivo font-black shadow-lg shadow-red-950/30">
                  S
                </div>
                <div className="flex flex-col">
                  <span className="font-chivo text-lg font-black uppercase text-white leading-tight">SCMS Sports</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 mt-0.5">Sports Center</span>
                </div>
              </a>
              <p className="text-xs leading-6 text-slate-300 max-w-xs">
                Không gian học tập và rèn luyện thể thao dành cho mọi lứa tuổi. Cùng SCMS chọn bộ môn yêu thích, nâng cao thể lực và kết nối cộng đồng.
              </p>
              <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/70 text-[11px] font-semibold text-slate-300">
                <span className="material-symbols-outlined text-red-400 text-[16px]" aria-hidden="true">sports_score</span>
                <span>{LANDING_SPORTS.length} bộ môn · {SCMS_FACILITIES.length} khu tập luyện</span>
              </div>
            </div>

            <div>
              <h4 className="font-chivo text-xs uppercase tracking-wider text-white mb-4 font-bold">
                Thông Tin Liên Hệ
              </h4>
              <ul className="space-y-3 text-xs leading-6 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-red-400 text-[18px] shrink-0 mt-0.5" aria-hidden="true">location_on</span>
                  <span>Khu công nghệ cao, Thủ Đức, TP. Hồ Chí Minh</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-400 text-[18px] shrink-0" aria-hidden="true">call</span>
                  <a href="tel:0859859367" className="rounded hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors">
                    0859 859 367
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-red-400 text-[18px] shrink-0 mt-0.5" aria-hidden="true">mail</span>
                  <a href="mailto:lienhe@scmsportscenter.vn" className="min-w-0 break-words rounded hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors">
                    lienhe@scmsportscenter.vn
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-chivo text-xs uppercase tracking-wider text-white mb-4 font-bold">
                Thời Gian Hoạt Động
              </h4>
              <ul className="space-y-2 text-xs leading-6">
                <li className="flex justify-between gap-3 pb-2 border-b border-slate-800">
                  <span>Thứ Hai - Thứ Sáu:</span>
                  <span className="font-bold text-slate-200 tabular-nums whitespace-nowrap">05:30 - 22:30</span>
                </li>
                <li className="flex justify-between gap-3 pb-2 border-b border-slate-800">
                  <span>Thứ Bảy - Chủ Nhật:</span>
                  <span className="font-bold text-slate-200 tabular-nums whitespace-nowrap">06:00 - 22:00</span>
                </li>
                <li className="flex justify-between gap-3">
                  <span>Ngày Lễ:</span>
                  <span className="font-semibold text-red-400 text-right">Mở cửa linh hoạt</span>
                </li>
              </ul>
              <p className="text-[11px] leading-5 text-slate-400 mt-3">
                Giờ hoạt động cụ thể được ghi trong thông tin từng sân và phòng tập.
              </p>
            </div>

            <div>
              <h4 className="font-chivo text-xs uppercase tracking-wider text-white mb-4 font-bold">
                Bộ Môn &amp; Cơ Sở
              </h4>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                {LANDING_SPORTS.map(sport => (
                  <li key={sport.id} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => handleSportClick(sport)}
                      title={`Xem cơ sở tập luyện ${sport.name}`}
                      className="flex items-start gap-2 text-left leading-5 text-slate-300 hover:text-red-400 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
                    >
                      <span className="w-1 h-1 rounded-full bg-red-500 shrink-0 mt-2" aria-hidden="true" />
                      <span>{sport.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-5 text-[11px]">
            <p className="text-center lg:text-left leading-5">© 2026 SCMS Sports Center. Bảo lưu mọi quyền.</p>
            <nav aria-label="Liên kết cuối trang" className="flex flex-wrap items-center justify-center lg:justify-end gap-x-5 gap-y-3">
              {navItems.filter(item => item.id !== 'trang-chu').map(item => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={e => handleNavClick(item, e)}
                  className="text-slate-300 hover:text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <a href="#/register" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors">
                <span>Đăng ký hội viên</span>
                <span className="material-symbols-outlined text-[15px]" aria-hidden="true">arrow_forward</span>
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
