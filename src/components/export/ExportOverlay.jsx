// src/components/export/ExportOverlay.jsx — PDF + PNG export buttons and mobile modal
"use client";

/**
 * Export overlay/modal triggered from the canvas toolbar.
 * Shows export buttons and the mobile PDF instructions modal.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {function} props.onExportPNG
 * @param {function} props.onExportPDF
 * @param {boolean} props.isExporting — true while PNG is generating
 * @param {boolean} props.showMobileModal — true on mobile after PDF trigger
 * @param {function} props.onCloseMobileModal
 */
export default function ExportOverlay({
  isOpen,
  onClose,
  onExportPNG,
  onExportPDF,
  isExporting,
  showMobileModal,
  onCloseMobileModal,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-prussian-blue">
            Export Schedule
          </h3>
          <button
            onClick={onClose}
            className="text-alabaster-grey-400 hover:text-prussian-blue-700 transition-colors cursor-pointer text-xl leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-alabaster-grey-300">
          Download your schedule as a high-definition image or print-ready PDF.
        </p>

        <div className="space-y-3">
          {/* PNG Export */}
          <button
            onClick={onExportPNG}
            disabled={isExporting}
            className="w-full py-3 text-sm font-medium bg-prussian-blue text-white rounded-lg hover:bg-prussian-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                Generating image…
              </>
            ) : (
              "Export as PNG (HD)"
            )}
          </button>

          {/* PDF Export */}
          <button
            onClick={onExportPDF}
            className="w-full py-3 text-sm font-medium border border-alabaster-grey-400 rounded-lg hover:bg-alabaster-grey-900 transition-colors cursor-pointer"
          >
            Export as PDF
          </button>
        </div>

        {/* Mobile PDF Instructions Modal */}
        {showMobileModal && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
            <p className="text-sm font-medium text-amber-800">
              PDF Export on Mobile
            </p>
            <p className="text-xs text-amber-700">
              On mobile, use your browser&apos;s{" "}
              <strong>Share → Print</strong> menu and select{" "}
              <strong>Save as PDF</strong>.
            </p>
            <button
              onClick={onCloseMobileModal}
              className="text-xs text-amber-600 hover:text-amber-800 cursor-pointer"
            >
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
