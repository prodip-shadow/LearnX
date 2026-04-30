'use client';
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase.init';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import Swal from 'sweetalert2';

export const useAuthActions = () => {
  const [loading, setLoading] = useState(false);
  const googleProvider = new GoogleAuthProvider();

  // MongoDB-তে ইউজার সেভ করার জন্য হেল্পার ফাংশন
  // এখানে 'image' প্যারামিটারটি যোগ করা হয়েছে
  const saveUserToDB = async (user, fullName = null, image = null) => {
    const userData = {
      name: fullName || user.displayName,
      email: user.email,
      // যদি সরাসরি ইমেজ পাস করা হয় (রেজিস্ট্রেশন থেকে) তবে সেটা নেবে,
      // নাহলে ফায়ারবেস প্রোফাইল থেকে নেবে
      image: image || user.photoURL || '',
      role: 'student', // ডিফল্ট রোল সেট করে দেওয়া ভালো
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Failed to sync with MongoDB:', err);
    }
  };

  // ১. ইমেইল ও পাসওয়ার্ড দিয়ে রেজিস্ট্রেশন
  // এখানে photoURL প্যারামিটারটি যোগ করা হয়েছে
  const registerUser = async (email, password, fullName, photoURL) => {
    setLoading(true);
    try {
      // ১. ফায়ারবেস ইউজার তৈরি
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // ২. ফায়ারবেস প্রোফাইল আপডেট (নাম এবং ImgBB লিঙ্ক সহ)
      await updateProfile(result.user, {
        displayName: fullName,
        photoURL: photoURL,
      });

      // ৩. MongoDB-তে সেভ করা (ইমেজ লিঙ্কসহ পাঠানো হচ্ছে)
      await saveUserToDB(result.user, fullName, photoURL);

      Swal.fire({
        title: 'Success!',
        text: `Welcome to LearnX, ${fullName}!`,
        icon: 'success',
        confirmButtonColor: 'var(--color-primary)',
      });
      return result.user;
    } catch (error) {
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use')
        msg = 'Email already registered!';
      Swal.fire({ title: 'Error!', text: msg, icon: 'error' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ২. ইমেইল ও পাসওয়ার্ড দিয়ে লগইন
  const loginUser = async (email, password) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await saveUserToDB(result.user);
      Swal.fire({
        title: 'Logged In!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      return result.user;
    } catch (error) {
      Swal.fire({ title: 'Login Failed', text: error.message, icon: 'error' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ৩. গুগল দিয়ে লগইন
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserToDB(result.user);
      Swal.fire({
        title: 'Success!',
        text: `Logged in as ${result.user.displayName}`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
      return result.user;
    } catch (error) {
      Swal.fire({ title: 'Error!', text: error.message, icon: 'error' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { registerUser, loginUser, loginWithGoogle, loading };
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};
