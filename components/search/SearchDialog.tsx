"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Dialog from "@/components/ui/Dialog";
import { SearchIcon } from "@/components/ui/Icons";
import { useUI } from "@/context/UIContext";
import { useProductSearch } from "@/hooks/useProductSearch";
import Price from "@/components/ui/Price";

export default function SearchDialog() {
  const { panel, close } = useUI();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useProductSearch(query);
  const open = panel === "search";

  const handleClose = () => {
    setQuery("");
    close();
  };

  return (
    <Dialog open={open} onClose={handleClose} variant="top" title="Search products" initialFocus={() => inputRef.current}>
      <form role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="site-search" className="sr-only">Search Magna Eco Bites products</label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-forest/60" />
          <input
            id="site-search"
            ref={inputRef}
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try “idli”, “sugar” or “moringa”"
            className="w-full rounded-full border border-leaf/20 bg-white/70 py-3.5 pl-12 pr-4 text-base text-ink outline-none placeholder:text-ink/40 focus:border-forest focus:ring-4 focus:ring-leaf/15"
          />
        </div>
      </form>
      <p className="mt-4 text-sm text-ink/60" role="status" aria-live="polite">
        {results.length === 0 ? `No products match “${query}”.` : `${results.length} ${results.length === 1 ? "product" : "products"}${query ? " found" : ""}`}
      </p>
      <ul className="mt-2 divide-y divide-leaf/10">
        {results.map((p) => (
          <li key={p.id}>
            <Link href={`/products/${p.slug}`} onClick={handleClose} className="focus-ring flex items-center justify-between gap-4 rounded-xl px-2 py-3.5 hover:bg-sand/60">
              <span>
                <span className="block font-display text-lg text-forest">{p.name}</span>
                <span className="block text-sm text-ink/60">{p.description}</span>
              </span>
              <Price amount={p.priceInr} className="shrink-0 !text-base" />
            </Link>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
