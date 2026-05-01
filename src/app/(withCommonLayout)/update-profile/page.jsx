'use client';
import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase.init';
import { onAuthStateChanged } from 'firebase/auth';
import Swal from 'sweetalert2';
import {
  User,
  Mail,
  Phone,
  BookOpen,
  MapPin,
  Building,
  Loader2,
  Save,
  Camera,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

const UpdateProfile = () => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    image: '',
    phone: '',
    institution: '',
    department: '',
    currentClass: '',
    address: '',
    role: '',
  });

  const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMAGEBB_API_KEY;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        const res = await fetch(`/api/users?email=${user.email}`);
        const data = await res.json();

        let studentExtra = {};
        if (data.role === 'student') {
          const sRes = await fetch(
            `/api/become-student/manage?email=${user.email}`,
          );
          const sData = await sRes.json();
          if (sData.success) studentExtra = sData.data;
        }

        setUserData({
          ...data,
          currentClass: studentExtra?.currentClass || '',
          phone: data.phone || studentExtra?.phone || '',
          institution: data.institution || studentExtra?.institution || '',
          department: data.department || studentExtra?.department || '',
        });
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        {
          method: 'POST',
          body: formData,
        },
      );
      const data = await res.json();
      if (data.success) {
        setUserData({ ...userData, image: data.data.display_url });
        Swal.fire({
          title: 'Profile Picture Updated',
          icon: 'success',
          toast: true,
          position: 'top-end',
          timer: 2500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      Swal.fire('Error', 'Image upload failed!', 'error');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await fetch('/api/users/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (res.ok) {
        Swal.fire({
          title: 'Profile Updated!',
          text: 'Information saved successfully.',
          icon: 'success',
          confirmButtonColor: '#1fbb25',
        });
      }
    } catch (error) {
      Swal.fire('Error', 'Update failed!', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary mb-4" size={50} />
        <p className="text-slate-500 font-bold animate-pulse">
          Syncing Profile...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-background py-16 px-4 md:px-8">
      {/* Decorative Blobs with Primary Colors */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="fixed bottom-10 right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse delay-700" />

      <div className="max-w-5xl mx-auto">
        {/* Glassmorphism Wrapper */}
        <div className="relative bg-white/70 backdrop-blur-2xl border border-primary-accent rounded-[3rem] shadow-[0_20px_50px_rgba(31,187,37,0.1)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Sidebar with Primary Gradient */}
            <div className="lg:col-span-4 bg-gradient-to-br from-primary to-primary-hover p-10 text-white flex flex-col items-center justify-center text-center">
              <div className="relative group mb-6">
                <div className="relative w-40 h-40 rounded-[2.5rem] border-4 border-white/40 overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:border-white/70">
                  {imageUploading ? (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" size={32} />
                    </div>
                  ) : (
                    <img
                      src={
                        userData.image ||
                        'https://i.ibb.co/5GzXkwq/default-avatar.png'
                      }
                      alt="Profile"
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-white text-primary p-3 rounded-2xl cursor-pointer shadow-xl hover:bg-primary-light transition-all border-4 border-primary">
                  <Camera size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>

              <h2 className="text-3xl font-black tracking-tighter mb-2 uppercase">
                {userData.name}
              </h2>
              <div className="flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/20 mb-8">
                <ShieldCheck size={14} className="text-white" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {userData.role} Verified
                </span>
              </div>

              <div className="w-full space-y-4 text-left bg-black/10 p-6 rounded-3xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-primary-accent" />
                  <p className="text-xs font-bold opacity-90 truncate">
                    {userData.email}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles size={16} className="text-primary-accent" />
                  <p className="text-xs font-bold opacity-90 uppercase tracking-tighter">
                    Verified Member
                  </p>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="lg:col-span-8 p-8 md:p-14 bg-white/30">
              <div className="mb-10">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  Account Settings
                </h3>
                <p className="text-slate-500 font-medium">
                  Update your profile to keep your information current.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Inputs with Primary Focus Colors */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Full Name
                    </label>
                    <div className="relative group">
                      <User
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
                        size={18}
                      />
                      <input
                        type="text"
                        value={userData.name}
                        onChange={(e) =>
                          setUserData({ ...userData, name: e.target.value })
                        }
                        className="w-full pl-12 pr-6 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold text-slate-700 transition-all"
                        placeholder="Name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Phone Number
                    </label>
                    <div className="relative group">
                      <Phone
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
                        size={18}
                      />
                      <input
                        type="text"
                        value={userData.phone}
                        onChange={(e) =>
                          setUserData({ ...userData, phone: e.target.value })
                        }
                        className="w-full pl-12 pr-6 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold text-slate-700 transition-all"
                        placeholder="017XXXXXXXX"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Institution
                    </label>
                    <div className="relative group">
                      <Building
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
                        size={18}
                      />
                      <input
                        type="text"
                        value={userData.institution}
                        onChange={(e) =>
                          setUserData({
                            ...userData,
                            institution: e.target.value,
                          })
                        }
                        className="w-full pl-12 pr-6 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold text-slate-700 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Department
                    </label>
                    <div className="relative group">
                      <BookOpen
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
                        size={18}
                      />
                      <input
                        type="text"
                        value={userData.department}
                        onChange={(e) =>
                          setUserData({
                            ...userData,
                            department: e.target.value,
                          })
                        }
                        className="w-full pl-12 pr-6 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold text-slate-700 transition-all"
                      />
                    </div>
                  </div>

                  {userData.role === 'student' && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Class / Year
                      </label>
                      <div className="relative group">
                        <Sparkles
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
                          size={18}
                        />
                        <input
                          type="text"
                          value={userData.currentClass}
                          onChange={(e) =>
                            setUserData({
                              ...userData,
                              currentClass: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-6 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold text-slate-700 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Home Address
                    </label>
                    <div className="relative group">
                      <MapPin
                        className="absolute left-4 top-6 text-slate-400 group-focus-within:text-primary transition-colors"
                        size={18}
                      />
                      <textarea
                        rows="3"
                        value={userData.address}
                        onChange={(e) =>
                          setUserData({ ...userData, address: e.target.value })
                        }
                        className="w-full pl-12 pr-6 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold text-slate-700 transition-all resize-none"
                        placeholder="Your full address..."
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-primary/10">
                  <button
                    type="submit"
                    disabled={updating || imageUploading}
                    className="w-full md:w-max px-12 bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-primary-hover hover:shadow-[0_10px_30px_rgba(31,187,37,0.3)] transition-all active:scale-95 disabled:opacity-70 group"
                  >
                    {updating ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Save
                        size={18}
                        className="group-hover:translate-y-[-2px] transition-transform"
                      />
                    )}
                    {updating ? 'Processing...' : 'Save All Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfile;
