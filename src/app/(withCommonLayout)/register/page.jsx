'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthActions } from '@/hooks/useAuth';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';

const Registration = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const router = useRouter();
  const { registerUser, loading } = useAuthActions();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    photoURL: '',
    agreeToTerms: false,
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    setImagePreview(URL.createObjectURL(file));
    setUploading(true);

    const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMAGEBB_API_KEY;

    if (!IMGBB_API_KEY) {
      console.error('ImgBB API key is missing in .env.local');
      setUploading(false);
      return;
    }

    const imageData = new FormData();
    imageData.append('image', file);

    try {
      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        {
          method: 'POST',
          body: imageData,
        },
      );
      const data = await response.json();

      if (data.success) {
        // ImgBB থেকে পাওয়া সরাসরি লিঙ্কটি সেভ করা
        const uploadedUrl = data.data.display_url;
        setFormData((prev) => ({ ...prev, photoURL: uploadedUrl }));
        console.log('Upload Success:', uploadedUrl);
      } else {
        console.error('ImgBB Error:', data.error.message);
      }
    } catch (error) {
      console.error('Image upload network failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.agreeToTerms || uploading) return;

    // হুকের মাধ্যমে রেজিস্ট্রেশন ফাংশন কল (এখানে photoURL হলো ImgBB লিঙ্ক)
    const success = await registerUser(
      formData.email,
      formData.password,
      formData.fullName,
      formData.photoURL,
    );

    // if (success) {
    //   router.push('/dashboard');
    // }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center py-12 px-4 selection:bg-primary/30">
      <div className="max-w-5xl w-full bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(31,187,50,0.1)] border border-white overflow-hidden flex flex-col md:flex-row min-h-[650px]">
        {/* Left Side: Illustration */}
        <div className="hidden md:flex w-[40%] bg-[#0f172a] p-12 flex-col justify-between relative overflow-hidden text-white">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary rounded-full blur-[100px] opacity-20"></div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary rounded-full blur-[100px] opacity-20"></div>

          <div className="relative z-10">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <GraduationCap size={45} strokeWidth={2.5} />
              <span className="text-3xl font-black tracking-tighter text-white">
                LearnX
              </span>
            </Link>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="bg-primary/10 border border-primary/20 p-5 rounded-3xl backdrop-blur-md">
              <Sparkles className="text-primary mb-3" size={28} />
              <h3 className="text-xl font-bold">Start Learning</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Join our premium community to unlock world-class resources.
              </p>
            </div>
            <ul className="space-y-4">
              {[
                'Verified Tutors',
                'Progress Tracking',
                'Interactive Lessons',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm text-slate-300 font-medium"
                >
                  <CheckCircle2 size={18} className="text-primary" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative z-10 text-xs text-slate-500 font-medium">
            © 2026 LEARNX GLOBAL
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-[60%] p-8 md:p-14 bg-white">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-black text-[#0f172a] mb-2">
              Create Account
            </h2>
            <p className="text-slate-500 font-medium">
              Join us and start your journey today.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Image Upload Section */}
            <div className="flex flex-col items-center md:items-start space-y-3 mb-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Profile Photo
              </label>
              <div className="relative group">
                <div className="relative w-24 h-24 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-primary/50">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={96}
                      height={96}
                      className={`w-full h-full object-cover ${uploading ? 'opacity-40' : 'opacity-100'} transition-opacity`}
                    />
                  ) : (
                    <ImageIcon className="text-slate-300" size={32} />
                  )}

                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/10">
                      <Loader2
                        className="animate-spin text-primary"
                        size={28}
                      />
                    </div>
                  )}
                </div>

                <label
                  htmlFor="img-upload"
                  className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-xl cursor-pointer shadow-lg hover:scale-110 transition-all"
                >
                  <Camera size={18} />
                </label>
                <input
                  id="img-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </div>
              {formData.photoURL && !uploading && (
                <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                  <CheckCircle2 size={12} /> Image Uploaded Successfully
                </span>
              )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase ml-1">
                  Full Name
                </label>
                <div className="relative group">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary"
                    size={18}
                  />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:border-primary outline-none text-sm font-medium"
                    placeholder="Alex Johnson"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary"
                    size={18}
                  />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:border-primary outline-none text-sm font-medium"
                    placeholder="alex@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-700 uppercase ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary"
                  size={18}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full h-14 pl-12 pr-12 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:border-primary outline-none text-sm font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2">
              <input
                id="agree"
                type="checkbox"
                required
                checked={formData.agreeToTerms}
                onChange={(e) =>
                  setFormData({ ...formData, agreeToTerms: e.target.checked })
                }
                className="w-5 h-5 accent-primary cursor-pointer"
              />
              <label
                htmlFor="agree"
                className="text-sm text-slate-500 font-medium cursor-pointer"
              >
                I agree to the{' '}
                <span className="text-primary font-bold">Terms of Service</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || uploading || !formData.agreeToTerms}
              className={`w-full flex items-center justify-center gap-3 h-16 text-white text-lg font-black rounded-2xl transition-all ${
                formData.agreeToTerms && !loading && !uploading
                  ? 'bg-primary hover:bg-primary-hover shadow-xl'
                  : 'bg-slate-300'
              }`}
            >
              {loading
                ? 'Creating Account...'
                : uploading
                  ? 'Uploading Photo...'
                  : 'Create Account Now'}
              {!loading && !uploading && (
                <ArrowRight size={22} strokeWidth={3} />
              )}
            </button>

            <p className="text-center text-sm font-semibold text-slate-500">
              Already a member?{' '}
              <Link href="/login" className="text-primary font-black">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;
