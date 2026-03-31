'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Star,
  Users,
  ArrowRight,
  Loader2,
  Search,
  X,
  Mail,
  Calendar,
  Award,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Briefcase,
} from 'lucide-react';

const TutorsPage = () => {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTutor, setSelectedTutor] = useState(null);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const res = await fetch('/api/users?role=teacher');
        if (res.ok) {
          const data = await res.json();
          setTutors(data);
        }
      } catch (error) {
        console.error('Error fetching tutors:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, []);

  const filteredTutors = tutors.filter((tutor) =>
    tutor.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-[#fcfcfd] text-slate-900 pb-20">
      <section className="px-6 md:px-20 py-20 bg-white border-b border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
              <Users size={14} /> Expert Educators
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight">
              Learn from the <br />
              <span className="text-primary italic">Best Minds</span>
            </h1>
            <p className="text-slate-500 max-w-md text-lg font-medium leading-relaxed">
              Accelerate your learning journey with our hand-picked certified
              tutors.
            </p>
          </div>

          <div className="relative w-full md:w-[400px] group">
            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm focus-within:border-primary transition-all">
              <div className="pl-4 text-slate-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Search by name, expertise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-4 py-4 bg-transparent text-sm font-bold outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-20 py-16">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="relative">
                <Loader2 className="animate-spin text-primary" size={60} />
                <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse" />
              </div>
              <p className="text-slate-400 font-black tracking-[0.2em] uppercase text-xs">
                Finding Experts...
              </p>
            </div>
          ) : filteredTutors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredTutors.map((tutor) => (
                <div
                  key={tutor._id}
                  className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 hover:border-primary/30 hover:shadow-[0_30px_60px_rgba(31,187,37,0.08)] transition-all duration-500 flex flex-col"
                >
                  <div className="flex items-start gap-5">
                    <div className="relative shrink-0">
                      <Image
                        src={
                          tutor.image ||
                          'https://i.ibb.co/5GzXkwq/default-avatar.png'
                        }
                        alt={tutor.name}
                        width={90}
                        height={90}
                        className="rounded-[2rem] object-cover border-4 border-slate-50 group-hover:border-[#e8f8eb] transition-all duration-500"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary border-4 border-white rounded-full shadow-sm" />
                    </div>

                    <div className="flex-1 pt-2">
                      <h3 className="font-black text-xl text-slate-800 group-hover:text-primary transition-colors line-clamp-1">
                        {tutor.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-amber-500 mt-2">
                        <Star size={14} fill="currentColor" />
                        <span className="text-[11px] font-black uppercase tracking-tighter">
                          4.9 • Top Rated
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                      <Briefcase size={16} className="text-slate-300" />{' '}
                      {tutor.role.charAt(0).toUpperCase() + tutor.role.slice(1)}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full">
                      <CheckCircle2 size={12} /> Verified
                    </div>
                    <button
                      onClick={() => setSelectedTutor(tutor)}
                      className="inline-flex items-center gap-2 text-xs font-black text-slate-900 group/btn transition-all"
                    >
                      VIEW PROFILE
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover/btn:bg-primary group-hover/btn:text-white transition-all duration-300">
                        <ArrowRight size={14} />
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200 max-w-2xl mx-auto shadow-sm">
              <Users className="mx-auto text-slate-100 mb-6" size={100} />
              <h3 className="text-2xl font-black text-slate-800">
                No Experts Found
              </h3>
              <p className="text-slate-400 mt-2 font-medium">
                Try searching with a different name or criteria.
              </p>
            </div>
          )}
        </div>
      </section>

      {selectedTutor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setSelectedTutor(null)}
          />

          <div className="relative w-full max-w-3xl bg-white rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.25)] overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-500">
            <button
              onClick={() => setSelectedTutor(null)}
              className="absolute top-6 right-6 z-30 p-2.5 bg-white/90 hover:bg-red-500 text-slate-400 hover:text-white rounded-2xl transition-all duration-300 shadow-lg"
            >
              <X size={18} strokeWidth={3} />
            </button>

            <div className="h-32 bg-gradient-to-br from-primary to-[#148b19] relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              </div>
            </div>

            <div className="px-10 pb-10 -mt-16 relative z-10">
              <div className="flex flex-col md:flex-row gap-10">
                <div className="md:w-1/3 flex flex-col items-center md:items-start">
                  <div className="relative inline-block">
                    <Image
                      src={
                        selectedTutor.image ||
                        'https://i.ibb.co/5GzXkwq/default-avatar.png'
                      }
                      alt={selectedTutor.name}
                      width={150}
                      height={150}
                      className="rounded-[2.5rem] object-cover border-[6px] border-white shadow-2xl bg-white"
                    />
                    <div className="absolute bottom-3 right-3 w-6 h-6 bg-primary border-4 border-white rounded-full shadow-lg" />
                  </div>

                  <div className="mt-6 w-full space-y-3">
                    <div className="bg-slate-50/80 p-4 rounded-3xl flex justify-between items-center border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Students
                      </span>
                      <span className="text-sm font-black text-slate-800">
                        1,402+
                      </span>
                    </div>
                    <div className="bg-slate-50/80 p-4 rounded-3xl flex justify-between items-center border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Rating
                      </span>
                      <span className="text-sm font-black text-slate-800 flex items-center gap-1">
                        4.9{' '}
                        <Star
                          size={12}
                          className="fill-amber-400 text-amber-400"
                        />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:w-2/3 pt-16">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">
                      Verified Instructor
                    </span>
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    {selectedTutor.name}
                  </h2>
                  <p className="text-slate-400 font-bold text-sm mt-2">
                    Expert in {selectedTutor.role.toUpperCase()} & Mentorship
                  </p>

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary/30 transition-all">
                      <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
                        <Mail size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">
                          Email
                        </p>
                        <p className="text-xs font-black text-slate-800 mt-1 truncate">
                          {selectedTutor.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary/30 transition-all">
                      <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center shrink-0">
                        <Calendar size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">
                          Joined
                        </p>
                        <p className="text-xs font-black text-slate-800 mt-1">
                          {new Date(selectedTutor.createdAt).toLocaleDateString(
                            'en-US',
                            { month: 'short', year: 'numeric' },
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button
                  <div className="mt-8 flex gap-4">
                    <button className="flex-1 py-4 bg-primary hover:bg-[#19a51e] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                      Send Message <ExternalLink size={14} />
                    </button>
                    <button className="px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98]">
                      <BookOpen size={18} />
                    </button>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TutorsPage;
