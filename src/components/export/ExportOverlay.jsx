// src/components/export/ExportOverlay.jsx — PDF + PNG export buttons and mobile modal
"use client";

import { useState } from "react";

/**
 * Export overlay/modal triggered from the canvas toolbar.
 * Allows the user to set a custom file name and download as PNG.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {function} props.onExportPNG — (filename) => void
 * @param {boolean} props.isExporting — true while PNG is generating
 */
export default function ExportOverlay({
  isOpen,
  onClose,
  onExportPNG,
  isExporting,
}) {
  const [filename, setFilename] = useState("My_Schedule");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-prussian-blue-200 tracking-wide">
            Download Image
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-alabaster-grey-400 hover:text-prussian-blue-700 transition-all cursor-pointer"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <p className="text-sm text-alabaster-grey-300 font-medium">
          Save your schedule as a high-definition PNG to your device.
        </p>

        <div className="space-y-3">
          <label className="text-xs font-bold text-alabaster-grey-300 uppercase tracking-widest block">
            File Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="My_Schedule"
              className="w-full px-4 py-3 text-sm font-semibold border-2 border-alabaster-grey/50 rounded-xl bg-white text-prussian-blue-200 focus:outline-none focus:border-prussian-blue-200 transition-all shadow-sm hover:shadow"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-alabaster-grey-400 font-medium text-sm">
              .png
            </div>
          </div>
        </div>

        <button
          onClick={() => onExportPNG(filename.trim() || "My_Schedule")}
          disabled={isExporting}
          className="w-full inline-flex items-center justify-center bg-[#fca311] text-black px-6 py-3 rounded-full text-base font-bold transition-all shadow-md hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isExporting ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full mr-2" />
              Generating…
            </>
          ) : (
            "Download PNG"
          )}
        </button>
      </div>
    </div>
  );
}
