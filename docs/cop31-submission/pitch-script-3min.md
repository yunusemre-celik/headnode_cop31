# Heat Node — 3-Minute COP31 Pitch & Demo Video Script

- **Target Duration:** 3:00 (180 seconds)
- **Language:** English
- **Live URL:** https://heatnode-cop31.vercel.app/
- **Backup Plan:** Play the 60–90s recorded `.mp4` demo video embedded in Slide 5 if venue Wi-Fi drops.

---

## 0:00 – 0:35 | Climate Problem, Evidence & Dual Users (Slides 1–3)
> "This past summer, extreme heatwaves across Europe caused thousands of preventable deaths—proving that urban climate disasters hit dense neighborhoods hardest. And in Mediterranean cities like COP31 host **Antalya**, extreme heat and wildfires are now compounded by flash floods, hail, storms, and landslides.
>
> Yet cities lack block-level visibility without expensive IoT sensors, and residents lack safe evacuation routes. That's why we built **Heat Node**—a zero-hardware, no-login **10-hazard Multi-Disaster Urban Crisis Twin** for both vulnerable residents and municipal crisis managers."

## 0:35 – 1:15 | AI Approach & Data Sources (Slide 4)
> "How does Heat Node turn crowd reports into reliable action without false-alarm panic?
>
> First, **Isolation Forest** and spatiotemporal clustering filter out isolated noise and duplicate spam within a 500-meter radius. Second, an **XGBoost** model trained on 5 years of Open-Meteo Antalya weather predicts 1-to-3-hour hazard propagation, reaching **R² 0.99 at +1h** and **0.94 at +3h** on physics-proxy labels. Third, our **risk-aware Dijkstra router** computes evacuation paths across Antalya's 24-node neighborhood graph that actively detour around 500-meter hazard zones."

## 1:15 – 2:15 | Live / Recorded Prototype Walkthrough (Slide 5)
*[Action: Open https://heatnode-cop31.vercel.app/ — or play embedded demo video]*
> "Let's see it live. Notice there is **no login or account required**.
> 1. **0:00–0:15:** A resident can allow optional GPS or pick their location manually on the map.
> 2. **0:15–0:30:** They choose **Emergency** or **Normal** mode and report any of **10 climate hazards**—let's submit **Extreme Heat**.
> 3. **0:30–0:45:** Immediately, the **Surrounding Map** displays the 500-meter hazard zone, the AI risk score, and a **green risk-aware evacuation route** leading to the nearest active safezone.
> 4. **0:45–1:00:** In the **Demo Authority** panel, municipal operators can toggle safezones and watch citizen routes update in real time via Server-Sent Events—and inspect our **AI Model & Limitations** modal for full transparency."

## 2:15 – 3:00 | Hackathon Build, Limitations & Next Step (Slides 6–8)
> "Everything you see—from the 24-node graph and 5-year XGBoost pipeline to the 10-hazard UI, safezone routing, and Vercel/Railway deployment—was built during this hackathon, with **36 automated tests passing**.
>
> We are transparent about our limitations: our model currently uses physics-proxy labels rather than clinical records. Our next validation step is a **shadow-mode pilot with Antalya Metropolitan Municipality (AKOM) and MGM**, calibrating against anonymized 112 emergency and hospital data to protect lives before the next heatwave hits. Thank you."
