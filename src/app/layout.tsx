import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";

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

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Demo Narrator",
  description: "You speak, We narrate.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}
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
