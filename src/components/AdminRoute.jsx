"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase.init";
import { Loader2, ShieldCheck } from "lucide-react";

const AdminRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const res = await fetch(`/api/users?email=${user.email}`);
          const data = await res.json();

          if (data?.role === "admin") {
            setIsAdmin(true);
          } else {
            router.push("/");
          }
        } catch (error) {
          router.push(`/login?redirect=${pathname}`);
        }
      } else {
        router.push(`/login?redirect=${pathname}`);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary mb-3" size={45} />
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary" />
          <p className="text-slate-600 font-bold tracking-tight">
            System Verifying Admin Privileges...
          </p>
        </div>
      </div>
    );
  }

  return isAdmin ? children : null;
};

export default AdminRoute;
