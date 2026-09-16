import { Badge } from 'web'
import { Check, CloudOff, X } from 'lucide-react'

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge>N5</Badge>
    <Badge variant="secondary">動詞 II</Badge>
    <Badge variant="outline">第 12 課</Badge>
    <Badge variant="destructive">Sai 3 lần</Badge>
    <Badge variant="ghost">Bỏ qua</Badge>
    <Badge variant="link">Nguồn</Badge>
  </div>
)

/**
 * Semantic colour never carries meaning alone — every state badge pairs an
 * icon with a text label, per the design system's accessibility rule.
 */
export const AnswerStates = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge className="bg-success text-success-foreground">
      <Check /> Đúng
    </Badge>
    <Badge variant="destructive">
      <X /> Sai
    </Badge>
    <Badge variant="outline" className="text-warning">
      <CloudOff /> Chờ đồng bộ
    </Badge>
  </div>
)

export const VerbGroups = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge variant="outline" className="text-verb-1">
      動詞 I
    </Badge>
    <Badge variant="outline" className="text-verb-2">
      動詞 II
    </Badge>
    <Badge variant="outline" className="text-verb-3">
      動詞 III
    </Badge>
  </div>
)
