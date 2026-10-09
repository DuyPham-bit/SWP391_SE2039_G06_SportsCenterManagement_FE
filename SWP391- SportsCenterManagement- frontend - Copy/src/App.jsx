import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ProtectedRoute, RoleGuard } from './components/auth/RoleGuard.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';

// Public & Auth Pages
import { LandingPage } from './features/landing/LandingPage.jsx';
const LoginPage = lazy(() => import('./features/auth/LoginPage.jsx').then(module => ({ default: module.LoginPage })));

// Manager Pages
const ManagerDashboard = lazy(() => import('./features/manager/ManagerDashboard.jsx').then(module => ({ default: module.ManagerDashboard })));
const StaffManagement = lazy(() => import('./features/manager/StaffManagement.jsx').then(module => ({ default: module.StaffManagement })));
const PackageManagement = lazy(() => import('./features/manager/PackageManagement.jsx').then(module => ({ default: module.PackageManagement })));
const ClassesAndRooms = lazy(() => import('./features/manager/ClassesAndRooms.jsx').then(module => ({ default: module.ClassesAndRooms })));
const CoachAssignment = lazy(() => import('./features/manager/CoachAssignment.jsx').then(module => ({ default: module.CoachAssignment })));
const ReportsAnalytics = lazy(() => import('./features/manager/ReportsAnalytics.jsx').then(module => ({ default: module.ReportsAnalytics })));
const RolesPermissions = lazy(() => import('./features/manager/RolesPermissions.jsx').then(module => ({ default: module.RolesPermissions })));
const AuditLogs = lazy(() => import('./features/manager/AuditLogs.jsx').then(module => ({ default: module.AuditLogs })));

// Receptionist Pages
const ReceptionistDashboard = lazy(() => import('./features/receptionist/ReceptionistDashboard.jsx').then(module => ({ default: module.ReceptionistDashboard })));
const MemberLookup = lazy(() => import('./features/receptionist/MemberLookup.jsx').then(module => ({ default: module.MemberLookup })));
const CounterMembership = lazy(() => import('./features/receptionist/CounterMembership.jsx').then(module => ({ default: module.CounterMembership })));
const MemberCheckIn = lazy(() => import('./features/receptionist/MemberCheckIn.jsx').then(module => ({ default: module.MemberCheckIn })));

// Coach Pages
const CoachDashboard = lazy(() => import('./features/coach/CoachDashboard.jsx').then(module => ({ default: module.CoachDashboard })));
const TeachingSchedule = lazy(() => import('./features/coach/TeachingSchedule.jsx').then(module => ({ default: module.TeachingSchedule })));
const ClassMembers = lazy(() => import('./features/coach/ClassMembers.jsx').then(module => ({ default: module.ClassMembers })));
const Attendance = lazy(() => import('./features/coach/Attendance.jsx').then(module => ({ default: module.Attendance })));
const TrainingPlan = lazy(() => import('./features/coach/TrainingPlan.jsx').then(module => ({ default: module.TrainingPlan })));
const WorkoutProgress = lazy(() => import('./features/coach/WorkoutProgress.jsx').then(module => ({ default: module.WorkoutProgress })));
const CoachNotifications = lazy(() => import('./features/coach/CoachNotifications.jsx').then(module => ({ default: module.CoachNotifications })));
const AIRecommendation = lazy(() => import('./features/coach/AIRecommendation.jsx').then(module => ({ default: module.AIRecommendation })));

// Member Pages
const MemberDashboard = lazy(() => import('./features/member/MemberDashboard.jsx').then(module => ({ default: module.MemberDashboard })));
const MemberPackages = lazy(() => import('./features/member/MemberPackages.jsx').then(module => ({ default: module.MemberPackages })));
const ClassScheduleView = lazy(() => import('./features/member/ClassScheduleView.jsx').then(module => ({ default: module.ClassScheduleView })));
const MyBookings = lazy(() => import('./features/member/MyBookings.jsx').then(module => ({ default: module.MyBookings })));
const MyProgress = lazy(() => import('./features/member/MyProgress.jsx').then(module => ({ default: module.MyProgress })));
const MemberAIAssistant = lazy(() => import('./features/member/MemberAIAssistant.jsx').then(module => ({ default: module.MemberAIAssistant })));

