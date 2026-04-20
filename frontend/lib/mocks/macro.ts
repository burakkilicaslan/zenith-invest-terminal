import type {
  DataSource,
  MacroAiSummary,
  MacroCalendarItem,
  MacroDashboard,
  MacroIndicator,
  MacroRegionSnapshot,
  MacroSignalCard,
  MacroTheme,
  MacroTimeSeriesPoint,
  YieldCurveSnapshot,
} from "../types";

/**
 * Deterministic mock Macro Dashboard payload.
 *
 * Drives the full Epic 1 macro strategy dashboard (US + Türkiye) without
 * any live data integration. Values are realistic enough to make the UI
 * meaningful but should not be used for analysis.
 *
 * Issue #18 enrichment:
 * - Every indicator carries structured source metadata plus Turkish
 *   "nedir" / "nasıl yorumlanır" copy.
 * - US sentiment indicators (CNN Fear & Greed, investors.com CAN SLIM
 *   % exposure) are first-class entries.
 * - Signals / themes / calendar are fully localized to Turkish.
 * - A top-level `aiSummary` synthesizes an investability verdict over
 *   the full indicator set (mock, rule-based narrative).
 */

function buildHistory(
  start: string,
  values: number[],
  stepDays = 5,
): MacroTimeSeriesPoint[] {
  const startMs = Date.parse(start);
  const stepMs = stepDays * 24 * 60 * 60 * 1000;
  return values.map((value, i) => ({
    timestamp: new Date(startMs + i * stepMs).toISOString(),
    value,
    benchmark: null,
    change: i === 0 ? null : value - values[i - 1],
  }));
}

const GENERATED_AT = "2026-04-19T20:00:00Z";

// ---------- Data sources ----------

const SRC_FRED: DataSource = {
  code: "FRED",
  label: "Federal Reserve Economic Data",
  url: "https://fred.stlouisfed.org",
};

const SRC_FMP: DataSource = {
  code: "FMP",
  label: "Financial Modeling Prep",
  url: "https://financialmodelingprep.com",
};

const SRC_CBOE: DataSource = {
  code: "CBOE",
  label: "Chicago Board Options Exchange",
  url: "https://www.cboe.com/tradable_products/vix/",
};

const SRC_CNN: DataSource = {
  code: "CNN",
  label: "CNN Business Fear & Greed Index",
  url: "https://edition.cnn.com/markets/fear-and-greed",
};

const SRC_INVESTORS: DataSource = {
  code: "investors.com",
  label: "Investor's Business Daily — Big Picture",
  url: "https://www.investors.com/market-trend/the-big-picture/",
};

const SRC_BLS: DataSource = {
  code: "BLS",
  label: "ABD Çalışma İstatistikleri Bürosu",
  url: "https://www.bls.gov",
};

const SRC_FED: DataSource = {
  code: "Federal Reserve",
  label: "ABD Merkez Bankası (Federal Reserve)",
  url: "https://www.federalreserve.gov",
};

const SRC_TCMB: DataSource = {
  code: "TCMB",
  label: "Türkiye Cumhuriyet Merkez Bankası",
  url: "https://www.tcmb.gov.tr",
};

const SRC_TURKSTAT: DataSource = {
  code: "TÜİK",
  label: "Türkiye İstatistik Kurumu",
  url: "https://www.tuik.gov.tr",
};

const SRC_IHS: DataSource = {
  code: "IHS Markit",
  label: "S&P Global Market Intelligence — CDS (mock)",
  url: null,
};

const SRC_INTERNAL: DataSource = {
  code: "Dahili model",
  label: "Zenith dahili makro sinyal modeli (mock)",
  url: null,
};

// ---------- US indicators ----------

