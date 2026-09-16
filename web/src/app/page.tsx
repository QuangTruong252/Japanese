import { Furigana } from "@/components/Furigana";
import { BookOpen, Headphones, RotateCcw, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          <span>Next.js 15 · FSRS v5 · Dexie IndexedDB · Minna no Nihongo</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
          <Furigana text="日本語[にほんご]の 勉強[べんきょう]" className="text-primary text-4xl sm:text-5xl" />
        </h1>
        
        <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
          Nền tảng tự học tiếng Nhật cá nhân toàn diện theo giáo trình Minna no Nihongo với thuật toán ôn tập ngắt quãng FSRS, cơ chế nạp audio offline và 5 dạng bài tập thông minh.
        </p>
      </header>

      {/* Feature Modules Status Grid */}
      <section className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 text-primary mb-3">
            <BookOpen className="w-6 h-6" />
            <h2 className="font-semibold text-lg text-foreground">Bài học chuẩn hóa</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Kho dữ liệu 25 bài N5 Minna no Nihongo với từ vựng, ngữ pháp, mẫu câu, ví dụ furigana và giải thích tiếng Việt.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sẵn sàng kết nối data</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 text-primary mb-3">
            <RotateCcw className="w-6 h-6" />
            <h2 className="font-semibold text-lg text-foreground">Lịch ôn tập FSRS v5</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Thuật toán <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">ts-fsrs</code> chạy 100% offline trên client, lưu trạng thái vào Dexie IndexedDB, tự tính độ bền trí nhớ.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã tích hợp ts-fsrs & rating</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 text-primary mb-3">
            <Headphones className="w-6 h-6" />
            <h2 className="font-semibold text-lg text-foreground">Audio ZIP & Shadowing</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nạp file ZIP 3A chính thức 1-lần vào IndexedDB, kiểm tra hash SHA-256 từng file, trình phát lặp đoạn A-B và chỉnh tốc độ.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã cấu hình JSZip & Blob store</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 text-primary mb-3">
            <ShieldCheck className="w-6 h-6" />
            <h2 className="font-semibold text-lg text-foreground">Lưu trữ Dexie IndexedDB</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nguồn sự thật duy nhất phía client với các bảng: <code className="text-xs font-mono">review_items</code>, <code className="text-xs font-mono">audio_files</code>, <code className="text-xs font-mono">pending_sync</code>.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>AppDatabase khởi tạo thành công</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 text-primary mb-3">
            <Sparkles className="w-6 h-6" />
            <h2 className="font-semibold text-lg text-foreground">Xử lý Tiếng Nhật (Wanakana)</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Chuyển đổi Romaji ↔ Kana tức thì khi gõ, chuẩn hóa full-width / half-width và render Furigana bằng thẻ <code className="text-xs font-mono">&lt;ruby&gt;</code> gốc.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã tích hợp Wanakana helper</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 text-primary mb-3">
            <ShieldCheck className="w-6 h-6" />
            <h2 className="font-semibold text-lg text-foreground">Supabase Sync Helper</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sẵn sàng kết nối Google OAuth và đồng bộ PostgreSQL với cơ chế Optimistic Offline-First minh bạch trạng thái.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã sẵn sàng client & server helpers</span>
          </div>
        </div>
      </section>

      {/* Interactive Furigana Demo */}
      <section className="mt-12 p-6 rounded-2xl border bg-muted/40 text-center space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Thử nghiệm hiển thị Furigana (Rê chuột để phóng to):
        </h3>
        <p className="text-2xl sm:text-3xl text-foreground font-medium">
          <Furigana text="私[わたし]は 明日[あした] 京都[きょうと]へ 行[い]きます。" />
        </p>
        <p className="text-sm text-muted-foreground">
          (Tôi sẽ đi Kyoto vào ngày mai.)
        </p>
      </section>
    </main>
  );
}
