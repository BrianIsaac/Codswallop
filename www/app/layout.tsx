import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Codswallop - Stop Vibe Coding, Start Understanding',
  description: 'Help students, interns, and apprentices build genuine programming skills. Codswallop detects over-reliance on AI-generated code and reinforces understanding through targeted comprehension quizzes.',
  keywords: ['vibe coding', 'education', 'AI detection', 'comprehension', 'VS Code extension', 'programming skills', 'learn to code', 'software engineering', 'intern', 'apprentice'],
  authors: [{ name: 'Brian Isaac' }],
  openGraph: {
    title: 'Codswallop - Stop Vibe Coding, Start Understanding',
    description: 'Build genuine programming skills. Detect AI over-reliance and reinforce comprehension through targeted quizzes.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-950`}
      >
        {children}
      </body>
    </html>
  );
}
