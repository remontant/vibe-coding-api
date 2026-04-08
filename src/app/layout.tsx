import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import GlobalModal from "@/components/GlobalModal";
import styles from "./layout.module.css";
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
  title: "망고네 로스트아크",
  description: "더더욱 발전해 나갈 망고네 로스트아크 정보 검색기, 레이드 약속, 숙제체크- 두둥",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={styles.body}>
        <Navbar />
        {children}
        <GlobalModal />
      </body>
    </html>
  );
}
