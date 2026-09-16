import { Button } from 'web'
import { Check, ChevronRight, Volume2 } from 'lucide-react'

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Button>保存</Button>
    <Button variant="secondary">下書き</Button>
    <Button variant="outline">キャンセル</Button>
    <Button variant="ghost">スキップ</Button>
    <Button variant="destructive">削除</Button>
    <Button variant="link">詳細を見る</Button>
  </div>
)

export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Button size="xs">xs</Button>
    <Button size="sm">sm</Button>
    <Button size="default">default</Button>
    <Button size="lg">lg</Button>
  </div>
)

/**
 * `size="quiz"` is the mandated size for every button inside an exercise flow:
 * 48px tall, the touch target the design system requires on phones.
 */
export const QuizAnswers = () => (
  <div className="flex w-full max-w-md flex-col gap-2">
    <Button size="quiz" variant="outline" className="justify-start">
      1. がくせい
    </Button>
    <Button size="quiz" variant="outline" className="justify-start">
      2. せんせい
    </Button>
    <Button size="quiz" className="justify-start">
      <Check /> 3. かいしゃいん
    </Button>
  </div>
)

export const WithIcons = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Button size="icon" variant="outline" aria-label="Phát âm thanh">
      <Volume2 />
    </Button>
    <Button>
      次の問題 <ChevronRight />
    </Button>
    <Button variant="secondary" disabled>
      採点中…
    </Button>
  </div>
)
