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
  description: 'Detect when students blindly accept AI-generated code and ensure genuine comprehension with contextual quizzes.',
  keywords: ['vibe coding', 'education', 'AI detection', 'comprehension', 'VS Code extension'],
  authors: [{ name: 'Brian Isaac' }],
  openGraph: {
    title: 'Codswallop - Stop Vibe Coding, Start Understanding',
    description: 'Detect when students blindly accept AI-generated code and ensure genuine comprehension.',
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
