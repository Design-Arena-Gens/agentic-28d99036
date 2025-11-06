import "@/app/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import clsx from "clsx";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Expense Dashboard",
  description: "Minimalist personal expense tracker dashboard"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={clsx(inter.variable, "font-sans bg-slate-950")} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
