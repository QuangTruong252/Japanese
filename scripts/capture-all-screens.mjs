import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = join(process.cwd(), 'evidences');

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Dọn dẹp thư mục evidences trước khi chạy để đảm bảo chỉ chứa ảnh chuẩn
for (const file of readdirSync(OUTPUT_DIR)) {
  if (file.endsWith('.png')) {
    rmSync(join(OUTPUT_DIR, file), { force: true });
  }
}

const userDataDir = mkdtempSync(join(tmpdir(), 'chrome-capture-all-'));

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9222',
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--hide-scrollbars',
]);

await new Promise((r) => setTimeout(r, 1500));

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.msgId = 1;
    this.callbacks = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const cb = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) cb.reject(new Error(JSON.stringify(msg.error)));
        else cb.resolve(msg.result);
      }
    };
  }

  async send(method, params = {}) {
    await this.ready;
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  async hideDevOverlays() {
    await this.evaluate(`
      (() => {
        const el = document.querySelector('nextjs-portal');
        if (el) el.style.display = 'none';
        const vt = document.querySelector('pre.fixed');
        if (vt) vt.style.display = 'none';
        let style = document.getElementById('hide-dev-overlays');
        if (!style) {
          style = document.createElement('style');
          style.id = 'hide-dev-overlays';
          style.textContent = 'nextjs-portal, pre.fixed { display: none !important; }';
          document.head.appendChild(style);
        }
      })()
    `);
  }

  async navigate(url, waitMs = 1000) {
    await this.send('Page.navigate', { url });
    await new Promise((r) => setTimeout(r, waitMs));
    await this.hideDevOverlays();
  }

  async captureScreenshot(filename) {
    await this.hideDevOverlays();
    await new Promise((r) => setTimeout(r, 100));
    const screenshot = await this.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const buffer = Buffer.from(screenshot.data, 'base64');
    const filePath = join(OUTPUT_DIR, filename);
    writeFileSync(filePath, buffer);
    console.log(`✓ Đã lưu: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return filePath;
  }

  close() {
    this.ws.close();
  }
}

try {
  const newTabRes = await fetch('http://127.0.0.1:9222/json/new?http://localhost:3000', {
    method: 'PUT',
  });
  const tab = await newTabRes.json();
  const cdp = new CDPClient(tab.webSocketDebuggerUrl);

  // Cấu hình chuẩn iPhone 14 Pro
  // CSS: 393 x 852 px, DPR: 3
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    mobile: true,
    screenOrientation: { angle: 0, type: 'portraitPrimary' },
  });

  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await cdp.send('Emulation.setUserAgentOverride', {
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  });

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  console.log('=== BẮT ĐẦU CHỤP CÁC MÀN HÌNH MAIPACE (IPHONE 14 PRO) ===\n');

  // ----------------------------------------------------
  // 1. BẢNG TIN (Dashboard)
  // ----------------------------------------------------
  console.log('[1/28] Chụp Bảng tin ban đầu...');
  await cdp.navigate('http://localhost:3000/');
  await new Promise((r) => setTimeout(r, 600));
  await cdp.captureScreenshot('01-bang-tin.png');

  // ----------------------------------------------------
  // 2. TÌM KIẾM TOÀN CỤC (Search Dialog Modal)
  // ----------------------------------------------------
  console.log('[2/28] Chụp Tìm kiếm toàn cục - Gợi ý...');
  await cdp.evaluate(`
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  `);
  await new Promise((r) => setTimeout(r, 600));
  await cdp.captureScreenshot('02a-tim-kiem-goi-y.png');

  console.log('[3/28] Chụp Tìm kiếm toàn cục - Kết quả tìm kiếm...');
  await cdp.evaluate(`
    (() => {
      const chip = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '学生' || b.textContent?.trim() === 'gakusei');
      if (chip) chip.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 700));
  await cdp.captureScreenshot('02b-tim-kiem-ket-qua.png');

  // Đóng dialog tìm kiếm
  await cdp.evaluate(`
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  `);
  await new Promise((r) => setTimeout(r, 400));

  // ----------------------------------------------------
  // 3. MÀN HỌC (Learn Index & Detail)
  // ----------------------------------------------------
  console.log('[4/28] Chụp Màn Học - Danh sách 25 bài học N5...');
  await cdp.navigate('http://localhost:3000/hoc');
  await new Promise((r) => setTimeout(r, 800));
  await cdp.captureScreenshot('03-hoc-danh-sach.png');

  console.log('[5/28] Chụp Màn Học - Chi tiết Bài 1 (tổng quan)...');
  await cdp.navigate('http://localhost:3000/hoc/1');
  await new Promise((r) => setTimeout(r, 1000));
  await cdp.captureScreenshot('04a-hoc-bai-1.png');

  console.log('[6/28] Chụp Màn Học - Chi tiết Bài 1 (Shadowing Player A-B)...');
  await cdp.evaluate(`
    (() => {
      const sec = Array.from(document.querySelectorAll('h2')).find(h => h.textContent?.includes('Audio'));
      if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
      else window.scrollTo({ top: 1200, behavior: 'instant' });
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));
  await cdp.captureScreenshot('04b-hoc-bai-1-shadowing.png');

  // ----------------------------------------------------
  // 4. HỌC TỪ VỰNG CHỦ ĐỘNG (Vocab Flashcards)
  // ----------------------------------------------------
  console.log('[7/28] Chụp Màn Học - Chọn từ vựng bài 1...');
  await cdp.navigate('http://localhost:3000/hoc/1/tu-vung');
  await new Promise((r) => setTimeout(r, 1200));
  await cdp.captureScreenshot('05a-hoc-tu-vung-danh-sach.png');

  console.log('[8/28] Chụp Thẻ từ vựng 3D - Mặt trước (chữ Nhật & Furigana)...');
  await cdp.evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('footer button')).find(b => !b.disabled && b.textContent?.includes('Học'));
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1000));
  await cdp.captureScreenshot('05b-hoc-tu-vung-flashcard-truoc.png');

  console.log('[9/28] Chụp Thẻ từ vựng 3D - Mặt sau (Nghĩa, câu ví dụ & đánh giá FSRS)...');
  await cdp.evaluate(`
    (() => {
      const flipBtn = document.querySelector('button[aria-label*="Lật thẻ"]') || document.querySelector('article button');
      if (flipBtn) flipBtn.click();
      else window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
    })()
  `);
  await new Promise((r) => setTimeout(r, 800));
  await cdp.captureScreenshot('05c-hoc-tu-vung-flashcard-sau.png');

  // ----------------------------------------------------
  // 5. LUYỆN TẬP (Practice Setup & Quiz Runner)
  // ----------------------------------------------------
  console.log('[10/28] Chụp Luyện tập - Cấu hình bài & dạng bài...');
  await cdp.navigate('http://localhost:3000/luyen-tap');
  await new Promise((r) => setTimeout(r, 1200));
  // Đảm bảo Bài 1 được chọn
  await cdp.evaluate(`
    (() => {
      const btn = document.querySelector('button[aria-label="Bài 1"]');
      if (btn && btn.getAttribute('aria-pressed') !== 'true') {
        btn.click();
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));
  await cdp.captureScreenshot('06-luyen-tap-cai-dat.png');

  console.log('[11/28] Chụp Luyện tập - Phiên làm bài trắc nghiệm thực tế...');
  await cdp.evaluate(`
    (() => {
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Bắt đầu');
      if (startBtn && !startBtn.disabled) startBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 2200));
  await cdp.captureScreenshot('07-luyen-tap-phien.png');

  // ----------------------------------------------------
  // 6. TRA CỨU (Kanji, Động từ, Bảng tham chiếu)
  // ----------------------------------------------------
  console.log('[12/28] Chụp Tra cứu - Hub tra cứu tổng hợp...');
  await cdp.navigate('http://localhost:3000/hoc/tra-cuu');
  await new Promise((r) => setTimeout(r, 800));
  await cdp.captureScreenshot('08-tra-cuu-hub.png');

  console.log('[13/28] Chụp Tra cứu - 169 chữ Kanji N5...');
  await cdp.navigate('http://localhost:3000/hoc/tra-cuu/kanji');
  await new Promise((r) => setTimeout(r, 1200));
  await cdp.captureScreenshot('09-tra-cuu-kanji.png');

  console.log('[14/28] Chụp Tra cứu - Chi tiết chữ Hán "一"...');
  await cdp.navigate('http://localhost:3000/hoc/tra-cuu/kanji/%E4%B8%80');
  await new Promise((r) => setTimeout(r, 1000));
  await cdp.captureScreenshot('10-tra-cuu-kanji-chi-tiet.png');

  console.log('[15/28] Chụp Tra cứu - 156 Động từ 5 thể...');
  await cdp.navigate('http://localhost:3000/hoc/tra-cuu/dong-tu');
  await new Promise((r) => setTimeout(r, 1200));
  await cdp.captureScreenshot('11-tra-cuu-dong-tu.png');

  console.log('[16/28] Chụp Tra cứu - Danh mục 10 bảng tham chiếu...');
  await cdp.navigate('http://localhost:3000/hoc/tra-cuu/bang');
  await new Promise((r) => setTimeout(r, 800));
  await cdp.captureScreenshot('12-tra-cuu-bang-danh-sach.png');

  console.log('[17/28] Chụp Tra cứu - Bảng Trợ từ N5...');
  await cdp.navigate('http://localhost:3000/hoc/tra-cuu/bang/particles');
  await new Promise((r) => setTimeout(r, 1000));
  await cdp.captureScreenshot('13-tra-cuu-bang-tro-tu.png');

  console.log('[18/28] Chụp Tra cứu - Bảng Số đếm...');
  await cdp.navigate('http://localhost:3000/hoc/tra-cuu/bang/numbers');
  await new Promise((r) => setTimeout(r, 1000));
  await cdp.captureScreenshot('14-tra-cuu-bang-so-dem.png');

  // ----------------------------------------------------
  // 7. CÀI ĐẶT & AUDIO
  // ----------------------------------------------------
  console.log('[19/28] Chụp Cài đặt - Tài khoản, đồng bộ & sao lưu...');
  await cdp.navigate('http://localhost:3000/cai-dat');
  await new Promise((r) => setTimeout(r, 1000));
  await cdp.captureScreenshot('15-cai-dat.png');

  console.log('[20/28] Chụp Cài đặt Audio - Nạp file ZIP từ đĩa CD...');
  await cdp.navigate('http://localhost:3000/cai-dat/audio');
  await new Promise((r) => setTimeout(r, 1000));
  await cdp.captureScreenshot('16-cai-dat-audio.png');

  // ----------------------------------------------------
  // 8. SEED DỮ LIỆU ĐỂ CHỤP TIẾN ĐỘ, ÔN TẬP & THỐNG KÊ
  // ----------------------------------------------------
  console.log('\n--- Seed dữ liệu học tập vào IndexedDB để kiểm thử các màn có dữ liệu ---');
  await cdp.evaluate(`
    new Promise((resolve, reject) => {
      const req = indexedDB.open('JapaneseLearningDB');
      req.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction(['reviewItems', 'practiceSessions'], 'readwrite');
        const reviewStore = tx.objectStore('reviewItems');
        const sessionStore = tx.objectStore('practiceSessions');
        
        const now = new Date();
        // 7 phiên luyện tập gần nhất
        for (let i = 0; i < 7; i++) {
          const d = new Date(now.getTime() - i * 86400000);
          sessionStore.put({
            id: 'mock-session-' + i,
            selectedLessons: [1, 2],
            exerciseTypes: ['mc', 'cloze'],
            totalQuestions: 15,
            correctCount: 13 + (i % 2),
            accuracyRate: (13 + (i % 2)) / 15,
            durationSeconds: 150 + i * 15,
            createdAt: d.toISOString()
          });
        }

        // Danh sách mục ôn tập FSRS
        const sampleReviews = [
          {
            targetId: 'vocab-1-1',
            targetType: 'vocab',
            lesson: 1,
            incorrectCount: 3,
            correctCount: 5,
            lastFailedAt: new Date(now.getTime() - 86400000).toISOString(),
            dueAt: new Date(now.getTime() - 3600000),
            createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
            updatedAt: new Date().toISOString(),
            recentElapsedMs: [2400, 3100],
            fsrsCard: {
              due: new Date(now.getTime() - 3600000),
              stability: 2.1,
              difficulty: 5.5,
              elapsed_days: 2,
              scheduled_days: 2,
              reps: 4,
              lapses: 2,
              state: 2,
              last_review: new Date(now.getTime() - 86400000)
            }
          },
          {
            targetId: 'vocab-1-2',
            targetType: 'vocab',
            lesson: 1,
            incorrectCount: 2,
            correctCount: 4,
            lastFailedAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
            dueAt: new Date(now.getTime() - 7200000),
            createdAt: new Date(now.getTime() - 8 * 86400000).toISOString(),
            updatedAt: new Date().toISOString(),
            recentElapsedMs: [1900, 2400],
            fsrsCard: {
              due: new Date(now.getTime() - 7200000),
              stability: 3.4,
              difficulty: 4.2,
              elapsed_days: 3,
              scheduled_days: 3,
              reps: 3,
              lapses: 1,
              state: 2,
              last_review: new Date(now.getTime() - 2 * 86400000)
            }
          },
          {
            targetId: 'grammar-1-1',
            targetType: 'grammar',
            lesson: 1,
            incorrectCount: 1,
            correctCount: 3,
            lastFailedAt: new Date(now.getTime() - 86400000).toISOString(),
            dueAt: new Date(now.getTime() - 1800000),
            createdAt: new Date(now.getTime() - 7 * 86400000).toISOString(),
            updatedAt: new Date().toISOString(),
            recentElapsedMs: [3500, 4200],
            fsrsCard: {
              due: new Date(now.getTime() - 1800000),
              stability: 2.8,
              difficulty: 5.0,
              elapsed_days: 2,
              scheduled_days: 2,
              reps: 3,
              lapses: 1,
              state: 2,
              last_review: new Date(now.getTime() - 86400000)
            }
          }
        ];

        for (const item of sampleReviews) {
          reviewStore.put(item);
        }

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    })
  `);

  console.log('[21/28] Chụp Bảng tin - Khi đang có tiến trình học & mục cần ôn...');
  await cdp.navigate('http://localhost:3000/');
  await new Promise((r) => setTimeout(r, 1000));
  await cdp.captureScreenshot('17-bang-tin-co-tien-do.png');

  console.log('[22/28] Chụp Ôn tập - Danh sách các mục đến hạn hôm nay...');
  await cdp.navigate('http://localhost:3000/on-tap');
  await new Promise((r) => setTimeout(r, 1000));
  await cdp.captureScreenshot('18-on-tap-danh-sach.png');

  console.log('[23/28] Chụp Ôn tập - Bảng phân tích điểm yếu cần củng cố...');
  await cdp.navigate('http://localhost:3000/on-tap/diem-yeu');
  await new Promise((r) => setTimeout(r, 1000));
  await cdp.captureScreenshot('19-on-tap-diem-yeu.png');

  console.log('[24/28] Chụp Ôn tập - Phiên ôn tập FSRS Runner...');
  await cdp.navigate('http://localhost:3000/on-tap');
  await new Promise((r) => setTimeout(r, 800));
  await cdp.evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Bắt đầu ôn');
      if (btn && !btn.disabled) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 2200));
  await cdp.captureScreenshot('20-on-tap-phien-fsrs.png');

  console.log('[25/28] Chụp Thống kê - KPIs & Biểu đồ chuỗi 14 ngày...');
  await cdp.navigate('http://localhost:3000/thong-ke');
  await new Promise((r) => setTimeout(r, 1200));
  await cdp.captureScreenshot('21-thong-ke-kpis-bieu-do.png');

  console.log('[26/28] Chụp Thống kê - Lịch nhiệt Heatmap 12 tuần & Phân bố...');
  await cdp.evaluate(`window.scrollTo({ top: 480, behavior: 'instant' })`);
  await new Promise((r) => setTimeout(r, 600));
  await cdp.captureScreenshot('22-thong-ke-heatmap.png');

  // ----------------------------------------------------
  // 9. CHẾ ĐỘ TỐI (DARK MODE)
  // ----------------------------------------------------
  console.log('[27/28] Chụp Chế độ tối (Dark Mode) - Bảng tin...');
  await cdp.navigate('http://localhost:3000/');
  await cdp.evaluate(`
    (() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));
  await cdp.captureScreenshot('23-che-do-toi-bang-tin.png');

  console.log('[28/28] Chụp Chế độ tối (Dark Mode) - Chi tiết bài học...');
  await cdp.navigate('http://localhost:3000/hoc/1');
  await cdp.evaluate(`
    (() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));
  await cdp.captureScreenshot('24-che-do-toi-hoc-bai.png');

  console.log('\n=== HOÀN TẤT CHỤP TẤT CẢ CÁC MÀN HÌNH! ===');
  cdp.close();
} catch (err) {
  console.error('Lỗi trong quá trình chụp màn hình:', err);
} finally {
  chrome.kill();
  try {
    rmSync(userDataDir, { recursive: true, force: true });
  } catch {}
}
