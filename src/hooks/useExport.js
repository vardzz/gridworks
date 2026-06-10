// src/hooks/useExport.js — PNG and PDF export logic
"use client";

import { useCallback, useState } from "react";

/**
 * Export hook — provides PNG and PDF export functions.
 * Receives a ref to the canvas DOM element.
 *
 * PNG: Uses html-to-image with HD pixel ratio.
 * PDF: Uses window.print() on desktop, returns mobile modal flag on mobile.
 *
 * @param {React.RefObject} canvasRef
 */
export function useExport(canvasRef) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [fallbackImageUrl, setFallbackImageUrl] = useState(null);

  const exportPNG = useCallback(async (customFileName) => {
    if (!canvasRef?.current) return;

    setIsExporting(true);

    try {
      // Wait for fonts to finish loading
      await document.fonts.ready;

      // Dynamic import to keep bundle small
      const { toPng } = await import("html-to-image");

      const node = canvasRef.current;
      const rect = node.getBoundingClientRect();

      // Let the canvas export at its naturally rendered screen dimensions to avoid html-to-image clipping bugs (the black bar on the right).
      // We use a high pixelRatio so the image remains extremely high-quality and readable even if the viewport is small.
      const dataUrl = await toPng(node, {
        pixelRatio: Math.max(3, window.devicePixelRatio * 2),
        cacheBust: true,
      });

      const safeName = customFileName ? customFileName.replace(/[^a-z0-9_\-\s]/gi, '_') : "My_Schedule";
      const filenameWithExt = `${safeName}.png`;

      // 1. Try Web Share API first (essential for in-app browsers like Messenger/Instagram)
      if (navigator.share && navigator.canShare) {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], filenameWithExt, { type: 'image/png' });
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'My Schedule',
            });
            setIsExporting(false);
            return; // Exit if share was successful
          }
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') {
            setIsExporting(false);
            return;
          }
          console.warn("Web Share API failed, falling back to standard download:", shareErr);
        }
      }

      // Check if we are stuck in an in-app browser (Messenger, FB, IG, TikTok, Line, etc.)
      const isAppBrowser = /FBAN|FBAV|Instagram|Snapchat|TikTok|Messenger|Line|MicroMessenger/i.test(navigator.userAgent);
      
      if (isAppBrowser) {
        // Ultimate fallback: display the image on screen so they can long-press to save
        setFallbackImageUrl(dataUrl);
      } else {
        // 2. Fallback: Trigger standard HTML5 download
        const link = document.createElement("a");
        link.download = filenameWithExt;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("[Gridworks] PNG export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [canvasRef]);

  const exportPDF = useCallback(() => {
    const isMobile =
      /Mobi|Android/i.test(navigator.userAgent) || "ontouchstart" in window;

    if (isMobile) {
      setShowMobileModal(true);
    } else {
      window.print();
    }
  }, []);

  const closeMobileModal = useCallback(() => {
    setShowMobileModal(false);
  }, []);

  return {
    exportPNG,
    exportPDF,
    isExporting,
    showMobileModal,
    closeMobileModal,
    fallbackImageUrl,
    setFallbackImageUrl,
  };
}
