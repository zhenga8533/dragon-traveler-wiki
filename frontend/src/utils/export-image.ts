import { toPng } from 'html-to-image';

type NavigatorWithShare = Navigator & {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data?: ShareData) => boolean;
};

function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function sanitizeFilename(filename: string): string {
  return filename
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');
}

function triggerAnchorDownload(
  dataUrl: string,
  filename: string,
  mobile: boolean
) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${filename}.png`;
  if (mobile) {
    // iOS/Safari may ignore download, but opening a tab still allows save/share.
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadElementAsPng(
  el: HTMLElement,
  filename: string,
  isDark: boolean
): Promise<void> {
  const mobile = isMobileDevice();
  const safeFilename = sanitizeFilename(filename) || 'export';
  const preferredPixelRatio = mobile
    ? Math.min(window.devicePixelRatio || 1, 1.5)
    : 2;

  let dataUrl: string;
  try {
    dataUrl = await toPng(el, {
      backgroundColor: isDark ? '#1a1b1e' : '#ffffff',
      pixelRatio: preferredPixelRatio,
    });
  } catch {
    // Retry with a lower pixel ratio for memory-constrained mobile devices.
    dataUrl = await toPng(el, {
      backgroundColor: isDark ? '#1a1b1e' : '#ffffff',
      pixelRatio: 1,
    });
  }

  if (mobile) {
    const nav = navigator as NavigatorWithShare;
    if (nav.share && nav.canShare) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `${safeFilename}.png`, {
          type: 'image/png',
        });
        if (nav.canShare({ files: [file] })) {
          await nav.share({ files: [file], title: safeFilename });
          return;
        }
      } catch {
        // Fallback to anchor download/open below.
      }
    }
  }

  triggerAnchorDownload(dataUrl, safeFilename, mobile);
}
