# HEATNODE AI — 3-Minute COP31 Jury Pitch Script

- **Target Duration:** 3:00 (180 seconds)
- **Spoken Word Count:** ~435 words (~145 words/minute — natural, clear conference pace)
- **Format:** English live pitch + live/recorded prototype demonstration
- **Backup Plan:** If venue Wi-Fi drops, run locally (`uvicorn` + `vite`) using `data/fallback_weather.json` or play the pre-recorded 60-second demo video during `01:00–02:15`.

---

## Spoken Script & Second-by-Second Demo Choreography

### 00:00 – 00:35 | The Climate Problem & Dual Beneficiaries (~80 words)

**[Visual: Slide 1–2 — Antalya 45°C heatwave map + Kepez/Muratpaşa vulnerability contrast]**

> "Every summer, Antalya's urban core faces extreme heatwaves exceeding 45 degrees Celsius—and climate change is making them longer and deadlier. Yet heat risk isn't uniform: dense, low-canopy neighborhoods in **Kepez** trap heat hours longer than coastal districts, and wind carries that thermal stress downwind into **Muratpaşa**.
>
> **HEATNODE AI** is a zero-hardware, privacy-first Urban Heat Crisis Twin built for two beneficiaries: **Antalya Metropolitan Municipality and AFAD crisis managers** who need early operational clarity, and **vulnerable residents in Kepez and Muratpaşa** who need safe, actionable guidance."

---

### 00:35 – 01:05 | Architecture & Prior Work vs. Hackathon Additions (~75 words)

**[Visual: Slide 3 — 3-Stage AI Pipeline + Zero-PII Badge]**

> "Traditional IoT sensor networks cost millions. Instead, HEATNODE AI fuses free Open-Meteo weather data with anonymous, **zero-PII** neighborhood reports—no GPS, no logins, no IP logging.
>
> Our core 3-stage AI pipeline—built prior to this weekend—combines **DBSCAN and Isolation Forest** for anomaly verification, **XGBoost with SHAP** for 1-to-3-hour wind-advection forecasting, and **Weighted K-Means** for mobile cooling hub placement. During the **14–15 November hackathon**, we added **risk-aware safezone routing**, a **live multi-disaster map**, an **AI Model & Limitations transparency panel**, and this **English jury workflow**."

---

### 01:05 – 02:15 | Live / Recorded Prototype Demonstration (~175 words)

* **01:05 – 01:20 | Step 1: Baseline & Surge Injection**
  * **Demo Action:** Start on **Citizen View** (English default, status `Monitoring — No Active Emergency Alert`). Click **"Simulate Crowd Surge"** in the top bar.
  * **Spoken:**
    > "Let's see it live. Right now, Antalya's 24-node neighborhood graph is in baseline monitoring. I'll trigger a simulated 45-degree heatwave surge—injecting 42 anonymous reports across Kepez."

* **01:20 – 01:40 | Step 2: Anomaly Verification, Propagation & SHAP**
  * **Demo Action:** Switch to **Crisis Console**. Point to `PENDING_APPROVAL` badge. Toggle **+1h → +2h → +3h** horizon tabs to show directional wind-advection arrows moving from Kepez into Muratpaşa. Click `kepez_dokuma` to open the **SHAP Physical Drivers** bar chart.
  * **Spoken:**
    > "Switching to the Crisis Console, DBSCAN and Isolation Forest confirm a verified micro-climate anomaly, moving the system to `PENDING_APPROVAL`—notice citizens aren't panicked yet. Scrubbing **+1h to +3h**, XGBoost predicts thermal hazard propagating downwind into Muratpaşa, while SHAP explains *why*: wind vector alignment, urban heat retention, and report burst density."

* **01:40 – 02:00 | Step 3: Safezone Toggle & Human-in-the-Loop Approval**
  * **Demo Action:** Open the **Safezones / Demo Authority** panel, toggle an active safezone (e.g., `muratpasa_kaleici` or `kepez_dokuma`), set Hub Count `K=3`, and click **"Approve & Activate Public Alert"**.
  * **Spoken:**
    > "Crisis managers toggle safezone intersections, review Weighted K-Means cooling hub placements, and click **Approve & Activate**—keeping a human in the loop."

* **02:00 – 02:15 | Step 4: Citizen Risk-Aware Evacuation Routing**
  * **Demo Action:** Switch back to **Citizen View** (or **Surrounding Map**). Show the red **ACTIVE HEAT EMERGENCY ALERT** banner, nearest cooling hub card, and the green evacuation polyline routing *around* the 500-meter hazard circle.
  * **Spoken:**
    > "Instantly, Citizen View publishes the alert, displays the nearest cooling hub, and draws a **risk-aware Dijkstra evacuation route** that detours around active 500-meter hazard zones."

---

### 02:15 – 02:40 | Measured Results vs. Limitations & Transparency (~65 words)

**[Visual: Open the "AI Model & Limitations" modal briefly, or switch to Slide 6]**

> "We also built an **AI Model & Limitations** panel right into the console. On 5 years of Antalya hourly weather, our XGBoost model achieves **R² 0.99 at +1h** and **0.94 at +3h** on physics-proxy risk labels—verified by automated backend and frontend test suites and an offline weather fallback. Crucially, we disclose that these are *physics proxies*, not clinical outcomes."

---

### 02:40 – 03:00 | Expected Impact, Next Pilot & Close (~40 words)

**[Visual: Slide 7 — Roadmap & Antalya Pilot Partners]**

> "Our next step is a live pilot with **Antalya Metropolitan Municipality (AKOM)** and **MGM**, integrating **112 emergency and hospital heatstroke records** to turn measured model accuracy into real-world reduced heat-stress exposure. Thank you—we're ready for your questions."

---

## Timing & Delivery Checklist
- [ ] Rehearse with a stopwatch twice; target **02:50–02:58** to leave a 2-second buffer before the 3:00 bell.
- [ ] Pre-load browser tabs: App (Citizen View / Crisis Console) + PDF backup of slides.
- [ ] Verify default UI language is **English (`en`)** before stepping on stage.
- [ ] Keep the 60-second recorded demo MP4 ready on desktop in case live internet fails.
