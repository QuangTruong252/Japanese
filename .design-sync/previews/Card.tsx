import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter, Badge, Button } from 'web'

export const LessonCard = () => (
  <Card className="w-80">
    <CardHeader>
      <CardTitle>第 5 課 — 電車で行きます</CardTitle>
      <CardDescription>Minna no Nihongo I · trang 40–47</CardDescription>
      <CardAction>
        <Badge variant="secondary">N5</Badge>
      </CardAction>
    </CardHeader>
    <CardContent className="text-muted-foreground">
      24 từ vựng mới, 3 mẫu câu. Trọng tâm: trợ từ へ và で chỉ phương tiện.
    </CardContent>
    <CardFooter className="gap-2">
      <Button size="sm">Học tiếp</Button>
      <Button size="sm" variant="ghost">
        Xem từ vựng
      </Button>
    </CardFooter>
  </Card>
)

export const StatCard = () => (
  <Card size="sm" className="w-56">
    <CardHeader>
      <CardDescription>Đến hạn ôn hôm nay</CardDescription>
      <CardTitle className="text-2xl tabular-nums">128</CardTitle>
    </CardHeader>
    <CardContent className="text-xs text-muted-foreground">
      42 thẻ mới · 86 thẻ ôn lại
    </CardContent>
  </Card>
)

export const PlainCard = () => (
  <Card className="w-72">
    <CardHeader>
      <CardTitle>Chưa có dữ liệu</CardTitle>
      <CardDescription>Nhập giáo trình để bắt đầu.</CardDescription>
    </CardHeader>
  </Card>
)
