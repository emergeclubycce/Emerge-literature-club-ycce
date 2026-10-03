# Emerge Literature Club - Official Website

The official web platform for **Emerge - The Literature Club of YCCE**, showcasing literary events, creative chronicles, poetry/shayari archives, member chronicles, and community interaction.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create or verify your `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🛡️ Security Audit & Recent Fixes

A comprehensive security audit and remediation was completed to resolve deployment blockers and harden the website.

> 📄 **Full Detailed Audit Report:** See [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md)

### Key Problems Resolved:
1. **Next.js Vulnerability Blocker:** Resolved critical Next.js vulnerabilities that halted deployments. Updated to Next.js 16.3.8.
2. **Complete Removal of Firebase:** Purged unused Firebase configuration and environment variables; the app exclusively uses Supabase.
3. **HTTP Security Headers Added:** Configured `X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy`, and `Referrer-Policy` in `next.config.ts`.
4. **Server-Side Route Guard:** Added `src/middleware.ts` to block unauthenticated requests to `/admin` before page bundles load.
5. **Production Error Protection:** Created `src/utils/logger.ts` to suppress internal database schemas and storage error traces in browser DevTools for production.
6. **Input Validation & Anti-Spam:** Added image URL validation in profile management and a 60-second rate limiter to `/shers/submit`.
7. **App Router Layout Fix:** Renamed internal `layout.tsx` component to `layout-component.tsx` to resolve Next.js App Router naming collisions.

---

## 🛠️ Tech Stack
- **Framework:** [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Styling:** Tailwind CSS & Framer Motion
- **Database & Auth:** [Supabase](https://supabase.com/)
- **Icons:** Lucide React
- **Smooth Scrolling:** Lenis
