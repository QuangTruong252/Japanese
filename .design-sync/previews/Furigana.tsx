import { Furigana } from 'web'

/**
 * Reading notation is `漢字[かな]` — the base run in kanji, the reading in
 * square brackets. Plain text between runs passes through untouched.
 */
export const Sentence = () => (
  <p className="text-xl">
    <Furigana text="私[わたし]は 学生[がくせい]です。" />
  </p>
)

export const VocabularyRow = () => (
  <div className="flex flex-col gap-3 text-xl">
    <Furigana text="電車[でんしゃ]で 行[い]きます。" />
    <Furigana text="毎朝[まいあさ] 六時[ろくじ]に 起[お]きます。" />
    <Furigana text="図書館[としょかん]で 本[ほん]を 読[よ]みました。" />
  </div>
)

/** `zoomable={false}` drops the hover-zoom wrapper — use it in dense lists. */
export const NotZoomable = () => (
  <p className="text-xl">
    <Furigana text="明日[あした] 友達[ともだち]と 映画[えいが]を 見[み]ます。" zoomable={false} />
  </p>
)
