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
