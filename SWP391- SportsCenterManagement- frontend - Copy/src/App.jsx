import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { ProtectedRoute, RoleGuard } from './components/auth/RoleGuard.js';
import { AppLayout } from './components/layout/AppLayout.js';

// Public & Auth Pages
import { LandingPage } from './features/landing/LandingPage.js';
import { LoginPage } from './features/auth/LoginPage.js';

// Manager Pages
import { ManagerDashboard } from './features/manager/ManagerDashboard.js';
import { StaffManagement } from './features/manager/StaffManagement.js';
import { PackageManagement } from './features/manager/PackageManagement.js';
import { ClassesAndRooms } from './features/manager/ClassesAndRooms.js';
import { CoachAssignment } from './features/manager/CoachAssignment.js';
import { ReportsAnalytics } from './features/manager/ReportsAnalytics.js';
import { RolesPermissions } from './features/manager/RolesPermissions.js';
import { AuditLogs } from './features/manager/AuditLogs.js';

// Receptionist Pages
import { ReceptionistDashboard } from './features/receptionist/ReceptionistDashboard.js';
import { MemberLookup } from './features/receptionist/MemberLookup.js';
import { CounterMembership } from './features/receptionist/CounterMembership.js';
import { MemberCheckIn } from './features/receptionist/MemberCheckIn.js';

// Coach Pages
import { CoachDashboard } from './features/coach/CoachDashboard.js';
import { TeachingSchedule } from './features/coach/TeachingSchedule.js';
import { ClassMembers } from './features/coach/ClassMembers.js';
import { Attendance } from './features/coach/Attendance.js';
import { TrainingPlan } from './features/coach/TrainingPlan.js';
import { WorkoutProgress } from './features/coach/WorkoutProgress.js';
import { CoachNotifications } from './features/coach/CoachNotifications.js';
import { AIRecommendation } from './features/coach/AIRecommendation.js';

// Member Pages
import { MemberDashboard } from './features/member/MemberDashboard.js';
import { MemberPackages } from './features/member/MemberPackages.js';
import { ClassScheduleView } from './features/member/ClassScheduleView.js';
import { MyBookings } from './features/member/MyBookings.js';
import { MyProgress } from './features/member/MyProgress.js';
import { MemberAIAssistant } from './features/member/MemberAIAssistant.js';
import { PaymentResult } from './features/member/PaymentResult.js';

function AppRouter() {
  const [currentHash, setCurrentHash] = useState(() =>
    window.location.pathname === '/payment-result' ? '#/payment-result' : window.location.hash || '#/'
  );

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

  // Helper bọc layout & guard cho role Manager & Admin/SystemAdmin
  const renderManagerRoute = (Component, requiredCapability) => (
    <AppLayout currentPath={path}>
      <ProtectedRoute>
        <RoleGuard allowedRoles={['MANAGER', 'ADMIN', 'SYSTEMADMIN']} requiredCapability={requiredCapability}>
          <Component />
        </RoleGuard>
      </ProtectedRoute>
    </AppLayout>
  );

  // Helper bọc layout & guard cho role Receptionist (Manager & Admin cũng có quyền xem)
  const renderReceptionistRoute = (Component, requiredCapability) => (
    <AppLayout currentPath={path}>
      <ProtectedRoute>
        <RoleGuard allowedRoles={['RECEPTIONIST', 'MANAGER', 'ADMIN', 'SYSTEMADMIN']} requiredCapability={requiredCapability}>
          <Component />
        </RoleGuard>
      </ProtectedRoute>
    </AppLayout>
  );

  // Helper bọc layout & guard cho role Coach (Manager & Admin cũng có quyền xem)
  const renderCoachRoute = (Component, requiredCapability) => (
    <AppLayout currentPath={path}>
      <ProtectedRoute>
        <RoleGuard allowedRoles={['COACH', 'MANAGER', 'ADMIN', 'SYSTEMADMIN']} requiredCapability={requiredCapability}>
          <Component />
        </RoleGuard>
      </ProtectedRoute>
    </AppLayout>
  );

  // Helper bọc layout & guard cho role Member (Manager & Admin cũng có quyền xem)
  const renderMemberRoute = (Component, requiredCapability) => (
    <AppLayout currentPath={path}>
      <ProtectedRoute>
        <RoleGuard allowedRoles={['MEMBER', 'MANAGER', 'ADMIN', 'SYSTEMADMIN']} requiredCapability={requiredCapability}>
          <Component />
        </RoleGuard>
      </ProtectedRoute>
    </AppLayout>
  );

  // Check if route is a dashboard or auth route
  const isDashboardOrAuth =
    path.startsWith('#/manager') ||
    path.startsWith('#/receptionist') ||
    path.startsWith('#/coach') ||
    path.startsWith('#/member') ||
    path === '#/login' ||
    path === '#/register' ||
    path === '#/payment-result';

  if (!isDashboardOrAuth) {
    return <LandingPage />;
  }

  // Điều hướng chính xác theo hash
  switch (path) {
    // PUBLIC & AUTH ROUTES
    case '#/login':
    case '#/register':
      return <LoginPage />;
    case '#/payment-result':
      return <PaymentResult />;

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
      return renderMemberRoute(MemberPackages, 'manage_packages');
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
        <AppRouter />
      </AuthProvider>
    </ToastProvider>
  );
}