const us10y: MacroIndicator = {
  id: "us-10y",
  label: "ABD 10Y Hazine Tahvil Faizi",
  labelEn: "US 10Y Treasury Yield",
  region: "us",
  category: "rates",
  value: 4.28,
  unit: "percent",
  change: -0.03,
  changePercent: -0.7,
  trend: "down",
  updatedAt: GENERATED_AT,
  source: SRC_FRED,
  history: buildHistory("2026-01-10T00:00:00Z", [
    4.02, 4.11, 4.18, 4.25, 4.33, 4.4, 4.46, 4.42, 4.38, 4.35, 4.32, 4.3, 4.29,
    4.28,
  ]),
  whatItIs:
    "ABD Hazinesi'nin ihraç ettiği 10 yıl vadeli tahvilin yıllık getirisidir. Uzun vadeli risksiz getiri için küresel referans kabul edilir.",
  howToInterpret:
    "Yükselen faizler borçlanma maliyetini artırıp riskli varlıkları baskılar, düşen faizler ise genelde hisse ve tahvil değerlemelerine destek olur. Enflasyon ve büyüme beklentilerini birlikte okuyun.",
};

const us2y: MacroIndicator = {
  id: "us-2y",
  label: "ABD 2Y Hazine Tahvil Faizi",
  labelEn: "US 2Y Treasury Yield",
  region: "us",
  category: "rates",
  value: 4.42,
  unit: "percent",
  change: -0.02,
  changePercent: -0.45,
  trend: "down",
  updatedAt: GENERATED_AT,
  source: SRC_FRED,
  history: buildHistory("2026-01-10T00:00:00Z", [
    4.55, 4.6, 4.58, 4.55, 4.52, 4.5, 4.48, 4.47, 4.46, 4.45, 4.44, 4.43, 4.42,
    4.42,
  ]),
  whatItIs:
    "Kısa vadeli ABD Hazine tahvili faizi. Fed'in politika faizi beklentilerine karşı en duyarlı enstrüman olarak izlenir.",
  howToInterpret:
    "Düşüş trendi piyasanın faiz indirimini fiyatladığına, yükseliş ise şahin duruşun güçlendiğine işaret eder. 10Y ile birlikte getiri eğrisini belirler.",
};

const us10y2ySpread: MacroIndicator = {
  id: "us-10y-2y",
  label: "10Y–2Y Spread",
  labelEn: "US 10Y–2Y Spread",
  region: "us",
  category: "curve",
  value: -0.14,
  unit: "percent",
  change: -0.01,
  changePercent: 7.69,
  trend: "down",
  updatedAt: GENERATED_AT,
  source: SRC_FRED,
  history: buildHistory("2026-01-10T00:00:00Z", [
    -0.53, -0.49, -0.4, -0.3, -0.19, -0.1, -0.02, -0.05, -0.08, -0.1, -0.12,
    -0.13, -0.13, -0.14,
  ]),
  whatItIs:
    "ABD 10 yıllık ile 2 yıllık Hazine tahvili faizi arasındaki fark; getiri eğrisinin eğimini özetler.",
  howToInterpret:
    "Negatif değer (eğri tersine dönmüş) tarihsel olarak resesyon öncü göstergesidir. Pozitife dönüş ise büyüme beklentilerinin toparlandığına işaret eder.",
};

const vix: MacroIndicator = {
  id: "us-vix",
  label: "VIX (Oynaklık Endeksi)",
  labelEn: "VIX (Volatility Index)",
  region: "us",
  category: "volatility",
  value: 17.42,
  unit: "index",
  change: 0.84,
  changePercent: 5.06,
  trend: "up",
  updatedAt: GENERATED_AT,
  source: SRC_CBOE,
  history: buildHistory("2026-01-10T00:00:00Z", [
    13.1, 13.8, 14.2, 14.0, 14.6, 15.1, 15.5, 15.9, 16.2, 16.5, 16.8, 17.0,
    16.6, 17.42,
  ]),
  whatItIs:
    "S&P 500 opsiyonlarının fiyatlarından türetilen 30 günlük ima edilen oynaklıktır. Piyasanın 'korku barometresi' olarak anılır.",
  howToInterpret:
    "20'nin altı sakin / risk iştahlı, 20–30 arası temkinli, 30'un üzeri stres dönemidir. Hızlı yükselişler hedge talebinin arttığına işaret eder.",
};

