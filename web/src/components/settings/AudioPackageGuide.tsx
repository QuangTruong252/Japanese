'use client';

import { useRef, useState } from 'react';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SAMPLE_MANIFEST_JSON, MANIFEST_FIELD_DOCS } from '@/lib/audio-manifest-sample';

const codeClass = 'font-mono text-foreground';

/** Hướng dẫn tạo gói ZIP audio: bước, cây thư mục, mẫu manifest có nút sao chép. Mở sẵn bằng `defaultOpen`. */
export function AudioPackageGuide({ defaultOpen }: { defaultOpen: boolean }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(SAMPLE_MANIFEST_JSON);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
      throw new Error('Clipboard API unavailable');
    } catch {
      // Fallback: chọn văn bản trong DOM để người dùng dễ dàng bấm Ctrl+C
      if (codeRef.current) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(codeRef.current);
        selection?.removeAllRanges();
        selection?.addRange(range);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-border bg-card text-sm text-muted-foreground"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 font-medium text-foreground outline-none select-none focus-visible:ring-3 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span>Cách tạo gói audio (.zip)</span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="space-y-4 border-t border-border px-4 py-4">
        <ol className="list-inside list-decimal space-y-1.5 leading-relaxed">
          <li>
            <strong className="font-medium text-foreground">Đặt tên file:</strong> Gom các file MP3 theo từng thư mục bài học (<code className={codeClass}>L01</code>, <code className={codeClass}>L02</code>...). Đặt tên file theo chuẩn: <code className={codeClass}>01_vocab.mp3</code>, <code className={codeClass}>02_sentence_patterns.mp3</code>, <code className={codeClass}>03_examples.mp3</code>, <code className={codeClass}>04_conversation.mp3</code>.
          </li>
          <li>
            <strong className="font-medium text-foreground">Tạo manifest.json:</strong> Đặt file <code className={codeClass}>manifest.json</code> ở thư mục gốc chứa mã SHA-256 của từng file MP3 để ứng dụng kiểm tra tính toàn vẹn khi giải nén.
          </li>
          <li>
            <strong className="font-medium text-foreground">Nén thành file ZIP:</strong> Chọn các thư mục bài học cùng file <code className={codeClass}>manifest.json</code> nén thành 1 file ZIP (tối đa 2 GB) rồi nạp vào máy.
          </li>
        </ol>

        <div className="space-y-1.5">
          <div className="font-medium text-foreground">Cấu trúc thư mục chuẩn:</div>
          <pre className="overflow-x-auto rounded-lg border border-border bg-secondary p-3 font-mono text-xs leading-relaxed text-foreground">
{`minna-audio/
├── L01/
│   ├── 01_vocab.mp3
│   ├── 02_sentence_patterns.mp3
│   ├── 03_examples.mp3
│   └── 04_conversation.mp3
├── L02/ ...
└── manifest.json`}
          </pre>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs">manifest.json (1 bài, 2 track mẫu)</span>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 shrink-0 gap-1.5 px-3"
              onClick={handleCopy}
              aria-label={copied ? 'Đã sao chép' : 'Sao chép nội dung manifest.json'}
            >
              {copied ? (
                <>
                  <Check className="text-success" />
                  <span className="text-success">Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="text-muted-foreground" />
                  <span>Sao chép</span>
                </>
              )}
            </Button>
          </div>

          <pre
            ref={codeRef}
            tabIndex={0}
            className="overflow-x-auto rounded-lg border border-border bg-secondary p-3 font-mono text-xs leading-relaxed text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring"
          >
            {SAMPLE_MANIFEST_JSON}
          </pre>

          <div className="space-y-1.5 pt-1">
            <div className="font-medium text-foreground">Chú thích các trường:</div>
            <ul className="space-y-1">
              {MANIFEST_FIELD_DOCS.map((doc) => (
                <li key={doc.name} className="flex flex-col gap-0.5 [overflow-wrap:anywhere] sm:flex-row sm:items-baseline sm:gap-2">
                  <span className="font-mono font-medium text-foreground sm:shrink-0">• {doc.name}:</span>
                  <span className="min-w-0">{doc.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </details>
  );
}
