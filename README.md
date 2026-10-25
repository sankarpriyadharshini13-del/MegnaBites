# Magna Eco Bites — Storefront

A modern, responsive e-commerce storefront for Magna Eco Bites - traditional South Indian food products made with organic ingredients.

## Tech Stack
- **Next.js 14** (App Router)
- **Tailwind CSS** for styling
- **Supabase** for authentication
- **TypeScript** for type safety

## Features
- 🎨 **Beautiful UI** - Warm ivory / forest green / burnt orange design with smooth animations
- 📱 **Fully Responsive** - Optimized for all devices (mobile, tablet, desktop)
- ⚡ **Lazy Loading** - Components and pages load dynamically for better performance
- 🔄 **Smooth Scrolling** - Seamless navigation between sections
- 🎠 **Feature Carousel** - Infinite scrolling marquee showcasing product features
- 👥 **User Authentication** - Sign up, sign in, and account management via Supabase
- 🛒 **Shopping Cart** - Persistent cart with localStorage
- 📦 **Product Catalog** - Dynamic product pages with images and details
- 📧 **Contact Form** - Easy way for customers to reach out

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev      # http://localhost:3000

# Build for production
npm run build && npm start
```

## Project Structure
```
├── app/                      # Next.js App Router
│   ├── page.tsx             # Home page
│   ├── shop/                # Shop page
│   ├── products/[slug]/     # Product detail pages
│   ├── account/             # User account page
│   └── globals.css          # Global styles
├── components/
│   ├── layout/              # Header, Footer, SiteShell
│   ├── home/                # Hero, FeaturedProducts, About, Contact, etc.
│   ├── product/             # ProductCard, ProductImage, AddToCartButton
│   ├── cart/                # CartDrawer
│   ├── search/              # SearchDialog
│   ├── auth/                # AuthDialog
│   └── ui/                  # Reusable UI components
├── context/                 # React Context providers
│   ├── CartContext.tsx      # Shopping cart state
│   ├── AuthContext.tsx      # Authentication state
│   └── UIContext.tsx        # UI state (modals, panels)
├── data/
│   ├── products.ts          # Product catalog (set prices, images here)
│   └── site.ts              # Navigation and site content
├── services/
│   ├── auth.ts              # Authentication service
│   ├── checkout.ts          # Checkout integration
│   └── cartStorage.ts       # Cart storage utilities
├── hooks/                   # Custom React hooks
├── lib/                     # Utility libraries
├── types/                   # TypeScript type definitions
└── public/images/           # Static images
```

## Configuration

### Environment Variables
Copy `.env.example` to `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Supabase Setup

1. **Create a Supabase project** at https://supabase.com/dashboard

2. **Run the migration**:
   - Go to Dashboard → SQL Editor
   - Paste and run `supabase/migrations/20261020000000_profiles.sql`
   - This creates the `profiles` table with RLS and auto-create trigger

3. **Add environment variables**:
   - Dashboard → Settings → API
   - Copy Project URL and anon/publishable key to `.env.local`
   - Restart `npm run dev`

4. **Configure authentication**:
   - Dashboard → Authentication → URL Configuration
   - Set **Site URL** to your domain
   - Add redirect URLs: `<your-domain>/account` and `<your-domain>/auth/reset`
   - Also add localhost equivalents for development

5. **Email confirmation** (optional):
   - Dashboard → Authentication → Providers → Email
   - Toggle "Confirm email" OFF for automatic login
   - Keep ON for email verification (recommended for production)
   - For production email volume, configure custom SMTP

## Product Management

Edit `data/products.ts` to add/update products:

```typescript
{
  id: "product-id",
  slug: "product-slug",
  name: "Product Name",
  tag: "Bestseller",
  description: "Short description",
  longDescription: "Detailed description",
  packSize: "200g",
  priceInr: 299,
  image: "/images/products/product.jpg",
  imageAlt: "Alt text for image",
  featured: true,
}
```

