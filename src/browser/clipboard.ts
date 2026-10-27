import type { ClipboardService } from '../domain/contracts';
export class BrowserClipboard implements ClipboardService {
  async copyText(text: string) {
    if (!text.trim())
      return { ok: false as const, message: 'Write something before copying your post.' };
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      return { ok: true as const };
    } catch {
      return {
        ok: false as const,
        message:
          'The browser could not copy your post. Select the text below and press Ctrl+C or Cmd+C.',
      };
    }
  }
}
