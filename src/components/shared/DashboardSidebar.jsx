'use client';
import React, { useState, useEffect } from 'react'; // useEffect যোগ করা হয়েছে
import { auth } from '@/lib/firebase.init'; // Firebase auth ইমপোর্ট
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  BookOpen,
  UserCircle,
  LogOut,
  Menu,
  X,
  TrendingUp,
  UserCog,
  Database,
  Briefcase,
  Library,
} from 'lucide-react';

const DashboardSidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // ডাইনামিক ইউজার ডাটার জন্য স্টেট
  const [userData, setUserData] = useState({
    name: 'Loading...',
    image: 'https://i.ibb.co/5GzXkwq/default-avatar.png',
  });

  // ডাইনামিক ডাটা ফেচ করা
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        try {
          const res = await fetch(`/api/users?email=${user.email}`);
          const data = await res.json();
          if (data) {
            setUserData({
              name: data.name || 'User Name',
              image:
                data.image || 'https://i.ibb.co/5GzXkwq/default-avatar.png',
            });
          }
        } catch (error) {
          console.error('Sidebar user fetch error:', error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const menuConfig = {
    admin: [
      {
        name: 'Admin Panel',
        href: '/dashboard/admin',
        icon: <ShieldCheck size={20} />,
      },
      {
        name: 'User Management',
        href: '/dashboard/admin/users',
        icon: <UserCog size={20} />,
      },
      {
        name: 'All Exams',
        href: '/dashboard/admin/all-exams',
        icon: <FileText size={20} />,
      },

      // {
      //   name: 'All Exams Results',
      //   href: '/dashboard/admin/all-exams-results',
      //   icon: <BarChart3 size={20} />,
      // },
      {
        name: 'Teacher Controls',
        href: '/dashboard/teacher/my-exams',
        icon: <Briefcase size={20} />,
      },
      // {
      //   name: 'Settings',
      //   href: '/dashboard/admin/settings',
      //   icon: <Settings size={20} />,
      // },
    ],
    teacher: [
      {
        name: 'Teacher Pannel',
        href: '/dashboard/teacher',
        icon: <LayoutDashboard size={20} />,
      },
      {
        name: 'My Exams',
        href: '/dashboard/teacher/my-exams',
        icon: <FileText size={20} />,
      },
      {
        name: 'Create Exam',
        href: '/dashboard/teacher/create-exam',
        icon: <FileText size={20} />,
      },
      {
        name: 'Students',
        href: '/dashboard/teacher/students',
        icon: <Users size={20} />,
      },
      {
        name: 'Add Resource',
        href: '/dashboard/teacher/addResource',
        icon: <Library size={20} />,
      },
      {
        name: 'My Resources',
        href: '/dashboard/teacher/my-resources',
        icon: <BookOpen size={20} />,
      },
    ],
    student: [
      {
        name: 'Student Pannel',
        href: '/dashboard/student',
        icon: <LayoutDashboard size={20} />,
      },
      {
        name: 'My Exams',
        href: '/dashboard/student/my-exams',
        icon: <BookOpen size={20} />,
      },
      {
        name: 'Progress',
        href: '/dashboard/student/progress',
        icon: <TrendingUp size={20} />,
      },
      {
        name: 'Resources',
        href: '/dashboard/student/resources',
        icon: <Library size={20} />,
      },
    ],
  };

  const currentRole = pathname.includes('/teacher')
    ? 'teacher'
    : pathname.includes('/student')
      ? 'student'
      : 'admin';
  const navLinks = menuConfig[currentRole] || [];

  const SidebarContent = ({ mobile = false }) => (
    <>
      <div className="p-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shrink-0">
            <GraduationCap size={24} />
          </div>
          {(!isCollapsed || mobile) && (
            <h2 className="text-xl font-black tracking-tighter text-[#0f172a] whitespace-nowrap">
              LearnX
            </h2>
          )}
        </Link>
        {mobile && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 text-slate-500"
          >
            <X size={24} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => mobile && setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                isActive
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-slate-600 hover:bg-primary-light hover:text-primary'
              } ${isCollapsed && !mobile ? 'justify-center px-0' : ''}`}
            >
              <span className="shrink-0">{link.icon}</span>
              {(!isCollapsed || mobile) && (
                <span className="whitespace-nowrap">{link.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ডাইনামিক প্রোফাইল সেকশন */}
      <div className="p-4 border-t border-slate-100">
        <div
          className={`flex items-center bg-slate-50 p-2 rounded-2xl border border-slate-100 ${isCollapsed && !mobile ? 'justify-center' : 'gap-3'}`}
        >
          <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-primary/20">
            <Image
              src={userData.image} // ডাইনামিক ইমেজ
              alt="Profile"
              fill
              className="object-cover"
            />
          </div>
          {(!isCollapsed || mobile) && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate text-slate-800">
                {userData.name} {/* ডাইনামিক নাম */}
              </p>
              <p className="text-[10px] font-black text-primary uppercase">
                {currentRole}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 z-50">
        <Link href={'/'}>
          <div className="flex items-center gap-2 text-primary">
            <GraduationCap size={28} />
            <span className="font-black text-slate-800">LearnX</span>
          </div>
        </Link>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 bg-slate-50 rounded-lg"
        >
          <Menu size={24} className="text-slate-600" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 260 }}
        className="hidden md:flex relative flex-shrink-0 border-r border-slate-100 bg-white flex-col h-screen sticky top-0 z-40"
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-12 bg-primary text-white rounded-full p-1 shadow-md z-50 border-2 border-white"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <SidebarContent />
      </motion.aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-white z-[70] md:hidden flex flex-col shadow-2xl"
            >
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default DashboardSidebar;
