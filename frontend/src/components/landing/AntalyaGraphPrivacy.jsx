import React, { useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Database,
  Lock,
  MapPin,
  Network,
  Play,
  ShieldCheck,
  Terminal,
} from "lucide-react";

const TOTAL_GRAPH_NODES = 24;

export default function AntalyaGraphPrivacy({ copy, onOpenApp, onOpenAuthority }) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  if (!copy) return null;

  const { graph, privacy, evidence, demo } = copy;
  const steps = demo.steps || [];
  const safeIndex = Math.min(activeStepIndex, Math.max(0, steps.length - 1));
  const currentStep = steps[safeIndex] || null;

  return (
    <div className="bg-[#141415] text-[#ededed]">
      {/* 04 // 24-Node / 92-Edge Antalya Topology */}
      <section
        id="graph"
        className="border-t border-[rgba(237,237,237,0.08)] bg-[#0f0f10] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 font-mono-tabular text-[11px] uppercase tracking-[0.14em] text-[#85858b]">
            <Network className="h-3.5 w-3.5" />
            <span>{graph.eyebrow}</span>
          </div>
          <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-[#ededed] sm:text-3xl">
            {graph.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#a1a1a6] sm:text-base">
            {graph.subtitle}
          </p>

          {/* Totals Strip */}
          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded border border-[rgba(237,237,237,0.08)] bg-[rgba(237,237,237,0.08)] sm:grid-cols-4">
            {graph.totals.map((metric) => (
              <div key={metric.label} className="bg-[#19191b] px-4 py-4">
                <div className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-[#85858b]">
                  {metric.label}
                </div>
                <div className="mt-1.5 font-mono-tabular text-lg font-semibold text-[#ededed] sm:text-xl">
                  {metric.value}
                </div>
              </div>
            ))}
          </div>

          {/* 3 District Cards */}
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {graph.districts.map((district) => {
              const widthPct = Math.round((district.nodes / TOTAL_GRAPH_NODES) * 100);
              return (
                <div
                  key={district.name}
                  className="flex flex-col justify-between rounded border border-[rgba(237,237,237,0.08)] bg-[#19191b] p-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-[#ededed]">
                        <MapPin className="h-4 w-4 text-[#dc2626]" />
                        {district.name}
                      </span>
                      <span className="font-mono-tabular text-xs text-[#a1a1a6]">
                        {district.share}
                      </span>
                    </div>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-mono-tabular text-2xl font-semibold text-[#ededed]">
                        {district.nodes}
                      </span>
                      <span className="font-mono-tabular text-xs uppercase tracking-wider text-[#85858b]">
                        / {TOTAL_GRAPH_NODES} NODES
                      </span>
                    </div>

                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#0f0f10]">
                      <div
                        className="h-full rounded-full bg-[#4cc38a]"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>

                    <p className="mt-4 text-xs leading-relaxed text-[#a1a1a6] sm:text-sm">
                      {district.profile}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 05 // Zero-PII KVKK & GDPR Architecture */}
      <section
        id="privacy"
        className="border-t border-[rgba(237,237,237,0.08)] bg-[#141415] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2 font-mono-tabular text-[11px] uppercase tracking-[0.14em] text-[#85858b]">
                <Lock className="h-3.5 w-3.5 text-[#4cc38a]" />
                <span>{privacy.eyebrow}</span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#ededed] sm:text-3xl">
                {privacy.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#a1a1a6] sm:text-base">
                {privacy.subtitle}
              </p>

              <ul className="mt-6 space-y-3">
                {privacy.guarantees.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 rounded border border-[rgba(237,237,237,0.08)] bg-[#19191b] px-3.5 py-3 text-xs leading-relaxed text-[#ededed]"
                  >
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#4cc38a]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded border border-[rgba(237,237,237,0.14)] bg-[#0f0f10]">
                <div className="flex items-center justify-between border-b border-[rgba(237,237,237,0.08)] bg-[#19191b] px-4 py-2.5">
                  <div className="flex items-center gap-2 font-mono-tabular text-xs text-[#ededed]">
                    <Database className="h-3.5 w-3.5 text-[#4cc38a]" />
                    <span>{privacy.schemaTitle}</span>
                  </div>
                  <span className="font-mono-tabular rounded border border-[rgba(76,195,138,0.3)] bg-[rgba(76,195,138,0.08)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#4cc38a]">
                    KVKK · GDPR
                  </span>
                </div>
                <pre className="overflow-x-auto p-4 font-mono-tabular text-xs leading-relaxed text-[#ededed] sm:p-5">
                  <code>{privacy.schemaCode}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 06 // Verified Evidence, Honest Limitations & Shadow-Mode Roadmap */}
      {evidence && (
        <section
          id="evidence"
          className="border-t border-[rgba(237,237,237,0.08)] bg-[#0f0f10] py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex items-center gap-2 font-mono-tabular text-[11px] uppercase tracking-[0.14em] text-[#85858b]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#4cc38a]" />
              <span>{evidence.eyebrow}</span>
            </div>
            <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-[#ededed] sm:text-3xl">
              {evidence.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#a1a1a6] sm:text-base">
              {evidence.subtitle}
            </p>

            {/* Measured Metrics Strip */}
            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded border border-[rgba(237,237,237,0.08)] bg-[rgba(237,237,237,0.08)] lg:grid-cols-4">
              {evidence.metrics.map((metric) => (
                <div key={metric.label} className="bg-[#19191b] px-4 py-4">
                  <div className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-[#85858b]">
                    {metric.label}
                  </div>
                  <div className="mt-1.5 font-mono-tabular text-sm font-semibold text-[#ededed] sm:text-base">
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Honest AI Limitations & Shadow-Mode Roadmap */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded border border-[rgba(237,237,237,0.08)] bg-[#141415] p-5">
                <div className="font-mono-tabular text-xs font-semibold uppercase tracking-[0.12em] text-[#d97706]">
                  {evidence.limitationsTitle}
                </div>
                <div className="mt-4 space-y-3">
                  {evidence.limitations.map((item) => (
                    <div
                      key={item.tag}
                      className="rounded border border-[rgba(237,237,237,0.08)] bg-[#19191b] p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#ededed]">
                          {item.title}
                        </span>
                        <span className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#d97706]">
                          {item.tag}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#a1a1a6]">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded border border-[rgba(237,237,237,0.08)] bg-[#141415] p-5">
                <div className="font-mono-tabular text-xs font-semibold uppercase tracking-[0.12em] text-[#4cc38a]">
                  {evidence.roadmapTitle}
                </div>
                <div className="mt-4 space-y-3">
                  {evidence.roadmap.map((item) => (
                    <div
                      key={item.step}
                      className="rounded border border-[rgba(237,237,237,0.08)] bg-[#19191b] p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#ededed]">
                          {item.title}
                        </span>
                        <span className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#4cc38a]">
                          STEP {item.step}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#a1a1a6]">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 07 // Interactive 7-Step COP31 Live Demo Walkthrough + Bottom Dual CTA */}
      <section
        id="demo"
        className="border-t border-[rgba(237,237,237,0.08)] bg-[#0f0f10] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 font-mono-tabular text-[11px] uppercase tracking-[0.14em] text-[#85858b]">
            <Terminal className="h-3.5 w-3.5" />
            <span>{demo.eyebrow}</span>
          </div>
          <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-[#ededed] sm:text-3xl">
            {demo.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#a1a1a6] sm:text-base">
            {demo.subtitle}
          </p>

          {/* Interactive 7-Step Strip + Inspector */}
          <div className="mt-8 grid gap-4 lg:grid-cols-12">
            <div className="space-y-2 lg:col-span-7">
              {steps.map((item, idx) => {
                const isActive = idx === safeIndex;
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setActiveStepIndex(idx)}
                    aria-pressed={isActive}
                    className={`unslop-transition flex w-full items-center justify-between gap-3 rounded border px-4 py-3 text-left ${
                      isActive
                        ? "border-[#4cc38a] bg-[#19191b]"
                        : "border-[rgba(237,237,237,0.08)] bg-[#141415] hover:border-[rgba(237,237,237,0.18)] hover:bg-[#19191b]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`font-mono-tabular shrink-0 rounded border px-2 py-0.5 text-[11px] font-semibold ${
                          isActive
                            ? "border-[#4cc38a] bg-[rgba(76,195,138,0.12)] text-[#4cc38a]"
                            : "border-[rgba(237,237,237,0.12)] text-[#85858b]"
                        }`}
                      >
                        {item.step}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-[#ededed]">
                          {item.title}
                        </div>
                        <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#85858b]">
                          {item.actor}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? "text-[#4cc38a]" : "text-[#85858b]"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Active Step Detail Inspector */}
            <div className="lg:col-span-5">
              {currentStep && (
                <div className="flex h-full flex-col justify-between rounded border border-[rgba(237,237,237,0.14)] bg-[#19191b] p-5 sm:p-6">
                  <div>
                    <div className="flex items-center justify-between border-b border-[rgba(237,237,237,0.08)] pb-3">
                      <span className="inline-flex items-center gap-2 font-mono-tabular text-xs font-semibold text-[#4cc38a]">
                        <Play className="h-3.5 w-3.5" />
                        STEP {currentStep.step} / 0{steps.length}
                      </span>
                      <span className="font-mono-tabular rounded border border-[rgba(237,237,237,0.12)] bg-[#0f0f10] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#a1a1a6]">
                        {currentStep.actor}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-semibold tracking-tight text-[#ededed]">
                      {currentStep.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-[#a1a1a6]">
                      {currentStep.detail}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-[rgba(237,237,237,0.08)] pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                      disabled={safeIndex === 0}
                      className="unslop-transition inline-flex items-center gap-1.5 rounded border border-[rgba(237,237,237,0.14)] bg-[#141415] px-3 py-1.5 font-mono-tabular text-xs text-[#ededed] hover:bg-[#232325] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      PREV
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveStepIndex((prev) => Math.min(steps.length - 1, prev + 1))
                      }
                      disabled={safeIndex === steps.length - 1}
                      className="unslop-transition inline-flex items-center gap-1.5 rounded border border-[rgba(237,237,237,0.14)] bg-[#141415] px-3 py-1.5 font-mono-tabular text-xs text-[#ededed] hover:bg-[#232325] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      NEXT
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Dual CTA */}
          <div className="mt-12 rounded border border-[rgba(237,237,237,0.14)] bg-[#19191b] p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h3 className="text-xl font-semibold tracking-tight text-[#ededed] sm:text-2xl">
                  {demo.bottomTitle}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#a1a1a6]">
                  {demo.bottomSubtitle}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={onOpenApp}
                  className="unslop-transition inline-flex items-center justify-center gap-2 rounded bg-[#ededed] px-5 py-3 text-sm font-medium text-[#141415] hover:bg-white"
                >
                  <span>{demo.ctaApp}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onOpenAuthority}
                  className="unslop-transition inline-flex items-center justify-center gap-2 rounded border border-[rgba(237,237,237,0.18)] bg-[#141415] px-5 py-3 text-sm font-medium text-[#ededed] hover:border-[rgba(237,237,237,0.3)] hover:bg-[#232325]"
                >
                  <span>{demo.ctaAuthority}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
