export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-sm">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-300">
          Finanzas
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Tu app está funcionando
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
          Esta página se renderiza correctamente y ya no depende de assets externos ni de la plantilla por defecto.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <span className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-200">
            Ruta / lista
          </span>
          <span className="rounded-full border border-sky-400/50 bg-sky-500/10 px-3 py-1 text-sm text-sky-200">
            Next.js 16
          </span>
        </div>
      </div>
    </main>
  );
}
