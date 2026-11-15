import { Activity } from "lucide-react";
import { LANDING_COPY } from "./landingCopy.js";
import HeroNetworkCanvas from "./HeroNetworkCanvas.jsx";
import ScrollStoryPipeline from "./ScrollStoryPipeline.jsx";
import AntalyaGraphPrivacy from "./AntalyaGraphPrivacy.jsx";

export default function LandingPage({
  lang = "en",
  onChangeLang,
  onOpenApp,
  onOpenAuthority,
}) {
  const copy = LANDING_COPY[lang] || LANDING_COPY.en;

  return (
    <div className="min-h-dvh bg-[#141415] text-[#ededed]">
      <header className="sticky top-0 z-40 border-b border-[rgba(237,237,237,0.08)] bg-[#141415]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <a
              href="#network"
              className="flex items-center gap-2 text-sm font-semibold tracking-tight text-[#ededed]"
            >
              <Activity className="h-4 w-4 text-[#dc2626]" aria-hidden="true" />
              <span>{copy.nav.brand}</span>
            </a>
            <span className="font-mono-tabular hidden border border-[rgba(237,237,237,0.08)] bg-[#19191b] px-2 py-0.5 text-[10px] tracking-wider text-[#a1a1a6] sm:inline-block">
              {copy.nav.tag}
            </span>
          </div>

          <nav
            aria-label="Landing sections"
            className="hidden items-center gap-5 lg:flex"
          >
            {copy.nav.links.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="unslop-transition text-xs font-medium text-[#a1a1a6] hover:text-[#ededed]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Language toggle"
              className="inline-flex border border-[rgba(237,237,237,0.14)] bg-[#19191b]"
            >
              <button
                type="button"
                onClick={() => onChangeLang?.("tr")}
                aria-pressed={lang === "tr"}
                className={`unslop-transition font-mono-tabular px-2.5 py-1 text-xs font-medium cursor-pointer ${
                  lang === "tr"
                    ? "bg-[#ededed] text-[#141415]"
                    : "text-[#a1a1a6] hover:text-[#ededed]"
                }`}
              >
                TR
              </button>
              <button
                type="button"
                onClick={() => onChangeLang?.("en")}
                aria-pressed={lang === "en"}
                className={`unslop-transition font-mono-tabular border-l border-[rgba(237,237,237,0.08)] px-2.5 py-1 text-xs font-medium cursor-pointer ${
                  lang === "en"
                    ? "bg-[#ededed] text-[#141415]"
                    : "text-[#a1a1a6] hover:text-[#ededed]"
                }`}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenApp}
              className="unslop-transition border border-[#dc2626] bg-[#dc2626] px-3 py-1.5 text-xs font-medium text-[#ededed] hover:bg-[#b91c1c] cursor-pointer"
            >
              {copy.nav.openApp}
            </button>

            <button
              type="button"
              onClick={onOpenAuthority}
              className="unslop-transition hidden border border-[rgba(237,237,237,0.14)] bg-[#19191b] px-3 py-1.5 text-xs font-medium text-[#ededed] hover:border-[rgba(237,237,237,0.28)] hover:bg-[#232325] cursor-pointer sm:inline-flex"
            >
              {copy.nav.openAuthority}
            </button>
          </div>
        </div>
      </header>

      <main>
        <HeroNetworkCanvas
          copy={copy.hero}
          onOpenApp={onOpenApp}
          onOpenAuthority={onOpenAuthority}
        />
        <ScrollStoryPipeline copy={copy} />
        <AntalyaGraphPrivacy
          copy={copy}
          onOpenApp={onOpenApp}
          onOpenAuthority={onOpenAuthority}
        />
      </main>

      {copy.footer && (
        <footer className="border-t border-[rgba(237,237,237,0.08)] bg-[#0f0f10] py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="space-y-2">
              <div className="font-mono-tabular text-[11px] uppercase tracking-[0.14em] text-[#85858b]">
                {copy.footer.teamLabel}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#a1a1a6]">
                <span className="font-mono-tabular text-[#85858b]">
                  {copy.footer.builtBy}:
                </span>
                {copy.footer.members.map((member, index) => (
                  <span key={member.name} className="inline-flex items-center gap-2">
                    {member.url ? (
                      <a
                        href={member.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="unslop-transition font-medium text-[#ededed] underline decoration-[rgba(237,237,237,0.28)] underline-offset-4 hover:text-[#4cc38a] hover:decoration-[#4cc38a]"
                      >
                        {member.name}
                      </a>
                    ) : (
                      <span className="text-[#ededed]">{member.name}</span>
                    )}
                    {index < copy.footer.members.length - 1 && (
                      <span className="text-[#85858b]">·</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {copy.footer.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="unslop-transition rounded border border-[rgba(237,237,237,0.12)] bg-[#19191b] px-3 py-1.5 font-mono-tabular text-[11px] text-[#ededed] hover:border-[rgba(237,237,237,0.28)] hover:bg-[#232325]"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
