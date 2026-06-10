// src/components/export/ExportOverlay.jsx — PDF + PNG export buttons and mobile modal
"use client";

import { useState } from "react";

/**
 * Export overlay/modal triggered from the canvas toolbar.
 * Allows the user to set a custom file name and download as PNG.
 *
 * On mobile (< sm), renders as a bottom sheet that slides up.
 * On desktop, renders as a centered modal.
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
  inAppBrowserError,
}) {
  const [filename, setFilename] = useState("My_Schedule");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center max-sm:items-end bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 space-y-6 max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:mx-0 max-sm:w-full max-sm:max-w-full max-sm:p-6 max-sm:pb-10 max-sm:animate-slide-in-bottom">
        {/* Mobile drag handle indicator */}
        <div className="hidden max-sm:flex justify-center -mt-2 mb-2">
          <div className="w-10 h-1 bg-neutral-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-prussian-blue-200 tracking-wide max-sm:text-base">
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

        <p className="text-sm text-alabaster-grey-300 font-medium max-sm:text-xs">
          {inAppBrowserError 
            ? "Your browser is blocking downloads."
            : "Save your schedule as a high-definition PNG to your device."}
        </p>

        {inAppBrowserError ? (
          <div className="flex flex-col items-center gap-4 animate-fade-in w-full pb-2">
            <div className="bg-red-50 text-red-700 text-sm font-bold px-4 py-4 rounded-lg w-full text-center border border-red-200">
              Please open Gridworks in your local browser (Safari or Chrome) for full functionality. <br/><br/> Messenger does not support downloading or sharing images.
            </div>
          </div>
        ) : (
          <>
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
                  className="w-full px-4 py-3 text-sm font-semibold border-2 border-alabaster-grey/50 rounded-xl bg-white text-prussian-blue-200 focus:outline-none focus:border-prussian-blue-200 transition-all shadow-sm hover:shadow max-sm:text-base max-sm:py-3.5"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-alabaster-grey-400 font-medium text-sm">
                  .png
                </div>
              </div>
            </div>

            <button
              onClick={() => onExportPNG(filename.trim() || "My_Schedule")}
              disabled={isExporting}
              className="w-full inline-flex items-center justify-center bg-[#fca311] text-black px-6 py-3 rounded-full text-base font-bold transition-all shadow-md hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[48px]"
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
          </>
        )}
      </div>
    </div>
  );
}
