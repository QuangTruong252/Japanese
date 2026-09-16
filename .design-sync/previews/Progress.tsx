import { Progress, ProgressLabel, ProgressValue } from 'web'

export const LessonProgress = () => (
  <Progress value={62} className="w-full max-w-80">
    <ProgressLabel>第 5 課</ProgressLabel>
    <ProgressValue />
  </Progress>
)

export const BareTrack = () => <Progress value={35} className="w-full max-w-80" />

export const Steps = () => (
  <div className="flex w-full max-w-80 flex-col gap-5">
    <Progress value={100}>
      <ProgressLabel>単語</ProgressLabel>
      <ProgressValue />
    </Progress>
    <Progress value={45}>
      <ProgressLabel>文法</ProgressLabel>
      <ProgressValue />
    </Progress>
    <Progress value={0}>
      <ProgressLabel>練習</ProgressLabel>
      <ProgressValue />
    </Progress>
  </div>
)
