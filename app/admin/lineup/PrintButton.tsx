'use client';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="min-h-11 rounded-lg bg-[#DC143C] px-5 text-sm font-bold text-white transition hover:bg-[#b01030]"
    >
      Save as PDF
    </button>
  );
}
