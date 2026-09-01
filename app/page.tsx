"use client";

import { useEffect, useMemo, useState } from "react";

type RangeKey = "1mo" | "6mo" | "1y" | "5y";

type ChartPoint = {
  time: number;
  close: number;
};

type TickerData = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  currency: string;
  chart: ChartPoint[];
};

const WATCHLIST = ["AAPL", "MSFT", "NVDA", "AMZN", "GGAL", "YPFD", "PAMP"];
const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "1mo", label: "1M" },
  { key: "6mo", label: "6M" },
  { key: "1y", label: "1A" },
  { key: "5y", label: "5A" },
];

function buildLinePath(points: ChartPoint[]) {
  if (!points.length) return "";

  const values = points.map((point) => point.close);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 720;
      const y = 220 - ((point.close - min) / range) * 180;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

async function fetchTickerData(symbol: string, range: RangeKey): Promise<TickerData> {
  const payload = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1d`,
    { cache: "no-store" },
  );

  if (!payload.ok) {
    throw new Error(`No pude traer ${symbol}`);
  }

  const data = await payload.json();
  const result = data?.chart?.result?.[0];
  const meta = result?.meta ?? {};
  const quote = result?.indicators?.quote?.[0] ?? {};
  const closes: number[] = quote.close ?? [];
  const timestamps: number[] = result?.timestamp ?? [];

  const chart: ChartPoint[] = timestamps
    .map((time: number, index: number) => ({
      time,
      close: closes[index],
    }))
    .filter((point) => typeof point.close === "number" && Number.isFinite(point.close));

  return {
    symbol: symbol.toUpperCase(),
    price: meta.regularMarketPrice ?? chart.at(-1)?.close ?? 0,
    change: meta.regularMarketChange ?? 0,
    changePercent: meta.regularMarketChangePercent ?? 0,
    previousClose: meta.previousClose ?? chart[0]?.close ?? 0,
    currency: meta.currency ?? "USD",
    chart,
  };
}

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [selectedRange, setSelectedRange] = useState<RangeKey>("1mo");
  const [data, setData] = useState<TickerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const nextData = await fetchTickerData(selectedSymbol, selectedRange);
        if (active) setData(nextData);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Error al cargar el activo");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [selectedSymbol, selectedRange]);

  const path = useMemo(() => (data ? buildLinePath(data.chart) : ""), [data]);
  const positive = (data?.changePercent ?? 0) >= 0;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-3 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
              Análisis técnico
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Panel de acciones</h1>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelectedRange(option.key)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  selectedRange === option.key
                    ? "bg-emerald-400 text-slate-950"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-slate-950/20">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              Watchlist
            </p>

            <div className="space-y-2">
              {WATCHLIST.map((symbol) => {
                const active = symbol === selectedSymbol;
                return (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => setSelectedSymbol(symbol)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition ${
                      active
                        ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                        : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20"
                    }`}
                  >
                    <span className="font-semibold">{symbol}</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      {symbol === "AAPL" ? "USA" : "Mkt"}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/30">
            {loading && !data ? (
              <div className="flex min-h-[360px] items-center justify-center text-slate-300">
                Cargando precio y gráfico...
              </div>
            ) : error ? (
              <div className="flex min-h-[360px] items-center justify-center text-rose-300">{error}</div>
            ) : data ? (
              <>
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Activo</p>
                    <h2 className="mt-2 text-4xl font-bold tracking-tight">{data.symbol}</h2>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Precio</p>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="text-3xl font-semibold">
                        {formatCurrency(data.price, data.currency)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-sm font-medium ${
                          positive ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"
                        }`}
                      >
                        {formatPercent(data.changePercent)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Cambio absoluto</p>
                    <p className={`mt-2 text-lg font-semibold ${positive ? "text-emerald-300" : "text-rose-300"}`}>
                      {data.change >= 0 ? "+" : ""}
                      {formatCurrency(data.change, data.currency)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Cierre previo</p>
                    <p className="mt-2 text-lg font-semibold text-slate-100">
                      {formatCurrency(data.previousClose, data.currency)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Rango</p>
                    <p className="mt-2 text-lg font-semibold text-slate-100">{selectedRange.toUpperCase()}</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                  <svg viewBox="0 0 720 220" className="h-72 w-full overflow-visible">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={positive ? "#34d399" : "#f87171"} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={positive ? "#34d399" : "#f87171"} stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {[0, 1, 2, 3].map((line) => (
                      <line
                        key={line}
                        x1="0"
                        x2="720"
                        y1={30 + line * 50}
                        y2={30 + line * 50}
                        stroke="rgba(148, 163, 184, 0.12)"
                        strokeWidth="1"
                      />
                    ))}

                    <path d={`${path} L 720,220 L 0,220 Z`} fill="url(#chartGradient)" opacity="0.9" />
                    <path
                      d={path}
                      fill="none"
                      stroke={positive ? "#34d399" : "#f87171"}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
