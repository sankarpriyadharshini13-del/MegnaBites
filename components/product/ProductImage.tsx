import Image from "next/image";
import type { Product } from "@/types";
import { LeafIcon } from "@/components/ui/Icons";

export default function ProductImage({ product, sizes, priority = false }: { product: Product; sizes: string; priority?: boolean }) {
  if (!product.image) {
    return (
      <div role="img" aria-label={`${product.name} — photo coming soon`} className="grid h-full w-full place-items-center bg-gradient-to-br from-sand to-husk/50 p-6 text-center">
        <div>
          <LeafIcon className="mx-auto text-leaf/60" width={30} height={30} />
          <p className="mt-3 font-display text-lg text-forest">{product.name}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink/50">Product photo coming soon</p>
        </div>
      </div>
    );
  }
  return <Image src={product.image} alt={product.imageAlt} fill sizes={sizes} priority={priority} className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />;
}
