import { toPng } from 'html-to-image';

export async function downloadElementAsPng(
  el: HTMLElement,
  filename: string,
  isDark: boolean
): Promise<void> {
  const dataUrl = await toPng(el, {
    backgroundColor: isDark ? '#1a1b1e' : '#ffffff',
    pixelRatio: 2,
  });
  const link = document.createElement('a');
  link.download = `${filename.replace(/\s+/g, '_')}.png`;
  link.href = dataUrl;
  link.click();
}
