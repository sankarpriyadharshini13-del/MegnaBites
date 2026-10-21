import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { site } from "@/data/site";

const socialLinks = [
  { name: "Instagram", href: "https://instagram.com/magnaecobites", icon: "📸" },
  { name: "Facebook", href: "https://facebook.com/magnaecobites", icon: "👤" },
  { name: "WhatsApp", href: "https://wa.me/919876543210", icon: "💬" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-forest to-forest-deep text-cream/70">
      {/* Decorative pattern */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {/* Brand Section */}
          <div className="xl:col-span-1">
            <Logo onDark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/80">
              Idli podi, country sugar and moringa blends — stone-ground in small batches in Kolathur, Chennai.
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  aria-label={social.name}
                  className="grid h-10 w-10 place-items-center rounded-full border border-cream/20 bg-cream/5 text-lg transition-all duration-300 hover:bg-cream/10 hover:border-cream/30 hover:scale-110"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <nav aria-label="Quick links">
            <h3 className="font-display text-lg font-semibold text-cream">Quick Links</h3>
            <ul className="mt-4 space-y-3">
              {[...site.nav, { href: "/#contact", label: "Contact" }].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm transition-colors duration-200 hover:text-honey hover:underline hover:underline-offset-4"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Policies */}
          <nav aria-label="Policies">
            <h3 className="font-display text-lg font-semibold text-cream">Policies</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/privacy" className="text-sm transition-colors duration-200 hover:text-honey hover:underline hover:underline-offset-4">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm transition-colors duration-200 hover:text-honey hover:underline hover:underline-offset-4">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-sm transition-colors duration-200 hover:text-honey hover:underline hover:underline-offset-4">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-sm transition-colors duration-200 hover:text-honey hover:underline hover:underline-offset-4">
                  Returns & Refunds
                </Link>
              </li>
            </ul>
          </nav>

          {/* Products */}
          <nav aria-label="Products">
            <h3 className="font-display text-lg font-semibold text-cream">Products</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/products/idli-podi" className="text-sm transition-colors duration-200 hover:text-honey hover:underline hover:underline-offset-4">
                  Idli Podi
                </Link>
              </li>
              <li>
                <Link href="/products/country-sugar" className="text-sm transition-colors duration-200 hover:text-honey hover:underline hover:underline-offset-4">
                  Country Sugar
                </Link>
              </li>
              <li>
                <Link href="/products/moringa-idli-podi" className="text-sm transition-colors duration-200 hover:text-honey hover:underline hover:underline-offset-4">
                  Moringa Idli Podi
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-sm transition-colors duration-200 hover:text-honey hover:underline hover:underline-offset-4">
                  View All Products
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="font-display text-lg font-semibold text-cream">Contact Us</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-honey">📍</span>
                <span>{site.location}</span>
              </li>
              {site.phone && (
                <li className="flex items-center gap-3">
                  <span className="text-honey">📞</span>
                  <a
                    href={`tel:${site.phone}`}
                    className="transition-colors duration-200 hover:text-honey hover:underline hover:underline-offset-4"
                  >
                    {site.phone}
                  </a>
                </li>
              )}
              <li className="flex items-center gap-3">
                <span className="text-honey">✉️</span>
                <a
                  href={`mailto:${site.email}`}
                  className="transition-colors duration-200 hover:text-honey hover:underline hover:underline-offset-4"
                >
                  {site.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-cream/10 pt-8 sm:mt-20 sm:pt-10">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-center text-xs text-cream/50 sm:text-left sm:text-sm">
              © {new Date().getFullYear()} Magna Eco Bites. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs sm:text-sm">
              <Link href="/privacy" className="transition-colors duration-200 hover:text-honey">
                Privacy Policy
              </Link>
              <Link href="/terms" className="transition-colors duration-200 hover:text-honey">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
