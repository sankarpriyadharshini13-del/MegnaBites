"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/types";
import ProductImage from "./ProductImage";

/** Main photo plus thumbnails when the product has more than one photo. */
export default function ProductGallery({ product }: { product: Product }) {
  const photos = product.images?.length ? product.images : product.image ? [product.image] : [];
  const [active, setActive] = useState(0);
  const current = photos[active] ?? null;

  return (
    <div>
      <div className="group relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-sand shadow-lift sm:rounded-[2rem]">
        <ProductImage product={{ ...product, image: current }} sizes="(min-width:1024px) 45vw, 92vw" priority />
      </div>
      {photos.length > 1 && (
        <ul className="mt-3 flex gap-3 overflow-x-auto pb-1" aria-label="Product photos">
          {photos.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-pressed={i === active}
                className={`focus-ring relative block h-20 w-16 overflow-hidden rounded-xl bg-sand ring-2 transition sm:h-24 sm:w-20 ${i === active ? "ring-clay" : "ring-transparent opacity-75 hover:opacity-100"}`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
