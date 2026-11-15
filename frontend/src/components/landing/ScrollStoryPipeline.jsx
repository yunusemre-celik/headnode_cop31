import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Radio,
  ShieldAlert,
  Users,
} from "lucide-react";

function prefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useScrollReveal() {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(() => {
    if (typeof IntersectionObserver === "undefined" || prefersReducedMotion()) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (revealed) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined" || prefersReducedMotion()) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [revealed]);

  return [ref, revealed];
}

function RevealBlock({ children, className = "", delayMs = 0 }) {
  const [ref, revealed] = useScrollReveal();
  const reduced = prefersReducedMotion();

  return (
    <div
      ref={ref}
      style={
        reduced
          ? undefined
          : {
              transitionProperty: "opacity, transform",
              transitionDuration: "500ms",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              transitionDelay: `${delayMs}ms`,
            }
      }
      className={`${
        revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      } ${className}`}
    >
      {children}
    </div>
  );
}

const ACTOR_ICONS = [Users, Cpu, Radio];

export default function ScrollStoryPipeline({ copy }) {
  if (!copy) return null;

  const { cooperation, pipeline, hitl } = copy;

  return (
    <div className="bg-[#141415] text-[#ededed]">
      {/* 01 // Cooperation Thesis */}
      <section
        id="cooperation"
        className="border-t border-[rgba(237,237,237,0.08)] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <RevealBlock>
            <p className="font-mono-tabular text-[11px] uppercase tracking-[0.14em] text-[#85858b]">
              {cooperation.eyebrow}
            </p>
            <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-[#ededed] sm:text-3xl">
              {cooperation.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#a1a1a6] sm:text-base">
              {cooperation.subtitle}
            </p>
          </RevealBlock>

          {/* Isolated vs Cooperative Comparison */}
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <RevealBlock delayMs={40}>
              <div className="h-full rounded border border-[rgba(237,237,237,0.08)] bg-[#19191b] p-5 sm:p-6">
                <div className="flex items-center justify-between border-b border-[rgba(237,237,237,0.08)] pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[#dc2626]" />
                    <h3 className="text-sm font-semibold tracking-tight text-[#ededed]">
                      {cooperation.isolatedTitle}
                    </h3>
                  </div>
                  <span className="font-mono-tabular rounded border border-[rgba(220,38,38,0.3)] bg-[rgba(220,38,38,0.08)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#dc2626]">
                    FRAGMENTED
                  </span>
                </div>
                <ul className="mt-4 space-y-4">
                  {cooperation.isolatedItems.map((item) => (
                    <li
                      key={item.label}
                      className="border-l-2 border-[rgba(220,38,38,0.45)] pl-3.5"
                    >
                      <div className="font-mono-tabular text-xs font-medium text-[#ededed]">
                        {item.label}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#a1a1a6] sm:text-sm">
                        {item.detail}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealBlock>

            <RevealBlock delayMs={100}>
              <div className="h-full rounded border border-[rgba(76,195,138,0.22)] bg-[#19191b] p-5 sm:p-6">
                <div className="flex items-center justify-between border-b border-[rgba(237,237,237,0.08)] pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#4cc38a]" />
                    <h3 className="text-sm font-semibold tracking-tight text-[#ededed]">
                      {cooperation.cooperativeTitle}
                    </h3>
                  </div>
                  <span className="font-mono-tabular rounded border border-[rgba(76,195,138,0.3)] bg-[rgba(76,195,138,0.08)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#4cc38a]">
                    COOPERATIVE
                  </span>
                </div>
                <ul className="mt-4 space-y-4">
                  {cooperation.cooperativeItems.map((item) => (
                    <li
                      key={item.label}
                      className="border-l-2 border-[#4cc38a] pl-3.5"
                    >
                      <div className="font-mono-tabular text-xs font-medium text-[#ededed]">
                        {item.label}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#a1a1a6] sm:text-sm">
                        {item.detail}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealBlock>
          </div>

          {/* 3 Cooperative Actors */}
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {cooperation.actors.map((actor, idx) => {
              const Icon = ACTOR_ICONS[idx % ACTOR_ICONS.length];
              return (
                <RevealBlock key={actor.role} delayMs={60 * (idx + 1)}>
                  <div className="h-full rounded border border-[rgba(237,237,237,0.08)] bg-[#0f0f10] p-5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 font-mono-tabular text-xs font-semibold tracking-wider text-[#ededed]">
                        <Icon className="h-3.5 w-3.5 text-[#a1a1a6]" />
                        {actor.role}
                      </span>
                      <span className="font-mono-tabular text-[11px] text-[#4cc38a]">
                        {actor.metric}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-[#a1a1a6]">
                      {actor.description}
                    </p>
                  </div>
                </RevealBlock>
              );
            })}
          </div>
        </div>
      </section>

      {/* 02 // 3-Stage Explainable ML Pipeline */}
      <section
        id="pipeline"
        className="border-t border-[rgba(237,237,237,0.08)] bg-[#0f0f10] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <RevealBlock>
            <div className="flex items-center gap-2 font-mono-tabular text-[11px] uppercase tracking-[0.14em] text-[#85858b]">
              <Layers className="h-3.5 w-3.5" />
              <span>{pipeline.eyebrow}</span>
            </div>
            <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-[#ededed] sm:text-3xl">
              {pipeline.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#a1a1a6] sm:text-base">
              {pipeline.subtitle}
            </p>
          </RevealBlock>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {pipeline.stages.map((stage, idx) => (
              <RevealBlock key={stage.stage} delayMs={70 * idx}>
                <article className="flex h-full flex-col rounded border border-[rgba(237,237,237,0.08)] bg-[#19191b] p-5 sm:p-6">
                  <div
                    className="h-0.5 w-full rounded-full"
                    style={{ backgroundColor: stage.accent }}
                  />
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="font-mono-tabular text-[11px] font-semibold tracking-wider text-[#85858b]">
                      {stage.stage}
                    </span>
                    <span
                      className="font-mono-tabular rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider"
                      style={{
                        color: stage.accent,
                        borderColor: `${stage.accent}44`,
                        backgroundColor: `${stage.accent}12`,
                      }}
                    >
                      {stage.badge}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-[#ededed]">
                    {stage.name}
                  </h3>

                  <div className="mt-2 inline-flex items-center gap-1.5 font-mono-tabular text-[11px] text-[#ededed]">
                    <Activity
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: stage.accent }}
                    />
                    <span>{stage.threshold}</span>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-[#a1a1a6] sm:text-sm">
                    {stage.summary}
                  </p>

                  <ul className="mt-4 space-y-2.5 border-t border-[rgba(237,237,237,0.08)] pt-4">
                    {stage.specs.map((spec) => (
                      <li
                        key={spec}
                        className="flex items-start gap-2.5 text-xs leading-relaxed text-[#a1a1a6]"
                      >
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: stage.accent }}
                        />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* 03 // HITL State Machine */}
      <section
        id="hitl"
        className="border-t border-[rgba(237,237,237,0.08)] bg-[#141415] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <RevealBlock>
            <div className="flex items-center gap-2 font-mono-tabular text-[11px] uppercase tracking-[0.14em] text-[#85858b]">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>{hitl.eyebrow}</span>
            </div>
            <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-[#ededed] sm:text-3xl">
              {hitl.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#a1a1a6] sm:text-base">
              {hitl.subtitle}
            </p>
          </RevealBlock>

          <div className="mt-10 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {hitl.states.map((item, idx) => (
              <React.Fragment key={item.state}>
                <RevealBlock delayMs={80 * idx}>
                  <div className="flex h-full flex-col justify-between rounded border border-[rgba(237,237,237,0.08)] bg-[#19191b] p-5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 font-mono-tabular text-xs font-semibold tracking-wider text-[#ededed]">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.accent }}
                          />
                          {item.state}
                        </span>
                        <span className="font-mono-tabular text-[11px] text-[#85858b]">
                          0{idx + 1}
                        </span>
                      </div>

                      <div className="mt-3 rounded border border-[rgba(237,237,237,0.08)] bg-[#0f0f10] px-3 py-2 font-mono-tabular text-[11px] text-[#a1a1a6]">
                        {item.trigger}
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-[#a1a1a6] sm:text-sm">
                        {item.action}
                      </p>
                    </div>
                  </div>
                </RevealBlock>

                {idx < hitl.states.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="flex items-center justify-center py-1 text-[#85858b] lg:px-1"
                  >
                    <ArrowRight className="hidden h-4 w-4 lg:block" />
                    <ArrowDown className="h-4 w-4 lg:hidden" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
