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

      // Trigger download
      const link = document.createElement("a");
      const safeName = customFileName ? customFileName.replace(/[^a-z0-9_\-\s]/gi, '_') : "My_Schedule";
      link.download = `${safeName}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
  };
}
