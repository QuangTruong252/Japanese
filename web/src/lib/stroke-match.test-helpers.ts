import { readFileSync } from 'node:fs';
import { resample, type Point, type MatchResult } from './stroke-match.ts';

export const SEED = 20261021;
export const TRIALS = 40;
type Matcher = (drawn: Point[], expected: Point[], remaining: Point[][]) => MatchResult;

/** Flatten cubic curves before sampling by arc length, as the browser does. */
export function samplePath(path: string, subdivisions = 100): Point[] {
  const tokens = path.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g) ?? [];
  const points: Point[] = [];
  let cursor = { x: 0, y: 0 };
  let control = cursor;
  let command = '';
  let previous = '';
  let i = 0;
  const number = () => {
    const value = Number(tokens[i++]);
    if (!Number.isFinite(value)) throw new Error(`Invalid SVG number in ${path}`);
    return value;
  };
  while (i < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[i])) command = tokens[i++];
    const origin = cursor;
    const point = () => {
      const x = number();
      const y = number();
      return command === command.toLowerCase() ? { x: origin.x + x, y: origin.y + y } : { x, y };
    };
    if (command === 'M' || command === 'm') {
      cursor = point();
      points.push(cursor);
      // No implicit lineto groups occur in these stroke datasets.
      command = '';
    } else if ('CcSs'.includes(command) && command !== '') {
      const a = command.toLowerCase() === 'c' ? point() :
        /[CcSs]/.test(previous) ? { x: 2 * origin.x - control.x, y: 2 * origin.y - control.y } : origin;
      const b = point();
      const end = point();
      for (let k = 1; k <= subdivisions; k++) {
        const t = k / subdivisions;
        const u = 1 - t;
        points.push({
          x: u ** 3 * origin.x + 3 * u ** 2 * t * a.x + 3 * u * t ** 2 * b.x + t ** 3 * end.x,
          y: u ** 3 * origin.y + 3 * u ** 2 * t * a.y + 3 * u * t ** 2 * b.y + t ** 3 * end.y,
        });
      }
      control = b;
      cursor = end;
    } else {
      throw new Error(`Unsupported SVG command '${command}' in ${path}`);
    }
    previous = command;
  }
  return resample(points, 32);
}

export function loadStrokes(kind: 'kana' | 'kanji', subdivisions = 100) {
  const data = JSON.parse(readFileSync(new URL(`../data/strokes/${kind}.json`, import.meta.url), 'utf8')) as Record<string, { d: string[] }>;
  const commands = [...new Set(Object.values(data).flatMap(({ d }) => d.flatMap((path) => path.match(/[a-zA-Z]/g) ?? [])))].sort();
  return { commands, chars: Object.entries(data).map(([char, { d }]) => ({ char, strokes: d.map((path) => samplePath(path, subdivisions)) })) };
}

export function measure(kind: 'kana' | 'kanji', match: Matcher) {
  const { commands, chars } = loadStrokes(kind);
  let state = SEED;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  const next = { accepted: 0, total: 0 };
  const all = { accepted: 0, total: 0 };
  const noisy = { rejected: 0, total: 0 };
  const confused: { char: string; expected: number; drawn: number }[] = [];
  const rejected: { char: string; stroke: number; count: number }[] = [];
  for (const { char, strokes } of chars) {
    for (let i = 0; i < strokes.length; i++) {
      for (let j = 0; j < strokes.length; j++) {
        if (i === j) continue;
        const ok = match(strokes[j], strokes[i], strokes.slice(i + 1)).ok;
        all.total++;
        if (ok) {
          all.accepted++;
          confused.push({ char, expected: i + 1, drawn: j + 1 });
        }
        if (j === i + 1) {
          next.total++;
          if (ok) next.accepted++;
        }
      }
    }
    const failures = strokes.map(() => 0);
    for (let trial = 0; trial < TRIALS; trial++) {
      // One translation and scale for the whole character; point jitter is independent.
      const dx = 12 * random() - 6;
      const dy = 12 * random() - 6;
      const scale = 0.9 + 0.2 * random();
      for (let i = 0; i < strokes.length; i++) {
        const drawn = resample(strokes[i], [8, 16, 32, 64][trial % 4]).map((p) => ({
          x: 54.5 + (p.x - 54.5) * scale + dx + 4 * random() - 2,
          y: 54.5 + (p.y - 54.5) * scale + dy + 4 * random() - 2,
        }));
        noisy.total++;
        if (!match(drawn, strokes[i], strokes.slice(i + 1)).ok) {
          noisy.rejected++;
          failures[i]++;
        }
      }
    }
    failures.forEach((count, i) => { if (count) rejected.push({ char, stroke: i + 1, count }); });
  }
  rejected.sort((a, b) => b.count - a.count);
  return { kind, commands, characters: chars.length, strokes: chars.reduce((sum, c) => sum + c.strokes.length, 0), seed: SEED, trials: TRIALS, next, all, noisy, confused, rejected };
}
