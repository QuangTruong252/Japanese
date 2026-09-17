import type { Metadata, Viewport } from "next";
import { getFOUCScriptContent } from "@/lib/settings";
import { AppNav } from "@/components/AppNav";
import { ShortcutListener } from "@/components/ShortcutListener";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tự học Tiếng Nhật - Minna no Nihongo",
  description:
    "Nền tảng tự học và ôn luyện tiếng Nhật cá nhân với FSRS Spaced Repetition, Shadowing Audio và 5 dạng bài tập thông minh.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1a191b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: getFOUCScriptContent() }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ShortcutListener />
        <AppNav />
        <div className="flex-1 flex flex-col pb-24 lg:pb-0 lg:pt-14">
          {children}
        </div>
      </body>
    </html>
  );
}
