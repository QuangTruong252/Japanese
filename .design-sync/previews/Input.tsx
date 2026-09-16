import { Input } from 'web'

export const States = () => (
  <div className="flex w-80 flex-col gap-3">
    <Input placeholder="Nhập cách đọc bằng hiragana…" />
    <Input defaultValue="がくせい" />
    <Input placeholder="Không sửa được" disabled />
    <Input defaultValue="がくせえ" aria-invalid />
  </div>
)

export const AnswerField = () => (
  <div className="flex w-80 flex-col gap-2">
    <label className="text-sm font-medium" htmlFor="reading">
      学生 の 読み方
    </label>
    <Input id="reading" placeholder="ひらがなで入力" />
    <p className="text-xs text-muted-foreground">
      Nhập bằng hiragana, không cần dấu cách.
    </p>
  </div>
)