function AppRouter() {
  const [currentHash, setCurrentHash] = useState(() => window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/';
      setCurrentHash(hash);
      
      const cleanAnchor = hash.replace(/^#\/?/, '').split('?')[0];
      const targetElement = document.getElementById(cleanAnchor);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      } else if (!cleanAnchor.includes('co-so-vat-chat') && !cleanAnchor.includes('khoa-hoc') && !cleanAnchor.includes('ve-chung-toi')) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const path = currentHash.split('?')[0];

  const renderRoleRoute = (Component, allowedRoles, requiredCapability) => (
    <ProtectedRoute>
      <AppLayout currentPath={path}>
        <RoleGuard allowedRoles={allowedRoles} requiredCapability={requiredCapability}>
          <Component />
        </RoleGuard>
      </AppLayout>
    </ProtectedRoute>
  );
  const renderManagerRoute = (Component, capability) => renderRoleRoute(Component, ['MANAGER'], capability);
  const renderReceptionistRoute = (Component, capability) => renderRoleRoute(Component, ['RECEPTIONIST'], capability);
  const renderCoachRoute = (Component, capability) => renderRoleRoute(Component, ['COACH'], capability);
  const renderMemberRoute = (Component, capability) => renderRoleRoute(Component, ['MEMBER'], capability);

  // Check if route is a dashboard or auth route
  const isDashboardOrAuth =
    path.startsWith('#/manager') ||
    path.startsWith('#/receptionist') ||
    path.startsWith('#/coach') ||
    path.startsWith('#/member') ||
    path === '#/login' ||
    path === '#/register';

  if (!isDashboardOrAuth) {
    return <LandingPage />;
  }

  // Điều hướng chính xác theo hash
  switch (path) {
    // PUBLIC & AUTH ROUTES
    case '#/login':
    case '#/register':
      return <LoginPage />;

    // MANAGER ROUTES (8 chức năng)
    case '#/manager/dashboard':
      return renderManagerRoute(ManagerDashboard);
    case '#/manager/staff':
      return renderManagerRoute(StaffManagement, 'manage_staff');
    case '#/manager/packages':
      return renderManagerRoute(PackageManagement, 'manage_packages');
    case '#/manager/classes-rooms':
      return renderManagerRoute(ClassesAndRooms, 'manage_classes');
    case '#/manager/coach-assignment':
      return renderManagerRoute(CoachAssignment, 'assign_coach');
    case '#/manager/reports':
      return renderManagerRoute(ReportsAnalytics, 'view_reports');
    case '#/manager/roles-permissions':
      return renderManagerRoute(RolesPermissions, 'manage_roles');
    case '#/manager/audit-logs':
      return renderManagerRoute(AuditLogs, 'view_audit_logs');

    // RECEPTIONIST ROUTES (4 chức năng)
    case '#/receptionist/dashboard':
      return renderReceptionistRoute(ReceptionistDashboard);
    case '#/receptionist/lookup':
      return renderReceptionistRoute(MemberLookup, 'lookup_member');
    case '#/receptionist/counter-register':
      return renderReceptionistRoute(CounterMembership, 'register_counter_package');
    case '#/receptionist/check-in':
      return renderReceptionistRoute(MemberCheckIn, 'checkin_member');

    // COACH ROUTES (8 chức năng)
    case '#/coach/dashboard':
      return renderCoachRoute(CoachDashboard);
    case '#/coach/schedule':
      return renderCoachRoute(TeachingSchedule, 'view_teaching_schedule');
    case '#/coach/members':
      return renderCoachRoute(ClassMembers, 'view_teaching_schedule');
    case '#/coach/attendance':
      return renderCoachRoute(Attendance, 'take_attendance');
    case '#/coach/training-plan':
      return renderCoachRoute(TrainingPlan, 'create_training_plan');
    case '#/coach/progress':
      return renderCoachRoute(WorkoutProgress, 'create_training_plan');
    case '#/coach/notifications':
      return renderCoachRoute(CoachNotifications, 'view_teaching_schedule');
    case '#/coach/ai-recommendation':
      return renderCoachRoute(AIRecommendation, 'get_ai_recommendation');

    // MEMBER ROUTES (6 chức năng)
    case '#/member/dashboard':
      return renderMemberRoute(MemberDashboard);
    case '#/member/packages':
      return renderMemberRoute(MemberPackages, 'view_packages');
    case '#/member/schedule':
      return renderMemberRoute(ClassScheduleView, 'book_class');
    case '#/member/bookings':
      return renderMemberRoute(MyBookings, 'book_class');
    case '#/member/progress':
      return renderMemberRoute(MyProgress);
    case '#/member/ai-assistant':
      return renderMemberRoute(MemberAIAssistant, 'ask_ai_assistant');

    // 404 NOT FOUND ROUTE
    default:
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[36px]">travel_explore</span>
            </div>
            <h1 className="font-chivo text-2xl font-black text-slate-900">404 - KHÔNG TÌM THẤY TRANG</h1>
            <p className="text-xs text-slate-500 mt-2">
              Đường dẫn <code className="bg-slate-100 text-red-600 px-1.5 py-0.5 rounded">{path}</code> không tồn tại trên hệ thống SCMS.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <a
                href="#/"
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-chivo font-bold text-xs uppercase tracking-wider transition-colors shadow"
              >
                Về Trang Chủ SCMS
              </a>
              <a
                href="#/login"
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-chivo font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Đến Trang Đăng Nhập
              </a>
            </div>
          </div>
        </div>
      );
  }
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Suspense fallback={<div role="status" className="min-h-screen grid place-items-center text-sm text-slate-500">Đang tải trang...</div>}>
          <AppRouter />
        </Suspense>
      </AuthProvider>
    </ToastProvider>
  );
}
