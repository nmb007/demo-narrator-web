import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/app/providers";
import { env } from "@/shared/config/env";

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
  title: "Demo Narrator",
  description: "Create an account and narrate a demo video.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
        {env.appEnv === "production" ? null : (
          <p className="bg-card text-muted-foreground fixed right-3 bottom-3 rounded-md border px-2 py-1 text-xs">
            {env.appEnv}
          </p>
        )}
      </body>
    </html>
  );
}