const fedBalanceSheet: MacroIndicator = {
  id: "us-fed-bs",
  label: "Fed Bilançosu",
  labelEn: "Fed Balance Sheet",
  region: "us",
  category: "liquidity",
  value: 7.21,
  unit: "usd_trillions",
  change: -0.02,
  changePercent: -0.28,
  trend: "down",
  updatedAt: GENERATED_AT,
  source: SRC_FRED,
  history: buildHistory("2026-01-10T00:00:00Z", [
    7.55, 7.5, 7.46, 7.42, 7.38, 7.34, 7.31, 7.29, 7.27, 7.26, 7.25, 7.23,
    7.22, 7.21,
  ]),
  whatItIs:
    "ABD Merkez Bankası'nın (Fed) tuttuğu toplam varlıkların büyüklüğüdür. Küresel dolar likiditesi için temel göstergedir.",
  howToInterpret:
    "Büyüyen bilanço (QE) likiditeyi artırıp riskli varlıkları destekler; küçülen bilanço (QT) ise tam tersi etki yapar. Trend yönü, seviyesinden daha önemlidir.",
};

const fearGreed: MacroIndicator = {
  id: "us-fear-greed",
  label: "CNN Korku & Hırs Endeksi",
  labelEn: "CNN Fear & Greed Index",
  region: "us",
  category: "sentiment",
  value: 58,
  unit: "score",
  change: 6,
  changePercent: 11.54,
  trend: "up",
  updatedAt: GENERATED_AT,
  source: SRC_CNN,
  history: buildHistory("2026-01-10T00:00:00Z", [
    32, 35, 38, 42, 44, 47, 50, 52, 48, 46, 51, 54, 55, 58,
  ]),
  whatItIs:
    "CNN Business tarafından yayımlanan, yedi piyasa göstergesinden türetilen 0–100 arası bileşik yatırımcı duyarlılığı endeksidir.",
  howToInterpret:
    "0–25 aşırı korku, 25–45 korku, 45–55 nötr, 55–75 hırs, 75–100 aşırı hırs. Uç değerler tarihsel olarak kontra göstergedir: aşırı korkuda tabanlar, aşırı hırsta tepeler sık görülür.",
};

const canSlimExposure: MacroIndicator = {
  id: "us-canslim-exposure",
  label: "CAN SLIM Tavsiye Edilen Hisse Ağırlığı",
  labelEn: "investors.com CAN SLIM Recommended Exposure",
  region: "us",
  category: "breadth",
  value: 60,
  unit: "percent",
  change: 20,
  changePercent: 50,
  trend: "up",
  updatedAt: GENERATED_AT,
  source: SRC_INVESTORS,
  history: buildHistory("2026-01-10T00:00:00Z", [
    30, 30, 20, 20, 20, 20, 40, 40, 40, 40, 40, 60, 60, 60,
  ]),
  whatItIs:
    "Investor's Business Daily'nin 'Big Picture' köşesinde yayımlanan CAN SLIM metodolojisine göre tavsiye edilen hisse senedi ağırlığıdır (%0–100).",
  howToInterpret:
    "Trend 'confirmed uptrend' olduğunda %60–100, 'uptrend under pressure' olduğunda %40–60, 'market in correction' olduğunda %0–20 bandına çekilir. Ağırlığın yukarı revize edilmesi piyasa sağlığının iyileştiğine işaret eder.",
};

// ---------- TR indicators ----------

const tr5yCds: MacroIndicator = {
  id: "tr-5y-cds",
  label: "Türkiye 5Y CDS Primi",
  labelEn: "Turkey 5Y CDS",
  region: "tr",
  category: "credit",
  value: 268,
  unit: "bps",
  change: -6,
  changePercent: -2.19,
  trend: "down",
  updatedAt: GENERATED_AT,
  source: SRC_IHS,
  history: buildHistory("2026-01-10T00:00:00Z", [
    325, 318, 310, 305, 298, 291, 285, 280, 278, 275, 273, 272, 270, 268,
  ]),
  whatItIs:
    "Türkiye Cumhuriyeti dolar cinsi borcunun 5 yıllık kredi temerrüt takası (CDS) primidir. Yurt dışı yatırımcının talep ettiği ülke riski primini ölçer.",
  howToInterpret:
    "Daralan CDS ülke riskinin azaldığına, genişleyen CDS ise risk algısının bozulduğuna işaret eder. Türk varlıklarında fiyatlamanın ana çapasıdır.",
};

