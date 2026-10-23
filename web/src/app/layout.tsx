import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { getFOUCScriptContent } from "@/lib/settings";
import { AppNav } from "@/components/AppNav";
import { SearchDialog } from "@/components/search/SearchDialog";
import { PageTransition } from "@/components/PageTransition";
import "./globals.css";

export const metadata: Metadata = {
  title: "MaiPace — Tự học tiếng Nhật",
  description:
    "Học tiếng Nhật theo nhịp của bạn. Học bài N5, luyện tập và ôn theo lịch cùng MaiPace, với giao diện tiếng Việt.",
  appleWebApp: { capable: true, title: "MaiPace", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf6ec" },
    { media: "(prefers-color-scheme: dark)", color: "#18130e" },
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
        {/* Chỉ bản build: ở dev, ảnh cache-first sẽ che mất ảnh vừa sửa. */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'})`,
            }}
          />
        )}
      </head>
      <body
        className="h-dvh flex flex-col bg-background text-foreground font-sans overflow-hidden"
        suppressHydrationWarning
      >
        <AppNav />
        <SearchDialog />
        <div
          id="app-scroll-container"
          className="flex-1 flex flex-col min-w-0 max-w-full overflow-y-auto overflow-x-clip scrollbar-none pb-28 sm:pb-32 md:pb-0 scroll-pb-28 sm:scroll-pb-32 md:scroll-pb-0 md:pl-20 lg:pl-60 overscroll-y-contain"
        >
          <PageTransition>{children}</PageTransition>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
