"use client";
import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase.init";
import { onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";
import {
  Trash2,
  Layers,
  Calendar,
  ExternalLink,
  Loader2,
  Hash,
  Users,
  Clock,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import Link from "next/link";
import TeacherRoute from "@/components/TeacherRoute";

const AllExamsByTheTeacher = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchExams(currentUser.email);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchExams = async (email) => {
    try {
      const res = await fetch(`/api/exams/create?email=${email}`);
      const data = await res.json();
      if (data.success) {
        setExams(data.data);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  };

  // এক্সাম স্ট্যাটাস টগল করার ফাংশন
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const res = await fetch(`/api/exams/create`, {
        method: "PATCH", // আপনার ব্যাকএন্ড অনুযায়ী PATCH বা PUT হতে পারে
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, exam: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        setExams(
          exams.map((exam) =>
            exam._id === id ? { ...exam, exam: newStatus } : exam,
          ),
        );

        Swal.fire({
          title: `Exam ${newStatus ? "Activated" : "Deactivated"}!`,
          icon: "success",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        });
      }
    } catch (error) {
      Swal.fire("Error", "Failed to update status.", "error");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/exams/create?id=${id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          setExams(exams.filter((exam) => exam._id !== id));
          Swal.fire("Deleted!", "Exam room removed.", "success");
        }
      } catch (error) {
        Swal.fire("Error", "Failed to delete.", "error");
      }
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-bold mt-6 uppercase text-xs">
          Synchronizing Data...
        </p>
      </div>
    );

  return (
    <TeacherRoute>
      <div className="p-6 md:p-12 bg-[#fcfcfd] min-h-screen">
        <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Manage <span className="text-primary">Exams</span>
            </h1>
            <p className="text-slate-500 font-medium">
              You have {exams.length} exam rooms created.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {exams.map((exam) => (
            <div
              key={exam._id}
              className="group bg-white rounded-[2rem] border border-slate-100 hover:border-primary/20 transition-all duration-500 flex flex-col shadow-sm"
            >
              <div className="p-8 pb-4">
                <div className="flex justify-between items-start mb-6">
                  {/* স্ট্যাটাস ব্যাজ */}
                  <div
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${exam.exam ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${exam.exam ? "bg-green-500 animate-pulse" : "bg-orange-500"}`}
                    ></span>
                    {exam.exam ? "Active (Live)" : "Inactive (Off)"}
                  </div>

                  <button
                    onClick={() => handleDelete(exam._id)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-1 mb-6">
                  <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                    <Hash size={12} /> {exam.roomCode}
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">
                    {exam.roomTitle}
                  </h3>
                </div>

                {/* টগল বাটন */}
                <button
                  onClick={() => handleToggleStatus(exam._id, exam.exam)}
                  className={`w-full flex items-center justify-center gap-3 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all mb-4 ${exam.exam
                      ? "bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white"
                      : "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white"
                    }`}
                >
                  {exam.exam ? (
                    <>
                      <PauseCircle size={18} /> Stop Exam
                    </>
                  ) : (
                    <>
                      <PlayCircle size={18} /> Start Exam
                    </>
                  )}
                </button>

                <div className="flex justify-between items-center text-slate-400 border-t border-slate-50 pt-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Users size={14} /> {exam.questions?.length || 0} Qs
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Clock size={14} /> {exam.duration}
                  </div>
                </div>
              </div>
              <div className="px-8 py-6 mt-auto bg-slate-50/50 rounded-b-[2rem]">
                <Link
                  href={`/dashboard/teacher/my-exams/exam-result?id=${exam._id}&room=${exam.roomCode}`}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-white hover:bg-slate-900 text-slate-900 hover:text-white border border-slate-200 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all"
                >
                  View Results <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {exams.length === 0 && (
          <div className="max-w-2xl mx-auto text-center py-20 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm">
            <Layers size={40} className="mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-black text-slate-800 mb-2">
              No Exam Rooms Yet
            </h3>
            <Link
              href="/dashboard/teacher/create-exam"
              className="text-primary font-black uppercase text-xs tracking-widest hover:underline"
            >
              Create Now
            </Link>
          </div>
        )}
      </div>
    </TeacherRoute>
  );
};

export default AllExamsByTheTeacher;