const tcmbReserves: MacroIndicator = {
  id: "tr-tcmb-reserves",
  label: "TCMB Brüt Döviz Rezervleri",
  labelEn: "TCMB FX Reserves",
  region: "tr",
  category: "reserves",
  value: 156.4,
  unit: "usd_billions",
  change: 2.1,
  changePercent: 1.36,
  trend: "up",
  updatedAt: GENERATED_AT,
  source: SRC_TCMB,
  history: buildHistory("2026-01-10T00:00:00Z", [
    138.2, 140.0, 141.6, 143.1, 145.0, 146.8, 148.3, 149.9, 151.2, 152.6,
    153.8, 154.6, 155.3, 156.4,
  ]),
  whatItIs:
    "TCMB bünyesinde tutulan toplam brüt döviz rezervleridir (altın dahil değildir).",
  howToInterpret:
    "Artan rezervler dış şoklara karşı tamponu güçlendirir ve TL için olumlu sinyaldir. Düşüş, döviz müdahalesi veya sermaye çıkışı anlamına gelebilir.",
};

const tcmbPolicyRate: MacroIndicator = {
  id: "tr-policy-rate",
  label: "TCMB Politika Faizi",
  labelEn: "TCMB Policy Rate",
  region: "tr",
  category: "policy",
  value: 42.5,
  unit: "percent",
  change: 0,
  changePercent: 0,
  trend: "flat",
  updatedAt: GENERATED_AT,
  source: SRC_TCMB,
  history: buildHistory("2026-01-10T00:00:00Z", [
    50, 50, 47.5, 47.5, 47.5, 45, 45, 45, 42.5, 42.5, 42.5, 42.5, 42.5, 42.5,
  ]),
  whatItIs:
    "TCMB'nin bir hafta vadeli repo ihale faizidir; para politikasının ana çıpa göstergesidir.",
  howToInterpret:
    "Sıkı duruş (yüksek reel faiz) enflasyonla mücadele ve TL istikrarı açısından olumlu okunur. Erken indirim döngüsü TL üzerinde baskı oluşturabilir.",
};

const trCpiYoY: MacroIndicator = {
  id: "tr-cpi-yoy",
  label: "TR TÜFE (Yıllık)",
  labelEn: "TR CPI (YoY)",
  region: "tr",
  category: "inflation",
  value: 38.2,
  unit: "percent",
  change: -1.4,
  changePercent: -3.54,
  trend: "down",
  updatedAt: GENERATED_AT,
  source: SRC_TURKSTAT,
  history: buildHistory("2026-01-10T00:00:00Z", [
    55.1, 53.4, 51.2, 49.0, 46.8, 44.7, 43.1, 41.8, 40.9, 40.2, 39.6, 39.1,
    38.8, 38.2,
  ]),
  whatItIs:
    "Tüketici Fiyat Endeksi'nin bir önceki yılın aynı ayına göre yüzde değişimidir.",
  howToInterpret:
    "Düşüş trendi dezenflasyon sürecinin işlediğine işaret eder; hizmet enflasyonu ve beklentilerle birlikte değerlendirilmelidir. Reel faiz anahtar metriktir.",
};

// ---------- Region snapshots ----------

const usSnapshot: MacroRegionSnapshot = {
  region: "us",
  asOf: GENERATED_AT,
  indicators: [
    us10y,
    us2y,
    us10y2ySpread,
    vix,
    fedBalanceSheet,
    fearGreed,
    canSlimExposure,
  ],
};

const trSnapshot: MacroRegionSnapshot = {
  region: "tr",
  asOf: GENERATED_AT,
  indicators: [tr5yCds, tcmbReserves, tcmbPolicyRate, trCpiYoY],
};

// ---------- Yield curves ----------

