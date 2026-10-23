/** Đầu trang tra cứu nằm trong trang trái của sách mở: tiêu đề serif và một dòng số liệu. */
export function LookupHeader({ title, meta }: { title: string; meta?: string }) {
  return (
    <header>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">{title}</h1>
      {meta && <p className="mt-1 text-sm text-muted-foreground">{meta}</p>}
    </header>
  );
}