## Navigation

Edit `data/site.ts` to update navigation links:

```typescript
nav: [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop for Home" },
  { href: "/#business", label: "For Business" },
  { href: "/#distributors", label: "Distributors" },
  { href: "/#export", label: "Export" },
]
```

## Integrations

### Current
- ✅ Authentication (Supabase)
- ✅ Cart management (localStorage)
- ✅ Contact form (email)
- ✅ Product catalog
- ✅ Lazy loading
- ✅ Responsive design

### To Be Added
- ⏳ Payment gateway integration
- ⏳ Order management backend
- ⏳ Real-time inventory tracking
- ⏳ Email service integration

## Deployment

This project can be deployed to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Any Node.js hosting**

For Vercel:
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## License

© 2026 Magna Eco Bites. All rights reserved.

## Admin console (`/admin`)

Seven screens — Dashboard, Orders, Products & Stock, Barcodes & Labels, Customers, Payments & Refunds,
Settings — all read from and write to Supabase through the server routes in `app/api/admin/*`.
The storefront's **Our Shop**, `/shop` and product pages read the same `products` table, so anything saved
in Products & Stock appears on the site (hidden products disappear from it).

### One-time setup

1. **Database** — Supabase → SQL Editor → run, in order:
   `supabase/migrations/20261020000000_profiles.sql` then `supabase/migrations/20261025000000_admin_catalog.sql`.
   This creates the tables, row-level-security policies, invitation functions, the `admin-assets`
   storage bucket and the three existing products.
2. **Owner account** — copy the `service_role` key (Project Settings → API) and run (PowerShell):

   ```powershell
   $env:SUPABASE_SERVICE_ROLE_KEY="<service_role key>"
   $env:ADMIN_EMAIL="<owner email>"; $env:ADMIN_PASSWORD="<owner password>"; $env:ADMIN_NAME="Magesh"
   node --env-file=.env scripts/create-admin.mjs
   ```

   The password is stored by Supabase Auth as a bcrypt hash; nothing is written to the repo.
   Never put the service-role key in a `NEXT_PUBLIC_` variable. Use the real values — not the `<...>` placeholders.
   To **change the owner's email later**, run the same command with the new `ADMIN_EMAIL` and `$env:ALLOW_OWNER_EMAIL_CHANGE="1"`.
3. Restart `npm run dev` (the image domain in `next.config.js` is read at start-up).

### How access works

- Sign in from the site's login dialog. The server checks the session and `public.admin_members`;
  admins are sent straight to `/admin`. Anyone else who opens `/admin` is sent to sign in or shown
  "No admin access", and every admin API returns 401/403 for them. RLS enforces the same rules in the
  database itself.
- **Invitations** (Settings → Team & access, owner only) create a single-use link valid for 7 days.
  Only a SHA-256 hash of the token is stored. The link works only for an account signed in with the
  invited, confirmed email; accepting it grants admin access. The owner can revoke invites, create a
  **New link** for a pending invite, and remove admins. No email is sent — copy the link and send it yourself.
- Set `NEXT_PUBLIC_SITE_URL=https://your-domain` in the environment so invitation links point at the live
  site instead of `localhost`. In Supabase → Authentication → URL Configuration, add your site (and
  `http://localhost:3000/**` for development) to **Redirect URLs** so confirmation emails can return
  new invitees to the invite page.
- **Customers** lists every site account (synced from sign-ups by the database) plus anyone who ordered.

### Notes

- Product photos are compressed in the browser, validated on the server (JPG/PNG/WebP, ≤ 1.5 MB) and
  stored in Supabase Storage.
- If the database can't be reached, the storefront falls back to `data/products.ts` so it never goes blank.
- Razorpay is **not** called: refunds are recorded in the database only. Orders are not created by the
  website yet (checkout still opens an email), so Orders/Customers/Payments stay empty until an order
  source is connected.
- `scripts/` and the SQL migration are the only places that touch the service role or schema.