const yieldCurves: YieldCurveSnapshot[] = [
  {
    country: "us",
    tenYearYield: 4.28,
    twoYearYield: 4.42,
    spread: -0.14,
    slopeTrend: "down",
    updatedAt: GENERATED_AT,
    source: SRC_FRED,
    interpretation:
      "Eğri hafif tersine dönmüş durumda. 2Y'nin 10Y'den yüksek kalması büyüme tarafında temkinli bir duruşu öneriyor; kısa vade Fed beklentisine, uzun vade büyüme ve enflasyon patikasına duyarlı.",
    tenors: [
      { tenor: "3M", tenorYears: 0.25, yield: 4.58 },
      { tenor: "6M", tenorYears: 0.5, yield: 4.52 },
      { tenor: "1Y", tenorYears: 1, yield: 4.47 },
      { tenor: "2Y", tenorYears: 2, yield: 4.42 },
      { tenor: "5Y", tenorYears: 5, yield: 4.18 },
      { tenor: "7Y", tenorYears: 7, yield: 4.22 },
      { tenor: "10Y", tenorYears: 10, yield: 4.28 },
      { tenor: "30Y", tenorYears: 30, yield: 4.55 },
    ],
  },
  {
    country: "tr",
    tenYearYield: 27.8,
    twoYearYield: 39.4,
    spread: -11.6,
    slopeTrend: "up",
    updatedAt: GENERATED_AT,
    source: SRC_TCMB,
    interpretation:
      "TL eğrisi belirgin şekilde tersine dönmüş; kısa vade yüksek politika faizini, uzun vade ise dezenflasyon beklentisini fiyatlıyor. Eğimdeki toparlanma normalleşmenin işareti olarak izlenmeli.",
    tenors: [
      { tenor: "3M", tenorYears: 0.25, yield: 42.1 },
      { tenor: "6M", tenorYears: 0.5, yield: 41.2 },
      { tenor: "1Y", tenorYears: 1, yield: 40.3 },
      { tenor: "2Y", tenorYears: 2, yield: 39.4 },
      { tenor: "5Y", tenorYears: 5, yield: 32.1 },
      { tenor: "10Y", tenorYears: 10, yield: 27.8 },
    ],
  },
];

// ---------- Signals ----------

const signals: MacroSignalCard[] = [
  {
    id: "sig-001",
    title: "ABD getiri eğrisi tersine dönük kalıyor",
    summary:
      "10Y–2Y bu hafta -14 bp civarında tutundu. Uzun vadede yaşanan toparlanmaya rağmen resesyon sinyali devam ediyor.",
    severity: "watch",
    confidence: 0.68,
    source: SRC_INTERNAL,
    relatedIndicators: ["us-10y", "us-2y", "us-10y-2y"],
    region: "us",
    updatedAt: GENERATED_AT,
  },
  {
    id: "sig-002",
    title: "Oynaklıkta yukarı eğilim",
    summary:
      "VIX 20 günlük ortalamasının üzerinde 17,4'e tırmandı. Opsiyon konumlanması, hedge talebinin arttığına işaret ediyor.",
    severity: "info",
    confidence: 0.55,
    source: SRC_INTERNAL,
    relatedIndicators: ["us-vix"],
    region: "us",
    updatedAt: GENERATED_AT,
  },
  {
    id: "sig-003",
    title: "ABD yatırımcı duyarlılığı ılımlı hırs bölgesinde",
    summary:
      "CNN Korku & Hırs Endeksi 58'e yükseldi ve investors.com CAN SLIM ağırlığı %60'a çıktı. Trend 'confirmed uptrend' tarafına dönüyor, ancak aşırı hırs bölgesine yaklaşılırsa temkinli olmak gerekebilir.",
    severity: "info",
    confidence: 0.62,
    source: SRC_INTERNAL,
    relatedIndicators: ["us-fear-greed", "us-canslim-exposure"],
    region: "us",
    updatedAt: GENERATED_AT,
  },
  {
    id: "sig-004",
    title: "Türkiye CDS daralmaya devam ediyor",
    summary:
      "5Y CDS 268 bp ile çok aylık en düşük seviyeye geriledi. Rezervlerin toparlanması ülke risk algısını destekliyor.",
    severity: "info",
    confidence: 0.71,
    source: SRC_INTERNAL,
    relatedIndicators: ["tr-5y-cds", "tr-tcmb-reserves"],
    region: "tr",
    updatedAt: GENERATED_AT,
  },
  {
    id: "sig-005",
    title: "TCMB bir sonraki toplantıya kadar muhtemelen beklemede",
    summary:
      "Politika faizi %42,5'te sabit; dezenflasyon devam ederken sözlü yönlendirme şahin tonunu koruyor.",
    severity: "watch",
    confidence: 0.6,
    source: SRC_INTERNAL,
    relatedIndicators: ["tr-policy-rate", "tr-cpi-yoy"],
    region: "tr",
    updatedAt: GENERATED_AT,
  },
];

