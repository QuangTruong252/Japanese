import { Tabs, TabsList, TabsTrigger, TabsContent } from 'web'

export const LessonSections = () => (
  <Tabs defaultValue="vocab" className="w-full max-w-96">
    <TabsList>
      <TabsTrigger value="vocab">単語</TabsTrigger>
      <TabsTrigger value="grammar">文法</TabsTrigger>
      <TabsTrigger value="drill">練習</TabsTrigger>
    </TabsList>
    <TabsContent value="vocab" className="pt-2 text-muted-foreground">
      24 từ vựng của bài 5, kèm cách đọc và ví dụ.
    </TabsContent>
    <TabsContent value="grammar" className="pt-2 text-muted-foreground">
      3 mẫu câu: へ行きます, で行きます, と行きます.
    </TabsContent>
    <TabsContent value="drill" className="pt-2 text-muted-foreground">
      5 dạng bài tập, chấm tự động.
    </TabsContent>
  </Tabs>
)

export const LineVariant = () => (
  <Tabs defaultValue="all" className="w-full max-w-96">
    <TabsList variant="line">
      <TabsTrigger value="all">Tất cả</TabsTrigger>
      <TabsTrigger value="due">Đến hạn</TabsTrigger>
      <TabsTrigger value="hard">Khó</TabsTrigger>
    </TabsList>
    <TabsContent value="all" className="pt-3 text-muted-foreground">
      318 thẻ trong bộ.
    </TabsContent>
    <TabsContent value="due" className="pt-3 text-muted-foreground">
      128 thẻ đến hạn hôm nay.
    </TabsContent>
    <TabsContent value="hard" className="pt-3 text-muted-foreground">
      19 thẻ bị sai từ 3 lần trở lên.
    </TabsContent>
  </Tabs>
)
