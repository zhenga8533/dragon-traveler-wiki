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
  if (mobile) {
    // Opening the image directly allows mobile browsers to save to Photos/Camera Roll.
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  } else {
    link.download = `${filename}.png`;
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function tryOpenImagePreviewForMobile(dataUrl: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const preview = window.open('', '_blank', 'noopener,noreferrer');
  if (!preview) {
    return false;
  }

  preview.document.title = 'Image Preview';
  preview.document.body.style.margin = '0';
  preview.document.body.style.background = '#111';
  preview.document.body.innerHTML = `<img src="${dataUrl}" alt="exported image" style="display:block;width:100%;height:auto;" />`;
  return true;
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
    if (tryOpenImagePreviewForMobile(dataUrl)) {
      return;
    }

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
