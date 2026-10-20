"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/components/ui/Logo";
import { ArrowIcon, BagIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/Icons";
import { site } from "@/data/site";
import { useCart } from "@/context/CartContext";
import { useUI } from "@/context/UIContext";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const pathname = usePathname();
  const { open, close, panel } = useUI();
  const { count, hydrated, announcement } = useCart();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [hash, setHash] = useState("");
  const menuOpen = panel === "menu";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const onHash = () => setHash(window.location.hash);
    onScroll();
    onHash();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);
  useEffect(() => { if (menuOpen) close(); /* close menu on navigation */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/" && hash === href.slice(1);
    if (href === "/") return pathname === "/" && hash === "";
    return pathname.startsWith(href);
  };

  const navLink = (l: { href: string; label: string }, mobile = false) => (
    <Link
      key={l.href}
      href={l.href}
      aria-current={isActive(l.href) ? "page" : undefined}
      onClick={() => mobile && close()}
      className={`focus-ring rounded-full transition-colors ${mobile ? "block px-4 py-3.5 font-display text-2xl" : "px-3 py-2 text-[15px] font-medium lg:px-4"} ${
        isActive(l.href) ? "bg-forest text-white" : "text-ink/75 hover:text-forest hover:bg-sand/70"
      }`}
    >
      {l.label}
    </Link>
  );

  return (
    <header className={`sticky top-0 z-50 border-b transition-all duration-300 ${scrolled || menuOpen ? "border-leaf/10 bg-cream/90 shadow-soft backdrop-blur-xl" : "border-transparent bg-cream/70 backdrop-blur"}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[70] focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-cream">
        Skip to content
      </a>
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-0.5 md:flex">
          {site.nav.map((l) => navLink(l))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <button type="button" className="icon-btn" aria-label="Search products" onClick={() => open("search")}>
            <SearchIcon />
          </button>
          <button type="button" className="icon-btn relative" aria-label={user ? `Account: ${user.name}` : "Account / Log in"} onClick={() => open("account")}>
            <UserIcon />
            {user && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-clay" aria-hidden="true" />}
          </button>
          <button type="button" className="icon-btn relative" aria-label={`Open cart, ${hydrated ? count : 0} ${count === 1 ? "item" : "items"}`} onClick={() => open("cart")}>
            <BagIcon />
            {hydrated && count > 0 && (
              <span data-testid="cart-count" className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-clay px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
          <Link href="/shop" className="focus-ring ml-1 hidden items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-forest-deep lg:inline-flex">
            Shop Now <ArrowIcon width={16} height={16} />
          </Link>
          <button type="button" className="icon-btn md:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => (menuOpen ? close() : open("menu"))}>
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-leaf/10 bg-cream px-4 pb-8 pt-4 md:hidden">
          {site.nav.map((l) => navLink(l, true))}
          <Link href="/shop" onClick={close} className="btn-primary mt-6 w-full">Shop Now <ArrowIcon /></Link>
        </nav>
      )}
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
    </header>
  );
}
