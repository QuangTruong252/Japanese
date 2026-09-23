import type { Metadata, Viewport } from "next";
import { getFOUCScriptContent } from "@/lib/settings";
import { AppNav } from "@/components/AppNav";
import { SearchDialog } from "@/components/search/SearchDialog";
import "./globals.css";

export const metadata: Metadata = {
  title: "MaiPace — Tự học tiếng Nhật",
  description:
    "Học tiếng Nhật theo nhịp của bạn. Học bài N5, luyện tập và ôn theo lịch cùng MaiPace, với giao diện tiếng Việt.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
      <body
        className="min-h-full flex flex-col bg-background text-foreground font-sans"
        suppressHydrationWarning
      >
        <AppNav />
        <SearchDialog />
        <div className="flex-1 flex flex-col pb-28 sm:pb-32 lg:pb-0 lg:pl-64">
          {children}
        </div>
      </body>
    </html>
  );
}
