import { useState } from "react";
import type { CapitalSearchResultView, CapitalHealthView } from "@/lib/view-types";

interface CapitalSearchPanelProps {
  results: CapitalSearchResultView[];
  total: number;
  loading: boolean;
  query: string;
  health: CapitalHealthView | null;
  healthError: boolean;
  onSearch: (query: string) => void;
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(Math.max(score * 100, 0), 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 bg-white/5">
        <div
          className="h-full bg-emerald-500/60"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs text-zinc-400">{(score * 100).toFixed(1)}%</span>
    </div>
  );
}

export function CapitalSearchPanel({
  results,
  total,
  loading,
  query,
  health,
  healthError,
  onSearch,
}: CapitalSearchPanelProps) {
  const [inputValue, setInputValue] = useState(query);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  }

  return (
    <div className="space-y-4">
      <div className="border border-white/10 bg-[#0b0d10] p-4">
        <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          Capital Search
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search capital briefs..."
            className="flex-1 border border-white/10 bg-black px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-emerald-500/40"
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {health && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-5">
          {[
            { label: "Status", value: health.status },
            { label: "Mode", value: health.mode },
            { label: "Dimensions", value: String(health.dimensions) },
            { label: "Model", value: health.modelLoaded ? "Loaded" : "Not loaded" },
            { label: "Uptime", value: health.uptimeHint },
          ].map((item) => (
            <div key={item.label} className="border border-white/10 bg-[#0b0d10] px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">{item.label}</div>
              <div className="font-mono text-sm text-zinc-200">{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {healthError && (
        <div className="border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-400">
          Capital health unavailable. Is the daemon running?
        </div>
      )}

      {query && !loading && results.length === 0 && (
        <div className="border border-white/10 bg-[#0b0d10] px-4 py-8 text-center text-sm text-zinc-500">
          No results found for &ldquo;{query}&rdquo;
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              Results
            </span>
            <span className="font-mono text-xs text-zinc-500">
              {total} total
            </span>
          </div>
          {results.map((result) => (
            <div
              key={result.id}
              className="border border-white/10 bg-[#0b0d10] p-4"
            >
              <div className="mb-2 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-200">{result.title}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-zinc-500">
                    {result.id} &middot; {result.source}
                  </div>
                </div>
                <ScoreBar score={result.score} />
              </div>
              <div className="text-xs leading-5 text-zinc-400">{result.content}</div>
            </div>
          ))}
        </div>
      )}

      {!query && results.length === 0 && !loading && (
        <div className="border border-white/10 bg-[#0b0d10] px-4 py-12 text-center text-sm text-zinc-500">
          Enter a query to search the capital knowledge base.
        </div>
      )}
    </div>
  );
}
