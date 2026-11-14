# HEATNODE AI — Modern & Minimal Figma Design Spec

**Date:** 2026-11-14  
**Scope:** Citizen PWA Flow (`S01–S06`) + Authority Console (`/demo-authority`)  
**Target:** New Figma Design file (`yunusemre.celik's team`), 3 pages

---

## 1. Intent & Why
Current `frontend/src/components/` screens (`S01–S06`) are ultra-minimal button stacks with zero context: no app header, no Zero-PII privacy reassurance, no back/location-change navigation, and no concise guidance after submission or on the map. Meanwhile, `/demo-authority` needs a clean, scannable crisis-manager layout.

**Goal:** Create a modern, dark-mode Figma design containing **only the essential information and buttons** needed for clarity, trust, and fast action under stress.

**Non-Goals:** Modifying React/backend code in this phase (Figma design deliverable only).  
**Anti-Goals:** Cluttered dashboards, multi-paragraph text blocks, or small touch targets (< 48px on mobile).

---

## 2. Approaches Considered
1. **Modular Token System + Separate Pages per Flow (Chosen):** 3 pages (`01 · Tokens & Components`, `02 · Citizen Mobile (S01–S06)`, `03 · Authority Console`). Ensures visual consistency, clean presentation, and conflict-free parallel execution via `/swarm` (one page per designer).
2. **Single-Page Direct Wireframing:** Faster initial start, but risks inconsistent colors/spacing and causes page-level collisions in parallel swarm work.

---

## 3. Page & Screen Architecture

### Page 1: `01 · Tokens & Components`
- **Colors (Variables):**
  - Surface: `bg/canvas` (`#020617` Slate-950), `bg/card` (`#0F172A` Slate-900), `bg/elevated` (`#1E293B` Slate-800), `border/subtle` (`#334155`)
  - Text: `text/primary` (`#F8FAFC`), `text/secondary` (`#94A3B8`), `text/muted` (`#64748B`)
  - Semantic: `status/emergency` (`#DC2626`), `status/warning` (`#EA580C`), `status/safe` (`#15803D` / `#10B981`), `status/info` (`#2563EB`), `status/demo` (`#F59E0B`)
- **Core Components:**
  - `TopBar/Mobile` (App title + optional Back / Change Location action)
  - `Badge/Status` (`Zero-PII`, `Live`, `Acil`, `Normal`, `Demo`)
  - `Button/PrimaryAction` (min-height `64px–84px` for mobile, `44px` for desktop)

### Page 2: `02 · Citizen Mobile (S01–S06)` (`390 × 844` frames)
1. **S01 · Location Start:** App header (`HEATNODE AI · Antalya`), 1-line privacy assurance (`Zero-PII: GPS/kimlik kaydı tutulmaz`), 2 primary buttons (`Konuma İzin Ver`, `Konumu Manuel Seç`).
2. **S02 · Manual Location:** Top bar with Back button + 1-line hint (`Haritada bulunduğunuz noktaya dokunun`), interactive map area with pin, 1 primary button (`Konumu Onayla`).
3. **S03 · Main Choice:** Top bar with active location pill + `Konumu Değiştir` button, 3 clear action buttons (`Acil Durum Bildir`, `Normal Bildirim`, `Çevre Haritası`).
4. **S04 · Disaster Selection:** Top bar with Back button + selected mode badge (`Acil` or `Normal`), 2-column grid of disaster/heat hazard buttons (`Aşırı Sıcaklık`, `Yangın`, `Su Kesintisi`, `Elektrik`, `Sağlık`, `Diğer`).
5. **S05 · Submit Result:** Status card (`Bildirim Alındı` / `Hata`), 1-line next-step guidance (`En yakın soğutma/güvenli alana yönelin`), 2 buttons (`Haritayı Gör`, `Ana Seçime Dön` — or `Tekrar Dene` on error).
6. **S06 · Surrounding Map:** Top bar with `Canlı Akış` badge + `Ana Seçim` button, map with risk rings + safezone markers + route line, compact bottom card showing nearest safezone (`İsim · Mesafe`) + minimal 3-item legend (`Risk`, `Bildirim`, `Güvenli Alan`).

### Page 3: `03 · Authority Console (/demo-authority)` (`1440 × 900` frame)
- **Top Banner:** `DEMO — GERÇEK KURUM BİLDİRİMİ GÖNDERİLMEZ` + `Canlı Akış` badge + `Vatandaş PWA` switch button.
- **KPI Strip (3 compact cards):** `Aktif Güvenli Alan`, `Son Bildirimler`, `Yüksek Riskli Mahalle`.
- **Main Split:**
  - **Left (Map):** Antalya 24-node map with heat zones, safezone pins, and minimal legend.
  - **Right (Controls & Feed):** Safezone toggle list (node name + `Aktif/Pasif` toggle) and compact recent reports list.

---

## 4. Swarm Execution Plan
- **Step 1:** Create new Figma Design file (`HEATNODE AI — COP31 UI`), set up `01 · Tokens & Components`.
- **Step 2 (Parallel):**
  - `citizen-ui` builds `02 · Citizen Mobile (S01–S06)`
  - `authority-ui` builds `03 · Authority Console (/demo-authority)`
- **Step 3:** `verifier` inspects both pages via `get_metadata` and `get_screenshot` for alignment, clipping, and readability.
