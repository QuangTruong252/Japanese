/** Safari can report isComposing=false on the Enter that confirms an IME candidate. */
export function canSubmitJapanese(event: { key: string; isComposing: boolean; keyCode: number }, composing: boolean): boolean {
  return event.key === 'Enter' && !composing && !event.isComposing && event.keyCode !== 229;
}
