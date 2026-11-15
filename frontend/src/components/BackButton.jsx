import { ArrowLeft } from "lucide-react";

export default function BackButton({ label, onClick, isRtl = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-[#232325] hover:bg-[#2c2c2f] border border-[#ededed]/[0.08] text-[#ededed] rounded-xl min-h-14 px-4 py-3 font-medium text-base flex items-center justify-center gap-2.5 active:scale-[0.98] unslop-transition cursor-pointer whitespace-normal break-words text-center"
    >
      <ArrowLeft
        className={`w-[18px] h-[18px] shrink-0 stroke-[1.5] ${isRtl ? "rotate-180" : ""}`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </button>
  );
}