// ---------- Themes / watchlists ----------

const themes: MacroTheme[] = [
  {
    id: "theme-us-recession-watch",
    themeName: "ABD resesyon izleme",
    description:
      "Büyümede yavaşlama riskine karşı izlenen eğri, oynaklık ve likidite göstergeleri.",
    indicators: ["us-10y-2y", "us-vix", "us-fed-bs"],
    bias: "savunmacı",
    region: "us",
  },
  {
    id: "theme-us-rates-path",
    themeName: "ABD faiz patikası",
    description: "Bir sonraki Fed kararına girdi sağlayan makro göstergeler.",
    indicators: ["us-10y", "us-2y", "us-fed-bs"],
    bias: "nötr",
    region: "us",
  },
  {
    id: "theme-us-sentiment",
    themeName: "ABD yatırımcı duyarlılığı",
    description:
      "Risk iştahını ve CAN SLIM tavsiye ağırlığını birlikte takip eden duyarlılık sepeti.",
    indicators: ["us-fear-greed", "us-canslim-exposure", "us-vix"],
    bias: "risk-iştahı-takibi",
    region: "us",
  },
  {
    id: "theme-tr-disinflation",
    themeName: "TR dezenflasyon patikası",
    description:
      "Türkiye'nin tek haneli enflasyona dönüş sürecini izleyen göstergeler.",
    indicators: ["tr-cpi-yoy", "tr-policy-rate", "tr-5y-cds"],
    bias: "normalleşme-yanlı",
    region: "tr",
  },
  {
    id: "theme-tr-external-buffers",
    themeName: "TR dış tamponlar",
    description: "Dış kırılganlığı ölçen rezerv ve kredi riski göstergeleri.",
    indicators: ["tr-tcmb-reserves", "tr-5y-cds"],
    bias: "iyileşiyor",
    region: "tr",
  },
];

// ---------- Calendar ----------

const calendar: MacroCalendarItem[] = [
  {
    id: "evt-fomc-minutes",
    eventName: "FOMC Toplantı Tutanakları",
    region: "us",
    scheduledAt: "2026-04-22T18:00:00Z",
    expectedImpact: "high",
    actual: null,
    consensus: null,
    previous: null,
    source: SRC_FED,
    relatedIndicators: ["us-10y", "us-2y", "us-fed-bs"],
  },
  {
    id: "evt-us-cpi",
    eventName: "ABD TÜFE (Aylık)",
    region: "us",
    scheduledAt: "2026-04-24T12:30:00Z",
    expectedImpact: "high",
    actual: null,
    consensus: "%0,2",
    previous: "%0,3",
    source: SRC_BLS,
    relatedIndicators: ["us-10y", "us-2y"],
  },
  {
    id: "evt-us-nfp",
    eventName: "ABD Tarım Dışı İstihdam",
    region: "us",
    scheduledAt: "2026-05-02T12:30:00Z",
    expectedImpact: "high",
    actual: null,
    consensus: "185 bin",
    previous: "212 bin",
    source: SRC_BLS,
    relatedIndicators: ["us-2y", "us-vix"],
  },
  {
    id: "evt-tcmb-decision",
    eventName: "TCMB Faiz Kararı",
    region: "tr",
    scheduledAt: "2026-04-25T11:00:00Z",
    expectedImpact: "high",
    actual: null,
    consensus: "%42,5",
    previous: "%42,5",
    source: SRC_TCMB,
    relatedIndicators: ["tr-policy-rate", "tr-5y-cds"],
  },
  {
    id: "evt-tr-cpi",
    eventName: "Türkiye TÜFE (Yıllık)",
    region: "tr",
    scheduledAt: "2026-05-05T07:00:00Z",
    expectedImpact: "high",
    actual: null,
    consensus: "%36,9",
    previous: "%38,2",
    source: SRC_TURKSTAT,
    relatedIndicators: ["tr-cpi-yoy", "tr-policy-rate"],
  },
  {
    id: "evt-tr-reserves",
    eventName: "TCMB Haftalık Rezervler",
    region: "tr",
    scheduledAt: "2026-04-24T11:00:00Z",
    expectedImpact: "medium",
    actual: null,
    consensus: null,
    previous: "155,3 Mr$",
    source: SRC_TCMB,
    relatedIndicators: ["tr-tcmb-reserves"],
  },
];

