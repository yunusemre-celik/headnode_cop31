export const LANDING_COPY = {
  en: {
    nav: {
      brand: "HEATNODE AI",
      tag: "COP31 ANTALYA",
      links: [
        { id: "cooperation", label: "Cooperation" },
        { id: "pipeline", label: "ML Pipeline" },
        { id: "hitl", label: "HITL" },
        { id: "graph", label: "24-Node Graph" },
        { id: "privacy", label: "Zero-PII" },
        { id: "demo", label: "COP31 Demo" },
      ],
      openApp: "Citizen App (/app)",
      openAuthority: "Crisis Console",
    },
    hero: {
      eyebrow: "COP31 MULTI-DISASTER URBAN CRISIS TWIN · ANTALYA PILOT",
      title: "Human cooperation, accelerated to machine speed.",
      subtitle:
        "From 45°C+ heatwaves and wildfires to flash floods, storms, hail, and landslides—sensors alone miss street-level microclimates. HEATNODE AI fuses 1-tap anonymous citizen reports across 10 climate hazards, 5-year Open-Meteo XGBoost forecasting (R² = 0.9905 at +1h), and risk-aware Dijkstra safezone routing.",
      telemetry: [
        { label: "GRAPH & HAZARDS", value: "24 NODES · 92 EDGES · 10 HAZARDS" },
        { label: "FORECAST (+1H)", value: "XGBOOST R² 0.9905 · RMSE 1.94" },
        { label: "PRIVACY & WEIGHTS", value: "ZERO-PII · GPS 2.0x / MAP 0.5x" },
      ],
      ctaApp: "Launch Citizen App (/app)",
      ctaAuthority: "Open Crisis Console (/demo-authority)",
      canvasCaption: "GLOBAL-TO-ANTALYA COOPERATIVE TELEMETRY MESH",
      legend: [
        { key: "signal", label: "500m Hazard Signal", color: "#dc2626" },
        { key: "pending", label: "Pending HITL Verification", color: "#d97706" },
        { key: "verified", label: "Active Dijkstra Safezone", color: "#4cc38a" },
      ],
    },
    cooperation: {
      eyebrow: "01 // COOPERATION THESIS",
      title: "Why isolated crisis response fails—and cooperative meshes survive.",
      subtitle:
        "Urban heatwaves kill in micro-pockets between sparse weather stations. Survival requires three actors sharing one verifiable state machine without surrendering citizen privacy.",
      isolatedTitle: "Isolated Response (Status Quo)",
      isolatedItems: [
        {
          label: "Sparse Telemetry",
          detail: "Airport or coastal weather stations miss +4.5°C concrete canyon spikes two blocks away.",
        },
        {
          label: "Unverified Noise",
          detail: "Social media reports lack spatial clustering, causing either alert fatigue or delayed dispatch.",
        },
        {
          label: "Static Shelters",
          detail: "Fixed cooling centers sit empty while heat plumes shift downwind across neighborhoods.",
        },
      ],
      cooperativeTitle: "HEATNODE Cooperative Mesh",
      cooperativeItems: [
        {
          label: "Citizen Micro-Signals",
          detail: "Zero-account, zero-GPS-permission reports pinpointed to the nearest 24-node street intersection.",
        },
        {
          label: "Explainable ML Filtering",
          detail: "DBSCAN + Isolation Forest strips spoofing and isolates real >=10/20m thermal clusters.",
        },
        {
          label: "Municipal HITL Dispatch",
          detail: "Human operators approve K-Means cooling hubs with SHAP feature attribution before public broadcast.",
        },
      ],
      actors: [
        {
          role: "CITIZEN",
          metric: "< 15s REPORT",
          description: "Contributes coarse intersection heat/smoke signal with zero PII or account creation.",
        },
        {
          role: "AI ENGINE",
          metric: "+1h / +2h / +3h",
          description: "Clusters anomalies, forecasts wind-driven heat advection, and snaps K=1..5 hubs to safe intersections.",
        },
        {
          role: "MUNICIPALITY",
          metric: "HITL GATE",
          description: "Verifies anomaly telemetry and activates mobile misting/cooling units without false-alarm panic.",
        },
      ],
    },
    pipeline: {
      eyebrow: "02 // 3-STAGE EXPLAINABLE ML PIPELINE",
      title: "From noisy crowd reports to wind-advected cooling coordinates.",
      subtitle:
        "Every automated recommendation is auditable. No black-box thresholds—each stage outputs deterministic metrics and SHAP attributions.",
      stages: [
        {
          stage: "STAGE 01",
          name: "Isolation Forest + Spatiotemporal Clustering",
          threshold: "500M RADIUS · 30-MIN WINDOW",
          badge: "ANOMALY & SPAM FILTERING",
          accent: "#dc2626",
          summary:
            "Filters isolated noise and duplicate bursts across 10 climate hazards using 5 weather/crowd features and weighted signal trust.",
          specs: [
            "IsolationForest (5 weather & crowd features) flags off-pattern bursts vs. Open-Meteo baseline.",
            "Spatiotemporal clustering enforces a 500 m radius and 30-minute duplicate suppression window.",
            "Trust weighting: optional GPS reports carry 2.0x weight; manual map selections carry 0.5x weight.",
          ],
        },
        {
          stage: "STAGE 02",
          name: "XGBoost + SHAP TreeExplainer",
          threshold: "+1H R² 0.9905 · +3H R² 0.9387",
          badge: "1–3H PROPAGATION FORECAST",
          accent: "#d97706",
          summary:
            "Trained on 5 years of Open-Meteo Antalya weather (2021–2026) to forecast block-by-block propagation on physics-proxy labels.",
          specs: [
            "Achieves +1h R² = 0.9905 (RMSE 1.94) and +3h R² = 0.9387 (RMSE 4.84) on physics-proxy labels.",
            "Computes directional advection across 92 directed graph edges using wind, solar, and urban density.",
            "AI Transparency modal exposes SHAP TreeExplainer weights (wind vector, retention, crowd velocity).",
          ],
        },
        {
          stage: "STAGE 03",
          name: "Risk-Aware Dijkstra + Weighted K-Means",
          threshold: "500M DETOURS · LIVE SSE",
          badge: "SAFEZONE EVACUATION & HUBS",
          accent: "#4cc38a",
          summary:
            "Routes citizens around active 500 m hazard zones to active safezones while AKOM/AFAD operators control live dispatch via SSE.",
          specs: [
            "Risk-aware Dijkstra router across 24 Antalya nodes & 92 directed edges detours around 500 m hazard zones.",
            "Weighted K-Means (K=1..5) snaps mobile cooling/relief hubs to vetted civic intersections.",
            "Live Server-Sent Events (SSE) push municipal safezone activations to citizen /app maps immediately.",
          ],
        },
      ],
    },
    hitl: {
      eyebrow: "03 // HUMAN-IN-THE-LOOP LIFECYCLE",
      title: "Automated detection. Human-gated public activation.",
      subtitle:
        "AI never triggers city-wide emergency broadcasts autonomously. Operators inspect DBSCAN density and SHAP drivers before flipping the state machine.",
      states: [
        {
          state: "MONITORING",
          accent: "#85858b",
          trigger: "Baseline telemetry (< 10 reports / 20m)",
          action: "Ingests anonymous reports and updates 5-year Open-Meteo baseline without public alerts.",
        },
        {
          state: "PENDING_APPROVAL",
          accent: "#d97706",
          trigger: "DBSCAN cluster >= 10 reports/20m verified",
          action: "Locks candidate K-Means hubs + SHAP breakdown in /demo-authority for municipal operator review.",
        },
        {
          state: "ACTIVE",
          accent: "#4cc38a",
          trigger: "Operator signs off dispatch",
          action: "Broadcasts verified safe cooling intersections to all /app citizen devices in real time.",
        },
      ],
    },
    graph: {
      eyebrow: "04 // 24-NODE / 92-EDGE ANTALYA TOPOLOGY",
      title: "Modeled on Antalya's real urban heat islands.",
      subtitle:
        "Instead of arbitrary grid squares, HEATNODE models 24 high-risk intersections connected by 92 weighted advection edges across three core districts.",
      totals: [
        { label: "TOTAL NODES", value: "24" },
        { label: "DIRECTED EDGES", value: "92" },
        { label: "WEATHER HISTORY", value: "5 YR OPEN-METEO" },
        { label: "HUB CAPACITY", value: "K = 1..5" },
      ],
      districts: [
        {
          name: "Kepez",
          nodes: 10,
          share: "41.7%",
          profile: "Inland concrete & industrial heat-retention basin; minimal sea-breeze relief, highest afternoon thermal lag.",
        },
        {
          name: "Muratpaşa",
          nodes: 8,
          share: "33.3%",
          profile: "Dense commercial corridors and historic fabric; high pedestrian exposure and canyon heat trapping.",
        },
        {
          name: "Konyaaltı",
          nodes: 6,
          share: "25.0%",
          profile: "Coastal wind-advection corridor & high-density visitor zones; sensitive to afternoon wind-shift plumes.",
        },
      ],
    },
    privacy: {
      eyebrow: "05 // ZERO-PII KVKK & GDPR ARCHITECTURE",
      title: "Privacy by schema, not by policy promise.",
      subtitle:
        "No user accounts, no browser fingerprinting, no IP logging, and no mandatory GPS permission. Citizens can select an intersection manually and still save lives.",
      guarantees: [
        "No phone number, email, device ID, or IP address column exists in SQLite.",
        "Coordinates are snapped to coarse public node/intersection buckets—never home addresses.",
        "Works identically with GPS denied via manual 24-node intersection selection.",
      ],
      schemaTitle: "backend/db.py — SQLite `reports` table",
      schemaCode: `CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT UNIQUE NOT NULL,
  node_id TEXT NOT NULL,
  disaster_type TEXT NOT NULL,
  severity INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
-- Zero PII: no ip_address, no user_id, no device_fingerprint, no exact home GPS`,
    },
    evidence: {
      eyebrow: "06 // VERIFIED EVIDENCE, HONEST LIMITATIONS & ROADMAP",
      title: "Measured performance today. Transparent boundaries for tomorrow.",
      subtitle:
        "Built for jury scrutiny during the COP31 Hackathon sprint: every metric is measured, every model limitation is disclosed, and the Antalya shadow-mode pilot path is defined.",
      metrics: [
        { label: "XGBOOST +1H", value: "R² 0.9905 · RMSE 1.94" },
        { label: "XGBOOST +3H", value: "R² 0.9387 · RMSE 4.84" },
        { label: "HAZARD SCOPE", value: "10 CLIMATE HAZARDS · 500M" },
        { label: "VERIFICATION", value: "25 PYTEST · 14 VITEST · 200 OK" },
      ],
      limitationsTitle: "Honest AI Limitations (Responsible AI)",
      limitations: [
        {
          tag: "LIMITATION 01",
          title: "Physics-Proxy Labels",
          detail: "Training uses physics-proxy equations (UTCI, wind advection, urban density) — not clinical 112 or hospital records.",
        },
        {
          tag: "LIMITATION 02",
          title: "Characteristic Profiles",
          detail: "Live inference uses characteristic disaster weather profiles without physical street-level IoT sensors.",
        },
        {
          tag: "LIMITATION 03",
          title: "Pilot Geography",
          detail: "Routing graph currently covers Antalya's 24-node urban topology across Kepez, Muratpaşa, and Konyaaltı.",
        },
      ],
      roadmapTitle: "Next Step: Shadow-Mode Pilot in Antalya",
      roadmap: [
        {
          step: "01",
          title: "Municipal Shadow-Mode Pilot",
          detail: "Partner with Antalya Metropolitan Municipality (AKOM) and MGM during peak heat and storm periods.",
        },
        {
          step: "02",
          title: "Clinical 112 Calibration",
          detail: "Calibrate XGBoost risk weights against anonymized 112 emergency dispatch and hospital heatstroke/disaster logs.",
        },
        {
          step: "03",
          title: "Scale Beyond Antalya",
          detail: "Replicate the zero-hardware 24-node graph template across European and Mediterranean cities (MIT Open Source).",
        },
      ],
    },
    demo: {
      eyebrow: "06 // COP31 3-MINUTE LIVE DEMO WALKTHROUGH",
      title: "Test the full cooperative loop live.",
      subtitle:
        "Click any step below to inspect how a COP31 jury member can trigger the entire pipeline from Citizen Report to Municipal Activation.",
      steps: [
        {
          step: "01",
          actor: "CITIZEN (/app)",
          title: "Choose Manual Location (Zero GPS)",
          detail: "Open /app, skip browser GPS permission, and select a Kepez or Muratpaşa intersection.",
        },
        {
          step: "02",
          actor: "CITIZEN (/app)",
          title: "Submit Thermal / Heatwave Signal",
          detail: "Pick Heatwave or Wildfire Smoke and submit. Only node_id, severity, and request_id are stored.",
        },
        {
          step: "03",
          actor: "SIMULATION",
          title: "Reach >= 10 Reports / 20m Threshold",
          detail: "Trigger the burst simulator or submit additional signals so DBSCAN + Isolation Forest validates the cluster.",
        },
        {
          step: "04",
          actor: "AI ENGINE",
          title: "Run XGBoost +1h/+2h/+3h Advection",
          detail: "Stage 2 computes downwind heat propagation and attaches SHAP TreeExplainer feature weights.",
        },
        {
          step: "05",
          actor: "HITL CONSOLE",
          title: "Inspect PENDING_APPROVAL Queue",
          detail: "Open /demo-authority to review cluster confidence, SHAP drivers, and K-Means candidate hubs.",
        },
        {
          step: "06",
          actor: "MUNICIPALITY",
          title: "Approve Cooling Hub Dispatch",
          detail: "Click Approve in /demo-authority to transition the state machine from PENDING_APPROVAL to ACTIVE.",
        },
        {
          step: "07",
          actor: "CITIZEN (/app)",
          title: "Verify Live Safe Hub Routing",
          detail: "Return to /app surrounding map to see the newly activated cooling hub snapped to a safe intersection.",
        },
      ],
      bottomTitle: "Ready to inspect the live system?",
      bottomSubtitle:
        "Launch the Citizen PWA or step into the Municipal Crisis Console—both run against the live Antalya 24-node engine.",
      ctaApp: "Open Citizen App (/app)",
      ctaAuthority: "Open Crisis Console (/demo-authority)",
    },
    footer: {
      teamLabel: "TEAM HEAT NODE · COP31 AI FOR CLIMATE YOUTH HACKATHON",
      builtBy: "Built by",
      members: [
        { name: "Yunus Emre Çelik", url: "https://yunusemrecelik.dev" },
        { name: "Bilge Nur Şahin", url: "https://www.linkedin.com/in/bilgenursahin/" },
        { name: "Havva Cebel", url: "https://www.linkedin.com/in/havva-cebel123/" },
        { name: "Aylin Çetinçay", url: "https://www.linkedin.com/in/aylin-çetinçay-757191351/" },
      ],
      links: [
        { label: "GitHub Repository", url: "https://github.com/yunusemre-celik/headnode_cop31" },
        { label: "Live Prototype", url: "https://heatnode-cop31.vercel.app/" },
        { label: "Backend Health", url: "https://heatnode-backend-production.up.railway.app/health" },
        { label: "MIT License", url: "https://github.com/yunusemre-celik/headnode_cop31/blob/master/LICENSE" },
      ],
    },
  },
  tr: {
    nav: {
      brand: "HEATNODE AI",
      tag: "COP31 ANTALYA",
      links: [
        { id: "cooperation", label: "İş Birliği" },
        { id: "pipeline", label: "ML Hattı" },
        { id: "hitl", label: "HITL" },
        { id: "graph", label: "24 Düğüm Grafı" },
        { id: "privacy", label: "Sıfır-PII" },
        { id: "demo", label: "COP31 Demo" },
      ],
      openApp: "Vatandaş (/app)",
      openAuthority: "Kriz Konsolu",
    },
    hero: {
      eyebrow: "COP31 ÇOKLU AFET KENTSEL KRİZ İKİZİ · ANTALYA PİLOTU",
      title: "İnsan iş birliği, makine hızında eyleme dönüşür.",
      subtitle:
        "45°C+ aşırı sıcak ve orman yangınlarından ani sel, fırtına, dolu ve heyelana kadar—tek başına sensörler sokak ölçeğindeki mikro iklimleri kaçırır. HEATNODE AI, 10 iklim afetinde tek dokunuşlu anonim vatandaş bildirimlerini, 5 yıllık Open-Meteo XGBoost tahminini (+1s R² = 0.9905) ve risk-duyarlı Dijkstra güvenli alan rotasını birleştirir.",
      telemetry: [
        { label: "GRAF & AFET", value: "24 DÜĞÜM · 92 KENAR · 10 AFET" },
        { label: "TAHMİN (+1S)", value: "XGBOOST R² 0.9905 · RMSE 1.94" },
        { label: "GİZLİLİK & AĞIRLIK", value: "SIFIR-PII · GPS 2.0x / HARİTA 0.5x" },
      ],
      ctaApp: "Vatandaş Uygulamasını Aç (/app)",
      ctaAuthority: "Kriz Konsolunu Aç (/demo-authority)",
      canvasCaption: "KÜRESELDEN ANTALYA'YA İŞ BİRLİKÇİ TELEMETRİ AĞI",
      legend: [
        { key: "signal", label: "500m Tehlike Sinyali", color: "#dc2626" },
        { key: "pending", label: "HITL Onayı Bekleyen", color: "#d97706" },
        { key: "verified", label: "Aktif Dijkstra Güvenli Alanı", color: "#4cc38a" },
      ],
    },
    cooperation: {
      eyebrow: "01 // İŞ BİRLİĞİ TEZİ",
      title: "İzole kriz müdahalesi neden çöker—iş birlikçi ağlar neden ayakta kalır?",
      subtitle:
        "Kentsel sıcak hava dalgaları seyrek meteoroloji istasyonlarının arasındaki sokaklarda can alır. Hayatta kalmak, mahremiyetten ödün vermeden tek bir doğrulanabilir durum makinesini paylaşan üç aktör gerektirir.",
      isolatedTitle: "İzole Müdahale (Mevcut Durum)",
      isolatedItems: [
        {
          label: "Seyrek Telemetri",
          detail: "Havalimanı veya kıyı istasyonları iki sokak ötedeki +4.5°C beton kanyon sıçramalarını ölçemez.",
        },
        {
          label: "Doğrulanmamış Gürültü",
          detail: "Sosyal medya bildirimleri mekansal kümeleme içermez; ya alarm yorgunluğu ya da gecikme yaratır.",
        },
        {
          label: "Sabit Barınaklar",
          detail: "Isı bulutları rüzgarla mahalleler arasında kayarken sabit merkezler boş kalır.",
        },
      ],
      cooperativeTitle: "HEATNODE İş Birliği Ağı",
      cooperativeItems: [
        {
          label: "Vatandaş Mikro-Sinyalleri",
          detail: "Hesap ve GPS izni gerektirmeyen bildirimler en yakın 24-düğüm kavşağına hizalanır.",
        },
        {
          label: "Açıklanabilir ML Filtreleme",
          detail: "DBSCAN + Isolation Forest sahte bildirimleri eler ve >=10/20dk gerçek kümeleri ayırır.",
        },
        {
          label: "Belediye HITL Sevkiyatı",
          detail: "Operatörler genel duyuru öncesi SHAP açıklamalarıyla K-Means serinleme merkezlerini onaylar.",
        },
      ],
      actors: [
        {
          role: "VATANDAŞ",
          metric: "< 15sn BİLDİRİM",
          description: "Hesap oluşturmadan ve kişisel veri vermeden kavşak düzeyinde ısı/duman sinyali iletir.",
        },
        {
          role: "YAPAY ZEKA",
          metric: "+1s / +2s / +3s",
          description: "Anomalileri kümeler, rüzgarla ısı yayılımını öngörür ve K=1..5 merkezleri güvenli kavşaklara oturtur.",
        },
        {
          role: "BELEDİYE",
          metric: "HITL ONAY KAPISI",
          description: "Yanlış alarm paniği yaratmadan telemetriyi doğrular ve mobil serinleme birimlerini aktive eder.",
        },
      ],
    },
    pipeline: {
      eyebrow: "02 // 3 AŞAMALI AÇIKLANABİLİR ML HATTI",
      title: "Gürültülü kalabalık bildirimlerinden rüzgar-odaklı serinleme koordinatlarına.",
      subtitle:
        "Her otomatik öneri denetlenebilir. Kara kutu eşikler yok—her aşama deterministik metrikler ve SHAP katkıları üretir.",
      stages: [
        {
          stage: "AŞAMA 01",
          name: "Isolation Forest + Mekansal-Zamansal Kümeleme",
          threshold: "500M YARIÇAP · 30 DK PENCERE",
          badge: "ANOMALİ & SPAM FİLTRELEME",
          accent: "#dc2626",
          summary:
            "5 hava/kalabalık özelliği ve ağırlıklı sinyal güveniyle 10 iklim afetindeki gerçek olayları tekil gürültü ve spam'den ayırır.",
          specs: [
            "IsolationForest (5 hava ve kalabalık özelliği) Open-Meteo temeline göre olağandışı patlamaları işaretler.",
            "Mekansal-zamansal kümeleme 500 m yarıçap ve 30 dakikalık tekrar bastırma penceresi uygular.",
            "Güven ağırlığı: isteğe bağlı GPS bildirimleri 2.0x, manuel harita seçimleri 0.5x ağırlık taşır.",
          ],
        },
        {
          stage: "AŞAMA 02",
          name: "XGBoost + SHAP TreeExplainer",
          threshold: "+1S R² 0.9905 · +3S R² 0.9387",
          badge: "1–3S YAYILIM TAHMİNİ",
          accent: "#d97706",
          summary:
            "2021–2026 arası 5 yıllık Open-Meteo Antalya hava verisiyle eğitildi; fizik-vekil etiketler üzerinde blok bazlı yayılım öngörür.",
          specs: [
            "Fizik-vekil etiketlerde +1s R² = 0.9905 (RMSE 1.94) ve +3s R² = 0.9387 (RMSE 4.84) başarım elde eder.",
            "92 yönlü graf kenarı boyunca rüzgar, güneş radyasyonu ve kentsel yoğunlukla adveksiyon hesaplar.",
            "AI Şeffaflık penceresi SHAP TreeExplainer ağırlıklarını (rüzgar vektörü, ısı tutma, bildirim hızı) gösterir.",
          ],
        },
        {
          stage: "AŞAMA 03",
          name: "Risk-Duyarlı Dijkstra + Ağırlıklı K-Means",
          threshold: "500M SAPMA · CANLI SSE",
          badge: "GÜVENLİ ALAN & MERKEZ ROTALAMA",
          accent: "#4cc38a",
          summary:
            "Vatandaşları aktif 500 m tehlike bölgelerinin etrafından dolaştırır; AKOM/AFAD operatörleri SSE ile canlı güvenli alan açar.",
          specs: [
            "24 Antalya düğümü ve 92 yönlü kenar üzerinde çalışan risk-duyarlı Dijkstra algoritması 500 m tehlikelerden kaçınır.",
            "Ağırlıklı K-Means (K=1..5) mobil serinleme ve yardım merkezlerini güvenli kent kavşaklarına oturtur.",
            "Canlı Server-Sent Events (SSE) belediye güvenli alan onaylarını anında vatandaş /app haritalarına iletir.",
          ],
        },
      ],
    },
    hitl: {
      eyebrow: "03 // İNSAN-ONAYLI (HITL) YAŞAM DÖNGÜSÜ",
      title: "Otomatik tespit. İnsan onaylı kamusal aktivasyon.",
      subtitle:
        "Yapay zeka tek başına şehir çapında acil durum duyurusu başlatmaz. Operatörler durum makinesini çevirmeden önce DBSCAN yoğunluğunu ve SHAP sürücülerini inceler.",
      states: [
        {
          state: "MONITORING",
          accent: "#85858b",
          trigger: "Temel telemetri (< 10 bildirim / 20dk)",
          action: "Anonim bildirimleri toplar ve kamusal uyarı vermeden 5 yıllık Open-Meteo temelini günceller.",
        },
        {
          state: "PENDING_APPROVAL",
          accent: "#d97706",
          trigger: "DBSCAN kümesi >= 10 bildirim/20dk doğrulandı",
          action: "Aday K-Means merkezlerini ve SHAP özetini belediye operatör incelemesi için /demo-authority ekranına kilitler.",
        },
        {
          state: "ACTIVE",
          accent: "#4cc38a",
          trigger: "Operatör sevkiyatı onayladı",
          action: "Doğrulanmış güvenli serinleme kavşaklarını tüm /app vatandaş cihazlarına gerçek zamanlı yayınlar.",
        },
      ],
    },
    graph: {
      eyebrow: "04 // 24 DÜĞÜM / 92 KENAR ANTALYA TOPOLOJİSİ",
      title: "Antalya'nın gerçek kentsel ısı adaları üzerine modellendi.",
      subtitle:
        "HEATNODE keyfi ızgara kareleri yerine, üç ana ilçede 92 ağırlıklı adveksiyon kenarıyla bağlanan 24 yüksek riskli kavşağı modeller.",
      totals: [
        { label: "TOPLAM DÜĞÜM", value: "24" },
        { label: "YÖNLÜ KENAR", value: "92" },
        { label: "HAVA GEÇMİŞİ", value: "5 YIL OPEN-METEO" },
        { label: "MERKEZ KAPASİTESİ", value: "K = 1..5" },
      ],
      districts: [
        {
          name: "Kepez",
          nodes: 10,
          share: "%41.7",
          profile: "İç kesim beton ve sanayi ısı tutma havzası; deniz meltemi etkisi düşük, öğleden sonra ısı birikimi en yüksek.",
        },
        {
          name: "Muratpaşa",
          nodes: 8,
          share: "%33.3",
          profile: "Yoğun ticari akslar ve tarihi doku; yüksek yaya maruziyeti ve sokak kanyonu ısı hapsi.",
        },
        {
          name: "Konyaaltı",
          nodes: 6,
          share: "%25.0",
          profile: "Kıyı rüzgar adveksiyon koridoru ve yoğun ziyaretçi kuşağı; öğleden sonra rüzgar yön değişimlerine duyarlı.",
        },
      ],
    },
    privacy: {
      eyebrow: "05 // SIFIR-PII KVKK & GDPR MİMARİSİ",
      title: "Politika sözüyle değil, veritabanı şemasıyla mahremiyet.",
      subtitle:
        "Kullanıcı hesabı yok, tarayıcı parmak izi yok, IP kaydı yok ve zorunlu GPS izni yok. Vatandaşlar manuel kavşak seçerek de hayat kurtarabilir.",
      guarantees: [
        "SQLite şemasında telefon, e-posta, cihaz kimliği veya IP adresi sütunu bulunmaz.",
        "Koordinatlar asla ev adresine değil, kaba kamusal düğüm/kavşak kovalarına hizalanır.",
        "GPS reddedildiğinde dahi 24 düğümlü manuel kavşak seçimiyle eksiksiz çalışır.",
      ],
      schemaTitle: "backend/db.py — SQLite `reports` tablosu",
      schemaCode: `CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT UNIQUE NOT NULL,
  node_id TEXT NOT NULL,
  disaster_type TEXT NOT NULL,
  severity INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
-- Sıfır PII: ip_address yok, user_id yok, device_fingerprint yok, kesin ev GPS'i yok`,
    },
    evidence: {
      eyebrow: "06 // ÖLÇÜLEN KANITLAR, DÜRÜST SINIRLAMALAR & YOL HARİTASI",
      title: "Bugün ölçülen performans. Yarın için şeffaf sınırlar.",
      subtitle:
        "COP31 Hackathon jüri değerlendirmesi için şeffaf: her metrik test edilmiştir, her model sınırlaması açıkça belirtilmiştir ve Antalya gölge-mod pilotu tanımlanmıştır.",
      metrics: [
        { label: "XGBOOST +1S", value: "R² 0.9905 · RMSE 1.94" },
        { label: "XGBOOST +3S", value: "R² 0.9387 · RMSE 4.84" },
        { label: "AFET KAPSAMI", value: "10 İKLİM AFETİ · 500M" },
        { label: "DOĞRULAMA", value: "25 PYTEST · 14 VITEST · 200 OK" },
      ],
      limitationsTitle: "Dürüst Yapay Zeka Sınırlamaları (Sorumlu AI)",
      limitations: [
        {
          tag: "SINIRLAMA 01",
          title: "Fizik-Vekil Etiketler",
          detail: "Eğitim, klinik 112 veya hastane kayıtlarını değil; fizik-vekil denklemleri (UTCI, rüzgar adveksiyonu, kent yoğunluğu) kullanır.",
        },
        {
          tag: "SINIRLAMA 02",
          title: "Karakteristik Profiller",
          detail: "Canlı çıkarım, fiziksel sokak IoT sensörleri olmadan karakteristik afet hava profillerini kullanır.",
        },
        {
          tag: "SINIRLAMA 03",
          title: "Pilot Coğrafyası",
          detail: "Rotalama grafı şu an Kepez, Muratpaşa ve Konyaaltı'ndaki 24 düğümlü Antalya kentsel topolojisini kapsar.",
        },
      ],
      roadmapTitle: "Sonraki Adım: Antalya'da Gölge-Mod Pilot",
      roadmap: [
        {
          step: "01",
          title: "Belediye Gölge-Mod Pilotu",
          detail: "Zirve sıcak ve fırtına dönemlerinde Antalya Büyükşehir Belediyesi (AKOM) ve MGM ile paralel saha testi.",
        },
        {
          step: "02",
          title: "Klinik 112 Kalibrasyonu",
          detail: "XGBoost risk ağırlıklarının anonimleştirilmiş 112 acil çağrı ve hastane sıcak çarpması/afet kayıtlarıyla kalibrasyonu.",
        },
        {
          step: "03",
          title: "Antalya Ötesine Ölçekleme",
          detail: "Donanımsız 24-düğüm graf şablonunun Avrupa ve Akdeniz kentlerine uyarlanması (MIT Açık Kaynak).",
        },
      ],
    },
    demo: {
      eyebrow: "06 // COP31 3 DAKİKALIK CANLI DEMO AKIŞI",
      title: "Tüm iş birlikçi döngüyü canlı test edin.",
      subtitle:
        "Bir COP31 jüri üyesinin Vatandaş Bildiriminden Belediye Aktivasyonuna kadar tüm hattı nasıl tetikleyeceğini görmek için adımlara tıklayın.",
      steps: [
        {
          step: "01",
          actor: "VATANDAŞ (/app)",
          title: "Manuel Konum Seçin (Sıfır GPS)",
          detail: "/app ekranını açın, tarayıcı GPS iznini atlayın ve Kepez veya Muratpaşa'dan bir kavşak seçin.",
        },
        {
          step: "02",
          actor: "VATANDAŞ (/app)",
          title: "Termal / Sıcak Dalga Sinyali Gönderin",
          detail: "Sıcak Hava Dalgası veya Orman Yangını Dumanı seçip gönderin. Yalnızca node_id, severity ve request_id saklanır.",
        },
        {
          step: "03",
          actor: "SİMÜLASYON",
          title: ">= 10 Bildirim / 20dk Eşiğine Ulaşın",
          detail: "DBSCAN + Isolation Forest'ın kümeyi doğrulaması için patlama simülatörünü veya ek bildirimleri tetikleyin.",
        },
        {
          step: "04",
          actor: "YAPAY ZEKA",
          title: "XGBoost +1s/+2s/+3s Adveksiyonunu Çalıştırın",
          detail: "Aşama 2 rüzgar yönündeki ısı yayılımını hesaplar ve SHAP TreeExplainer özellik ağırlıklarını ekler.",
        },
        {
          step: "05",
          actor: "HITL KONSOLU",
          title: "PENDING_APPROVAL Kuyruğunu İnceleyin",
          detail: "Küme güvenini, SHAP sürücülerini ve K-Means aday merkezlerini görmek için /demo-authority açın.",
        },
        {
          step: "06",
          actor: "BELEDİYE",
          title: "Serinleme Merkezi Sevkiyatını Onaylayın",
          detail: "Durum makinesini PENDING_APPROVAL'dan ACTIVE durumuna geçirmek için /demo-authority üzerinden Onayla'ya tıklayın.",
        },
        {
          step: "07",
          actor: "VATANDAŞ (/app)",
          title: "Canlı Güvenli Merkez Yönlendirmesini Doğrulayın",
          detail: "Güvenli bir kavşağa oturtulan yeni serinleme merkezini görmek için /app çevre haritasına dönün.",
        },
      ],
      bottomTitle: "Canlı sistemi incelemeye hazır mısınız?",
      bottomSubtitle:
        "Vatandaş PWA'sını başlatın veya Belediye Kriz Konsoluna geçin—ikisi de canlı Antalya 24-düğüm motoruyla çalışır.",
      ctaApp: "Vatandaş Uygulamasını Aç (/app)",
      ctaAuthority: "Kriz Konsolunu Aç (/demo-authority)",
    },
    footer: {
      teamLabel: "TEAM HEAT NODE · COP31 İKLİM İÇİN YAPAY ZEKA GENÇLİK HACKATHONU",
      builtBy: "Hazırlayanlar",
      members: [
        { name: "Yunus Emre Çelik", url: "https://yunusemrecelik.dev" },
        { name: "Bilge Nur Şahin", url: "https://www.linkedin.com/in/bilgenursahin/" },
        { name: "Havva Cebel", url: "https://www.linkedin.com/in/havva-cebel123/" },
        { name: "Aylin Çetinçay", url: "https://www.linkedin.com/in/aylin-çetinçay-757191351/" },
      ],
      links: [
        { label: "GitHub Deposu", url: "https://github.com/yunusemre-celik/headnode_cop31" },
        { label: "Canlı Prototip", url: "https://heatnode-cop31.vercel.app/" },
        { label: "Backend Sağlık", url: "https://heatnode-backend-production.up.railway.app/health" },
        { label: "MIT Lisansı", url: "https://github.com/yunusemre-celik/headnode_cop31/blob/master/LICENSE" },
      ],
    },
  },
};
