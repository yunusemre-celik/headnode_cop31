import { ArrowLeft } from "lucide-react";

export default function BackButton({ label, onClick, isRtl = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ backgroundColor: "#4B5563" }}
      className="w-full min-h-[56px] px-5 py-3.5 rounded-2xl text-white font-semibold text-base sm:text-lg flex items-center justify-center gap-3 shadow-md active:scale-[0.99] transition-transform cursor-pointer whitespace-normal break-words text-center"
    >
      <ArrowLeft
        className={`w-5 h-5 shrink-0 ${isRtl ? "rotate-180" : ""}`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </button>
  );
}
