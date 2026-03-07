import { toJpeg } from 'html-to-image';

const JPEG_EXTENSION = 'jpg';
const JPEG_MIME_TYPE = 'image/jpeg';
const JPEG_QUALITY = 0.95;
const LIGHT_BACKGROUND = '#ffffff';
const DARK_BACKGROUND = '#1a1b1e';
const DESKTOP_PIXEL_RATIO = 2;
const MOBILE_MAX_PIXEL_RATIO = 1.5;
const DESKTOP_EXPORT_WIDTH = 1200;
const FONT_READY_TIMEOUT_MS = 2000;

type FontRenderMode = 'embed' | 'skip';

type ShareCapableNavigator = Navigator & {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data?: ShareData) => boolean;
};

function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const nav = navigator as Navigator & {
    userAgentData?: {
      mobile?: boolean;
    };
  };

  if (nav.userAgentData?.mobile) {
    return true;
  }

  // iPadOS can report a desktop-like UA string; touch capability disambiguates it.
  if (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1) {
    return true;
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
    link.download = `${filename}.${JPEG_EXTENSION}`;
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function renderElementAsJpeg(
  el: HTMLElement,
  isDark: boolean,
  pixelRatio: number,
  fontRenderMode: FontRenderMode,
  width?: number,
  height?: number
): Promise<string> {
  const includeFontEmbedOptions = fontRenderMode === 'skip';

  return toJpeg(el, {
    backgroundColor: isDark ? DARK_BACKGROUND : LIGHT_BACKGROUND,
    pixelRatio,
    quality: JPEG_QUALITY,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(includeFontEmbedOptions
      ? {
          // Fallback mode: skip embedding webfonts to avoid cross-origin stylesheet access failures.
          skipFonts: true,
          // Empty CSS prevents cssRules access in cross-origin stylesheets.
          fontEmbedCSS: '',
        }
      : {}),
  });
}

async function waitForDocumentFonts(): Promise<void> {
  if (typeof document === 'undefined') {
    return;
  }

  const docWithFonts = document as Document & {
    fonts?: {
      ready: Promise<unknown>;
    };
  };

  if (!docWithFonts.fonts?.ready) {
    return;
  }

  try {
    await Promise.race([
      docWithFonts.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, FONT_READY_TIMEOUT_MS)),
    ]);
  } catch {
    // Ignore font readiness failures and continue with best-effort capture.
  }
}

function createDesktopExportClone(source: HTMLElement): {
  container: HTMLDivElement;
  clone: HTMLElement;
  width: number;
  height: number;
} {
  const container = document.createElement('div');
  const clone = source.cloneNode(true) as HTMLElement;

  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-100000px';
  container.style.width = `${DESKTOP_EXPORT_WIDTH}px`;
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '-1';

  clone.style.width = '100%';
  clone.style.maxWidth = 'none';
  clone.style.minWidth = `${DESKTOP_EXPORT_WIDTH}px`;

  // Allow components to opt into export-only desktop column counts.
  clone
    .querySelectorAll<HTMLElement>('[data-export-cols-desktop]')
    .forEach((node) => {
      const desktopCols = node.getAttribute('data-export-cols-desktop');
      if (!desktopCols) {
        return;
      }
      node.style.setProperty('--sg-cols', desktopCols);
    });

  container.appendChild(clone);
  document.body.appendChild(container);

  // Ensure layout is fully measured before capture.
  const width = Math.max(DESKTOP_EXPORT_WIDTH, Math.ceil(clone.scrollWidth));
  const height = Math.max(1, Math.ceil(clone.scrollHeight));

  return { container, clone, width, height };
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

async function tryShareOnMobile(
  dataUrl: string,
  filename: string
): Promise<boolean> {
  const nav = navigator as ShareCapableNavigator;
  if (!nav.share) {
    return false;
  }

  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `${filename}.${JPEG_EXTENSION}`, {
      type: JPEG_MIME_TYPE,
    });

    if (nav.canShare && !nav.canShare({ files: [file] })) {
      return false;
    }

    await nav.share({ files: [file], title: filename });
    return true;
  } catch {
    return false;
  }
}

export async function downloadElementAsImage(
  el: HTMLElement,
  filename: string,
  isDark: boolean
): Promise<void> {
  const mobile = isMobileDevice();
  const safeFilename = sanitizeFilename(filename) || 'export';
  const preferredPixelRatio = mobile
    ? Math.min(window.devicePixelRatio || 1, MOBILE_MAX_PIXEL_RATIO)
    : DESKTOP_PIXEL_RATIO;

  let dataUrl: string;
  let exportElement = el;
  let exportWidth: number | undefined;
  let exportHeight: number | undefined;
  let exportContainer: HTMLDivElement | undefined;

  if (mobile) {
    const desktopClone = createDesktopExportClone(el);
    exportContainer = desktopClone.container;
    exportElement = desktopClone.clone;
    exportWidth = desktopClone.width;
    exportHeight = desktopClone.height;
  }

  await waitForDocumentFonts();

  try {
    // First attempt: preserve live page typography for consistent text metrics.
    dataUrl = await renderElementAsJpeg(
      exportElement,
      isDark,
      preferredPixelRatio,
      'embed',
      exportWidth,
      exportHeight
    );
  } catch {
    try {
      // Fallback: disable font embedding when stylesheet CORS blocks access.
      dataUrl = await renderElementAsJpeg(
        exportElement,
        isDark,
        preferredPixelRatio,
        'skip',
        exportWidth,
        exportHeight
      );
    } catch {
      // Final fallback for memory-constrained devices.
      dataUrl = await renderElementAsJpeg(
        exportElement,
        isDark,
        1,
        'skip',
        exportWidth,
        exportHeight
      );
    }
  } finally {
    if (exportContainer) {
      exportContainer.remove();
    }
  }

  if (mobile) {
    if (await tryShareOnMobile(dataUrl, safeFilename)) {
      return;
    }

    if (tryOpenImagePreviewForMobile(dataUrl)) {
      return;
    }
  }

  triggerAnchorDownload(dataUrl, safeFilename, mobile);
}

// Backward-compatible alias used by existing imports.
export const downloadElementAsPng = downloadElementAsImage;
