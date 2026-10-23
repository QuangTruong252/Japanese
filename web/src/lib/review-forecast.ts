export interface ForecastDay {
  date: Date;
  count: number;
}

const FORECAST_DAYS = 7;
const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** Nửa đêm địa phương của ngày thứ `offset` kể từ hôm nay; dựng bằng Date(y, m, d) nên đúng cả ngày đổi giờ. */
function dayStart(now: Date, offset: number): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
}

/**
 * Số mục đến hạn của 7 ngày lịch địa phương kể từ hôm nay. Ô đầu gom cả mục quá hạn
 * (người học ôn trễ thì vẫn phải ôn trong hôm nay); mục sau ngày thứ 7 không đếm.
 */
export function reviewForecast(dueDates: Date[], now: Date): ForecastDay[] {
  // ends[i] = nửa đêm kết thúc ngày i (loại trừ).
  const ends = Array.from({ length: FORECAST_DAYS }, (_, i) => dayStart(now, i + 1).getTime());
  const days = Array.from({ length: FORECAST_DAYS }, (_, i) => ({ date: dayStart(now, i), count: 0 }));
  for (const due of dueDates) {
    const slot = ends.findIndex((end) => due.getTime() < end);
    if (slot >= 0) days[slot].count += 1;
  }
  return days;
}

/** Nhãn cột: "Hôm nay" cho ô đầu, sau đó thứ viết tắt tiếng Việt. */
export function forecastDayLabel(day: ForecastDay, index: number): string {
  return index === 0 ? 'Hôm nay' : WEEKDAY_LABELS[day.date.getDay()];
}
