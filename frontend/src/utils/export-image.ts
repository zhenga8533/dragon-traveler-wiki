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
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    window.open(dataUrl, '_blank');
  } else {
    const link = document.createElement('a');
    link.download = `${filename.replace(/\s+/g, '_')}.png`;
    link.href = dataUrl;
    link.click();
  }
}
