import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, Button } from 'web'

export const ResetProgress = () => (
  <Dialog open modal={false}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Đặt lại tiến độ bài 5?</DialogTitle>
        <DialogDescription>
          Toàn bộ lịch sử ôn tập của 24 thẻ trong bài này sẽ bị xoá. Không hoàn tác được.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Huỷ</DialogClose>
        <Button variant="destructive">Đặt lại</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
