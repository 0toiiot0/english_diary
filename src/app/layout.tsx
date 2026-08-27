import type { Metadata } from "next";
import { Lora } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { NavLinks } from "@/components/layout/NavLinks";
import { StorageBanner } from "@/components/layout/StorageBanner";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

export const metadata: Metadata = {
  title: "DayNote — 영어 일기 첨삭",
  description: "영어로 일기를 쓰면 AI가 한국어로 첨삭하고, 상황에 맞는 표현을 추천해줘요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${lora.variable} ${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-text-primary">
        <StorageBanner />
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-4 md:pb-10">
          {children}
        </main>
        <NavLinks variant="bottom" />
      </body>
    </html>
  );
}
