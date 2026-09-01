type ChartPoint = {
  timestamp: number;
  close: number;
};

type MarketCard = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  marketState: string;
  chart: ChartPoint[];
};

const TICKERS = ["GGAL", "YPFD", "PAMP", "EDN", "BMA", "TX", "AAPL"];

function buildSparkline(points: ChartPoint[]) {
  if (!points.length) return "";

  const values = points.map((point) => point.close);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 220;
      const y = 60 - ((point.close - min) / range) * 52;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

async function getTickerData(symbol: string): Promise<MarketCard> {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1mo&interval=1d`,
    { next: { revalidate: 300 } },
  );

  if (!response.ok) {
    throw new Error(`No se pudo consultar ${symbol}`);
  }

  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  const meta = result?.meta ?? {};
  const quote = result?.indicators?.quote?.[0] ?? {};
  const closes: number[] = quote.close ?? [];
  const timestamps: number[] = result?.timestamp ?? [];

  const chart: ChartPoint[] = timestamps
    .map((timestamp: number, index: number) => ({
      timestamp,
      close: closes[index],
    }))
    .filter((point: ChartPoint) => typeof point.close === "number" && Number.isFinite(point.close));

  return {
    symbol,
    price: meta.regularMarketPrice ?? chart.at(-1)?.close ?? 0,
    change: meta.regularMarketChange ?? 0,
    changePercent: meta.regularMarketChangePercent ?? 0,
    marketState: meta.marketState ?? "CLOSED",
    chart,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export default async function Home() {
  const results = await Promise.allSettled(TICKERS.map(getTickerData));
  const marketData = results
    .filter((result): result is PromiseFulfilledResult<MarketCard> => result.status === "fulfilled")
    .map((result) => result.value);

  const portfolioValue = marketData.reduce((sum, item) => sum + item.price, 0);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
              Mercado / CEDEARs
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Panel financiero
            </h1>
          </div>

          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 shadow-lg shadow-emerald-950/20">
            <span className="block text-xs uppercase tracking-[0.2em] text-emerald-300/80">
              Portafolio demo
            </span>
            <strong className="mt-1 block text-2xl font-semibold">
              {formatCurrency(portfolioValue)}
            </strong>
          </div>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {marketData.slice(0, 4).map((item) => {
            const positive = item.changePercent >= 0;
            const path = buildSparkline(item.chart);

            return (
              <article
                key={item.symbol}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-slate-950/25"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{item.symbol}</p>
                    <h2 className="mt-1 text-2xl font-semibold">{formatCurrency(item.price)}</h2>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      positive
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-rose-500/10 text-rose-300"
                    }`}
                  >
                    {formatPercent(item.changePercent)}
                  </span>
                </div>

                <svg viewBox="0 0 220 60" className="h-14 w-full overflow-visible">
                  <path
                    d={path}
                    fill="none"
                    stroke={positive ? "#34d399" : "#f87171"}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{item.marketState}</span>
                  <span>{item.change >= 0 ? "+" : ""}{formatCurrency(item.change)}</span>
                </div>
              </article>
            );
          })}
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/30">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Cotizaciones</p>
              <h3 className="mt-1 text-xl font-semibold">CEDEARs y acciones</h3>
            </div>
            <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs text-sky-200">
              Datos en vivo (Yahoo Finance)
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Ticker</th>
                  <th className="px-4 py-3 font-medium">Precio</th>
                  <th className="px-4 py-3 font-medium">Cambio</th>
                  <th className="px-4 py-3 font-medium">1M</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-950/40">
                {marketData.map((item) => {
                  const positive = item.changePercent >= 0;

                  return (
                    <tr key={item.symbol} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-medium text-white">{item.symbol}</td>
                      <td className="px-4 py-3">{formatCurrency(item.price)}</td>
                      <td className={`px-4 py-3 font-medium ${positive ? "text-emerald-300" : "text-rose-300"}`}>
                        {formatPercent(item.changePercent)}
                      </td>
                      <td className="px-4 py-3">
                        <svg viewBox="0 0 120 28" className="h-7 w-28 overflow-visible">
                          <path
                            d={buildSparkline(item.chart.slice(-20))}
                            fill="none"
                            stroke={positive ? "#34d399" : "#f87171"}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