// ---------- AI-powered investability summary ----------

const aiSummary: MacroAiSummary = {
  id: "ai-summary-2026-04-19",
  generatedAt: GENERATED_AT,
  verdict: "cautious",
  headline: "Seçici yatırım ortamı",
  narrative:
    "Makro resim temkinli-pozitif: ABD tarafında dezenflasyon yavaş ilerlerken getiri eğrisi hâlâ tersine dönmüş durumda ve Fed bilançosu küçülmeye devam ediyor; buna karşın CNN Korku & Hırs Endeksi ılımlı hırs bölgesine (%58) geçti ve investors.com CAN SLIM tavsiyesi %60'a yükseldi — bu bileşim, kalite ve momentum taraflı seçici pozisyonlanmayı destekliyor. Türkiye tarafında CDS primi daralıyor, TCMB rezervleri artıyor ve dezenflasyon sürüyor, ancak politika faizindeki yatay seyir ve yüksek enflasyon reel bazda önlemli kalmayı gerektiriyor.",
  highlights: [
    "ABD yatırımcı duyarlılığı (CNN Korku & Hırs 58) ve CAN SLIM tavsiye ağırlığı (%60) 'confirmed uptrend' bölgesinde.",
    "Türkiye 5Y CDS primi 268 bp ile çok aylık dip; dış tamponlar güçleniyor.",
    "Türkiye dezenflasyonu sürüyor (TÜFE %38,2, yılbaşından bu yana yaklaşık 17 puan iyileşme).",
  ],
  risks: [
    "ABD 10Y–2Y eğrisi hâlâ negatif (-14 bp), resesyon sinyali canlı.",
    "VIX 17,4'e yükseldi; oynaklık trendi yukarı yönlü.",
    "TCMB politika faizi %42,5'te sabit, reel faiz katı — erken bir indirim döngüsü TL için risk oluşturur.",
  ],
  confidence: 0.62,
  model: "mock: kural tabanlı sentez",
  relatedIndicators: [
    "us-10y",
    "us-2y",
    "us-10y-2y",
    "us-vix",
    "us-fed-bs",
    "us-fear-greed",
    "us-canslim-exposure",
    "tr-5y-cds",
    "tr-tcmb-reserves",
    "tr-policy-rate",
    "tr-cpi-yoy",
  ],
  sources: [
    SRC_FRED,
    SRC_FMP,
    SRC_CBOE,
    SRC_CNN,
    SRC_INVESTORS,
    SRC_TCMB,
    SRC_TURKSTAT,
    SRC_IHS,
    SRC_INTERNAL,
  ],
};

export const mockMacroDashboard: MacroDashboard = {
  generatedAt: GENERATED_AT,
  source: "mock",
  regions: [usSnapshot, trSnapshot],
  yieldCurves,
  signals,
  themes,
  calendar,
  aiSummary,
};

export const emptyMacroDashboard: MacroDashboard = {
  generatedAt: GENERATED_AT,
  source: "mock",
  regions: [
    { region: "us", asOf: GENERATED_AT, indicators: [] },
    { region: "tr", asOf: GENERATED_AT, indicators: [] },
  ],
  yieldCurves: [],
  signals: [],
  themes: [],
  calendar: [],
  aiSummary: null,
};
