import { Poppins } from 'next/font/google';
import './globals.css';
import 'katex/dist/katex.min.css';
import ChatBot from '@/components/ChatBot/ChatBot';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
});

export const metadata = {
  title: {
    default: 'LearnX - Online Tuition Platform | Find Expert Tutors',
    template: '%s | LearnX',
  },

  description:
    'LearnX is a modern online tuition platform where students connect with expert tutors for personalized learning. Improve your grades, book flexible tutoring sessions, and master your exams.',

  keywords: [
    'LearnX',
    'online tuition platform',
    'online tutoring',
    'find tutors',
    'private tutors online',
    'education platform',
    'exam preparation',
    'student learning platform',
    'online study help',
    'academic tutoring',
    'best tutors online',
    'math tutor',
    'science tutor',
    'english tutor',
    'digital learning platform',
  ],

  authors: [
    {
      name: 'Prodip Hore',
    },
  ],

  creator: 'Prodip Hore',
  publisher: 'LearnX',

  openGraph: {
    title: 'LearnX - Master Your Exams with Expert Tutors',
    description:
      'Connect with expert tutors and boost your academic performance with personalized online tutoring sessions on LearnX.',
    url: 'https://learnx.vercel.app',
    siteName: 'LearnX',

    images: [
      {
        url: 'https://i.ibb.co/C36Y47qm/2026-03-17-102612-hyprshot.png',
        width: 1200,
        height: 630,
        alt: 'LearnX Online Tutoring Platform',
      },
      {
        url: 'https://i.ibb.co/0RRVhPmN/2026-03-17-102530-hyprshot.png',
      },
      {
        url: 'https://i.ibb.co/tTrZx13P/2026-03-17-102436-hyprshot.png',
      },
      {
        url: 'https://i.ibb.co/YM1G0CV/2026-03-17-102414-hyprshot.png',
      },
      {
        url: 'https://i.ibb.co/twscCjKk/2026-03-17-102337-hyprshot.png',
      },
    ],

    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'LearnX - Online Tutoring Platform',
    description:
      'Join LearnX and connect with expert tutors to master your exams with personalized online learning.',
    images: ['https://i.ibb.co/C36Y47qm/2026-03-17-102612-hyprshot.png'],
    creator: '@learnx',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  category: 'education',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <body className={`${poppins.className} antialiased`}>
        {children}
        <ChatBot />
      </body>
    </html>
  );
}
