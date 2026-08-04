# TkanMarket – Frontend PRD
# Complete Page-by-Page Specification for Cursor AI
**Version:** 1.0.0 | **Audience:** Frontend Engineer + Cursor AI

---

## Table of Contents
1. [Design System & Layout Foundation](#1-design-system--layout-foundation)
2. [Public Marketplace Pages](#2-public-marketplace-pages)
3. [Admin Dashboard Pages](#3-admin-dashboard-pages)
4. [Shared Components Library](#4-shared-components-library)
5. [State Management Architecture](#5-state-management-architecture)
6. [Routing Architecture](#6-routing-architecture)

---

## 1. Design System & Layout Foundation

### 1.1 Color Palette (tailwind.config.ts)
```typescript
colors: {
  brand: {
    50:  '#f0f4ff',
    100: '#e0e9ff',
    500: '#3b5bdb',  // Primary CTA
    600: '#3451c7',
    700: '#2b42a8',
    900: '#1a2b6d',
  },
  neutral: {
    50:  '#f8f9fa',
    100: '#f1f3f5',
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#adb5bd',
    600: '#868e96',
    700: '#495057',
    800: '#343a40',
    900: '#212529',
  },
  success: '#2f9e44',
  warning: '#e67700',
  error:   '#c92a2a',
}
```

### 1.2 Typography Scale
```typescript
fontFamily: {
  sans: ['Inter', 'sans-serif'],        // Body text
  heading: ['Manrope', 'sans-serif'],   // Headings
  mono: ['JetBrains Mono', 'monospace'],// Code/SKU
},
fontSize: {
  'display-xl': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
  'display-lg': ['2.8rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
  'display':    ['2.25rem', { lineHeight: '1.2',  letterSpacing: '-0.015em' }],
  'heading-xl': ['1.75rem', { lineHeight: '1.3',  letterSpacing: '-0.01em' }],
  'heading-lg': ['1.5rem',  { lineHeight: '1.35', letterSpacing: '-0.01em' }],
  'heading':    ['1.25rem', { lineHeight: '1.4' }],
  'body-lg':    ['1.125rem',{ lineHeight: '1.7' }],
  'body':       ['1rem',    { lineHeight: '1.6' }],
  'body-sm':    ['0.875rem',{ lineHeight: '1.5' }],
  'caption':    ['0.75rem', { lineHeight: '1.5' }],
}
```

### 1.3 Spacing System
8px base grid. Use Tailwind's default spacing (4 = 16px, 8 = 32px, etc.)

### 1.4 Public Layout Structure
```
┌─────────────────────────────────────────┐
│ TopBanner (promo strip, optional)        │
├─────────────────────────────────────────┤
│ Header                                  │
│  Logo | Navigation | Search | Contact   │
├─────────────────────────────────────────┤
│ <page content>                          │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│ Footer                                  │
│  Links | Contacts | Social | Legal      │
└─────────────────────────────────────────┘
```

### 1.5 Admin Layout Structure
```
┌──────┬──────────────────────────────────┐
│      │ TopBar (user, notifications)     │
│ Side │──────────────────────────────────│
│ bar  │ <page content>                   │
│      │                                  │
│      │                                  │
│      │                                  │
└──────┴──────────────────────────────────┘
```

---

## 2. Public Marketplace Pages

---

### PAGE 01: Homepage `/`

**File:** `/src/app/(public)/page.tsx`
**Rendering:** SSR (revalidate: 1800)
**Purpose:** First impression, discovery starting point, trust building

---

#### Section 1: Hero Section
**Component:** `HeroSection`
**Position:** Top of page, full viewport width

**Content:**
- **Headline (H1):** "Найдите идеальную ткань для вашего производства"
  - Font: Manrope, display-xl, font-weight: 800, color: neutral-900
- **Subheadline:** "Тысячи тканей от проверенных китайских поставщиков. Бесплатные образцы. Прямые поставки в Россию и СНГ."
  - Font: Inter, body-lg, color: neutral-600, max-width: 580px
- **CTA Buttons (row):**
  - Primary: "Смотреть каталог" → links to `/fabrics`
    - Style: bg-brand-500, text-white, px-8, py-4, rounded-xl, text-lg font-semibold
  - Secondary: "Запросить образец" → scrolls to contact form
    - Style: border-2 border-brand-500, text-brand-500, same size
- **Trust indicators row (below CTAs):**
  - ✓ 10,000+ тканей
  - ✓ 500+ поставщиков
  - ✓ Доставка в Россию и СНГ
  - Font: body-sm, color: neutral-600, with checkmark icon (green)
- **Background:** Subtle fabric texture SVG pattern (low opacity) or gradient from neutral-50 to white

---

#### Section 2: Search Bar
**Component:** `HomeSearchBar`
**Position:** Immediately below hero, centered, high visual priority

**Content:**
- Large search input: placeholder "Найдите ткань по материалу, артикулу или применению..."
  - Full width container, max-width: 720px, centered
  - Height: 64px
  - Left icon: search icon (Lucide)
  - Right button: "Найти" (bg-brand-500, text-white)
- Below the input, quick filter chips:
  - "Хлопок", "Лён", "Полиэстер", "Шёлк", "Шерсть", "Трикотаж"
  - Each chip: small rounded pill, bg-neutral-100, hover: bg-brand-100, text-brand-700
  - Clicking chip navigates to `/fabrics?material=хлопок` etc.

---

#### Section 3: Featured Categories
**Component:** `CategoryGrid`
**Position:** Below search

**Content:**
- Section heading: "Популярные категории" (H2, heading-xl)
- Grid: 3 columns on desktop, 2 on tablet, 1 on mobile
- **6 category cards:**
  1. Хлопковые ткани – icon/image, count badge (e.g., "2,340 тканей")
  2. Льняные ткани
  3. Синтетические ткани
  4. Шёлковые ткани
  5. Шерстяные ткани
  6. Трикотаж
- Card design: rounded-2xl, overflow-hidden, image background with dark overlay, white text, hover: scale(1.02) transition
- Each card links to `/fabrics?category=cotton` etc.

---

#### Section 4: Featured Fabrics
**Component:** `FeaturedFabricsSection`
**Data source:** Server fetch – 8 fabrics with `is_featured = true` OR highest social score

**Content:**
- Section heading: "Популярные ткани" (H2)
- Right of heading: "Смотреть все →" link to `/fabrics`
- Grid: 4 columns desktop, 2 tablet, 1 mobile
- Uses `<FabricCard>` component (see Section 4 – Shared Components)
- Loading: skeleton cards

---

#### Section 5: How It Works
**Component:** `HowItWorksSection`

**Content:**
- Section heading: "Как это работает"
- 4 steps in a horizontal flow (desktop) / vertical list (mobile):
  1. **Найдите ткань** – Browse catalog or search by specifications
  2. **Запросите образец** – Free sample shipped to your location
  3. **Оцените качество** – Test the fabric before committing
  4. **Оформите заказ** – Direct order from supplier
- Each step: number badge (brand-500 bg), icon, title (heading), description (body-sm)
- Connector lines between steps on desktop

---

#### Section 6: Trust & Stats Section
**Component:** `TrustStatsSection`

**Content:**
- Background: brand-500 (dark blue)
- Text: white
- 4 stat blocks in a row:
  1. **10,000+** Тканей в каталоге
  2. **500+** Проверенных поставщиков
  3. **1,000+** Покупателей
  4. **50+** Стран доставки
- Below stats: single CTA button: "Начать поиск" → `/fabrics`

---

#### Section 7: Recent Blog / Trends (optional Phase 2)
Placeholder component only in Phase 1. Reserve grid space.

---

#### Section 8: Lead Capture / Contact Section
**Component:** `HomeLeadForm`

**Content:**
- Section heading: "Не нашли нужную ткань?"
- Subheading: "Оставьте запрос — наши специалисты подберут поставщика лично"
- Form fields (2 column grid):
  - Company name (required)
  - Full name (required)
  - Email (required)
  - Phone
  - Country (select, CIS countries list)
  - What fabric you need (textarea)
- Submit button: "Отправить запрос" (full width on mobile)
- Success state: inline success message (no page reload)
- Form submits to `POST /api/v1/leads`

---

#### Section 9: Footer
**Component:** `Footer`
**Content:**
- 4 column layout on desktop, 2 on tablet, stacked on mobile
- Column 1: Logo + tagline + social links (Instagram, TikTok, Pinterest)
- Column 2: Каталог links (Все ткани, По материалу, По применению, Поставщики)
- Column 3: Компания (О нас, Контакты, Блог)
- Column 4: Контакты (email, WhatsApp, Telegram)
- Bottom bar: copyright + privacy policy + terms

---

### PAGE 02: Fabric Catalog `/fabrics`

**File:** `/src/app/(public)/fabrics/page.tsx`
**Rendering:** SSR (revalidate: 300)
**Purpose:** Primary discovery page – browsing + filtering

---

#### Layout Structure
```
┌───────────────────────────────────────────────────────┐
│ Breadcrumb: Главная / Каталог тканей                   │
├─────────────┬─────────────────────────────────────────┤
│ Filter      │ Sort bar + Active filters               │
│ Sidebar     │─────────────────────────────────────────│
│ (280px)     │ Fabric Grid (3 col desktop, 2 tab, 1 mob│
│             │                                         │
│             │ [card][card][card]                      │
│             │ [card][card][card]                      │
│             │                                         │
│             │─────────────────────────────────────────│
│             │ Pagination                              │
└─────────────┴─────────────────────────────────────────┘
```

---

#### Component: FilterSidebar
**File:** `/src/components/marketplace/FilterSidebar.tsx`
**Behavior:** Fixed on desktop, slide-in drawer on mobile

**Filter Groups (in order):**

1. **Материал / Material**
   - Checkboxes: Хлопок, Лён, Полиэстер, Шёлк, Шерсть, Вискоза, Нейлон, Спандекс, Другое
   - Show count in parentheses next to each (e.g., "Хлопок (1,234)")

2. **Тип ткани / Fabric Type**
   - Checkboxes: Трикотаж, Тканая, Нетканая, Кружево, Подкладочная

3. **Плотность / GSM**
   - Dual-handle range slider: 50–800 GSM
   - Input fields for manual entry (from / to)

4. **Ширина / Width**
   - Checkboxes: < 100cm, 100–140cm, 140–160cm, > 160cm

5. **Минимальный заказ / MOQ**
   - Checkboxes: < 50м, 50–200м, 200–500м, 500м+

6. **Цена / Price**
   - Range slider: 0–$50/meter

7. **Поставщик / Supplier**
   - Search-within-filter input
   - Top 10 supplier names as checkboxes

**Filter UI behavior:**
- Applied filters reflected in URL query params
- "Сбросить фильтры" button clears all
- Filter changes trigger SSR navigation (full page reload with server filtering)
- On mobile: "Фильтры" floating button opens FilterDrawer

---

#### Component: SortBar
**Position:** Above the grid

**Content:**
- Left: Result count text: "Найдено 4,820 тканей"
- Right: Sort select dropdown:
  - "По умолчанию"
  - "Сначала новые"
  - "Цена: по возрастанию"
  - "Цена: по убыванию"
  - "По плотности (GSM)"
- Mobile: Sort included in FilterDrawer

---

#### Component: ActiveFilterTags
**Position:** Below SortBar, above grid

Shows currently applied filters as dismissible tags.
E.g.: [Хлопок ×] [GSM: 150–300 ×] [< 200м ×]

---

#### Component: FabricGrid
Responsive grid of FabricCard components. 24 per page.

---

#### Component: FabricCard
**File:** `/src/components/marketplace/FabricCard.tsx`

**Content structure (vertical card):**
- Image (aspect-ratio: 4/3, rounded-xl top, object-cover)
  - Lazy loaded
  - On hover: slight zoom (scale-105)
  - Badge top-left: fabric type (e.g., "Хлопок")
- Card body (p-4):
  - Title: 2 lines max, ellipsis, heading font, 15px, color neutral-900
  - Supplier name: body-sm, color neutral-500, with small supplier icon
  - Spec chips row: GSM value, width, composition (small badges)
  - Price row: "от $X.XX/м" (bold, brand-500) | MOQ: "от 100м" (neutral-600)
- Card footer (p-4 pt-0):
  - "Подробнее" button (full width, outline style)
  - Quick "Запрос образца" icon button (right corner)

**Click:** Navigates to `/fabrics/[slug]`

---

#### Component: Pagination
- Previous / page numbers / Next
- Shows max 7 page numbers with ellipsis
- Linked pagination (URL params: `?page=N`)

---

### PAGE 03: Fabric Detail `/fabrics/[slug]`

**File:** `/src/app/(public)/fabrics/[slug]/page.tsx`
**Rendering:** ISR (generateStaticParams for top 1000 fabrics, revalidate: 3600)
**Purpose:** Conversion page – convince buyer to request sample

---

#### Layout Structure (Desktop: 2 column)
```
┌─────────────────────────────────────────────────────┐
│ Breadcrumb: Главная / Каталог / Хлопковые / [title] │
├──────────────────────────┬──────────────────────────┤
│ Image Gallery            │ Product Info Panel       │
│ (60% width)              │ (40% width, sticky)      │
│                          │                          │
│ [Main large image]       │ Title (H1)               │
│ [Thumbnail strip]        │ Supplier info            │
│                          │ Price + MOQ              │
│                          │ Spec badges              │
│                          │ [Request Sample button]  │
│                          │ [Bulk Inquiry button]    │
│                          │ [Save to Wishlist icon]  │
├──────────────────────────┴──────────────────────────┤
│ Tabs: Описание | Характеристики | Поставщик         │
├─────────────────────────────────────────────────────┤
│ Related Fabrics (horizontal scroll carousel)        │
└─────────────────────────────────────────────────────┘
```

---

#### Component: ImageGallery
- Main image: large, aspect 1:1, rounded-2xl
- Thumbnails: horizontal row below, 80×80px, click to swap main
- Zoom on hover (CSS transform)
- Lightbox on click (full screen)

---

#### Component: ProductInfoPanel (sticky on desktop)

**Content (top to bottom):**

1. **Fabric Type Badge** – e.g., "Хлопок • Тканая"
2. **Title (H1)** – fabric name in Russian, font: Manrope heading-xl, bold
3. **SKU/Article** – "Арт: TKN-00042", mono font, caption size, neutral-500
4. **Rating/Trust row** – supplier verification badge, country flag (China)
5. **Price block:**
   - "от $X.XX / метр" – large, brand-500, heading-lg bold
   - "МИН. ЗАКАЗ: 100 метров" – label caption, neutral-600
6. **Quick spec grid (2×2):**
   - Плотность: 180 GSM
   - Ширина: 150 см
   - Состав: 100% Хлопок
   - Тип: Тканая
7. **Primary CTA: "Запросить образец"**
   - Full width, large, bg-brand-500, white text
   - Opens SampleRequestModal
8. **Secondary CTA: "Запрос оптовой партии"**
   - Full width, outline, brand-500 border/text
   - Opens BulkInquiryModal
9. **Trust badges row:**
   - 🚀 Быстрый ответ
   - ✈️ Доставка в Россию
   - 🔒 Проверенный поставщик

---

#### Component: ProductTabs

**Tab 1: Описание**
- Full product description in Russian (AI-generated)
- Rich text, 200–400 words
- Possible use cases section

**Tab 2: Характеристики (Specifications)**
- Full spec table:
  | Характеристика | Значение |
  |---|---|
  | Состав | 80% Хлопок, 20% Полиэстер |
  | Плотность | 180 г/м² |
  | Ширина | 150 см |
  | Тип переплетения | Саржа |
  | Тип отделки | Окрашенная |
  | Применение | Одежда, рубашки |
  | МОК | 100 метров |
  | Цена | от $3.50/м |
- Clean table, alternating row background

**Tab 3: Поставщик**
- Supplier logo + name
- Verification status badge
- Location (city, province, China)
- Established year
- Brief supplier description
- Product range stats
- Link to full supplier profile: "Все ткани поставщика →"

---

#### Component: RelatedFabrics
- Horizontal scroll carousel on mobile, 4-column grid on desktop
- Title: "Похожие ткани"
- 8 related fabrics (same category or composition)
- Uses FabricCard component

---

#### Component: SampleRequestModal
**Trigger:** "Запросить образец" button

**Form fields:**
- Company name (required)
- Full name (required)
- Email (required)
- Phone
- Country (select)
- City
- Delivery address
- Additional notes (textarea, optional)

**Pre-filled:** fabric name, fabric ID
**Submit to:** `POST /api/v1/leads` with `source: 'SAMPLE_REQUEST'`, `fabricId`
**Success state:** Thank you message in modal, option to close

---

#### Component: BulkInquiryModal
**Trigger:** "Запрос оптовой партии" button

**Form fields:**
- Company name (required)
- Full name (required)
- Email (required)
- Phone (required)
- Country + City
- Required quantity (meters)
- Target price ($/meter, optional)
- Delivery timeline
- Message (textarea)

**Submit to:** `POST /api/v1/leads` with `source: 'MARKETPLACE_INQUIRY'`, `fabricId`

---

### PAGE 04: Supplier Profile `/suppliers/[slug]`

**File:** `/src/app/(public)/suppliers/[slug]/page.tsx`
**Rendering:** ISR (revalidate: 3600)

---

#### Layout
```
┌──────────────────────────────────────────┐
│ Supplier Header Card                     │
│ Logo | Name | Location | Stats | Badge   │
├──────────────────────────────────────────┤
│ About Supplier (description)             │
├──────────────────────────────────────────┤
│ Supplier's Fabric Catalog                │
│ (uses same FabricGrid + pagination)      │
└──────────────────────────────────────────┘
```

**Supplier Header Card:**
- Supplier logo (100×100, rounded-xl)
- Company name (H1)
- Location: City, Province, China 🇨🇳
- Founded year
- Verified badge (green ✓ Проверенный поставщик)
- Stats: X тканей в каталоге | Y лет на рынке
- CTA: "Связаться с поставщиком" → opens ContactModal

---

### PAGE 05: Contact `/contact`

**File:** `/src/app/(public)/contact/page.tsx`
**Rendering:** SSG

**Content:**
- Page heading: "Свяжитесь с нами"
- Left column: Contact information (email, WhatsApp, Telegram, address)
- Right column: Contact form (name, email, phone, company, message)
- Submit to `POST /api/v1/leads` with `source: 'DIRECT_CONTACT'`

---

---

## 3. Admin Dashboard Pages

**Base Route:** `/admin`
**Auth:** Session-required, role: ADMIN | SALES | VIEWER
**Layout:** AdminLayout with collapsible sidebar

---

### Admin Sidebar Navigation
```
📊 Dashboard
─────────────
🧵 Каталог
   ├── Все ткани
   ├── На проверке
   └── Отклонённые
─────────────
🏭 Поставщики
─────────────
📋 Лиды / CRM
   ├── Все лиды
   └── Мои лиды
─────────────
📱 Соцсети
   ├── Очередь контента
   └── Опубликованные
─────────────
🤖 Краулер
─────────────
⚙️ Настройки
```

---

### ADMIN PAGE 01: Dashboard `/admin/dashboard`

**File:** `/src/app/(admin)/dashboard/page.tsx`

**Layout:** 3-column grid of stat cards, then charts, then activity feed

**Stat Cards Row 1:**
- Total Published Fabrics
- New Fabrics Today (raw_scraped)
- Pending AI Processing
- Pending Admin Review

**Stat Cards Row 2:**
- Total Leads
- New Leads Today
- Open Leads (active pipeline)
- Closed Won (this month)

**Stat Cards Row 3:**
- Social Posts Published This Week
- Instagram Followers (last sync)
- Crawler Last Run (timestamp + status)
- AI Processing Queue Size

**Charts Row:**
- Left: Line chart – Fabrics published per day (last 30 days) [Recharts]
- Right: Bar chart – Leads by source (last 30 days) [Recharts]

**Activity Feed (bottom):**
- Recent system events (chronological, last 20):
  - "Fabric #1234 approved by admin@tkanmarket.com"
  - "New lead from Иван Иванов (ivan@company.ru)"
  - "Crawler completed: 234 new products"
  - "AI processing: 89 fabrics enriched"
- Each event: icon, message, timestamp (relative: "5 мин назад")

---

### ADMIN PAGE 02: Fabric List `/admin/fabrics`

**File:** `/src/app/(admin)/fabrics/page.tsx`

**Tab Filter Bar:**
- All | Pending Review | AI Processing | Approved | Rejected

**Table Columns:**
| # | Image | Title | Supplier | Status | GSM | MOQ | Created | Actions |
|---|-------|-------|---------|--------|-----|-----|---------|---------|

- Image: 48×48px thumbnail
- Title: truncated, click → detail page
- Status: colored badge (raw_scraped=gray, ai_processed=blue, approved=green, rejected=red)
- Actions: Quick Approve ✓ | Reject ✗ | Edit ✏️ | View 👁️

**Bulk Actions Bar** (appears when rows selected):
- Select All checkbox in header
- "Одобрить выбранные" | "Отклонить выбранные"

**Filters above table:**
- Search by title
- Filter by status
- Filter by supplier
- Date range picker

**Pagination:** standard, 50 per page

---

### ADMIN PAGE 03: Fabric Detail/Edit `/admin/fabrics/[id]`

**File:** `/src/app/(admin)/fabrics/[id]/page.tsx`

**Layout:** 2-column
- Left (40%): Image gallery (view only) + raw data from supplier
- Right (60%): Editable form

**Editable Form Fields:**
- Title RU (textarea)
- Title EN (textarea)
- Description RU (rich text / textarea)
- Fabric Type (select from enum)
- Composition (dynamic rows: material + %)
- GSM (number input)
- Width (number input, cm)
- MOQ (number input)
- Price (number input)
- Tags (multi-select / tag input)
- Is Featured (toggle)

**Actions Bar (top-right):**
- Approve (green button) → status = approved
- Reject (red button, opens rejection reason modal)
- Save Draft
- View on marketplace (link, if approved)

**Side panel: AI Processing Log**
- Shows what AI extracted, confidence score
- Fields where confidence < 0.7 highlighted in yellow warning

---

### ADMIN PAGE 04: Lead List `/admin/leads`

**File:** `/src/app/(admin)/leads/page.tsx`

**Kanban View (default):**
```
┌──────────┬─────────────┬───────────┬──────────────┬─────────────┐
│ NEW      │ CONTACTED   │ QUALIFIED │ PROPOSAL     │ CLOSED      │
│ (12)     │ (8)         │ (5)       │ (3)          │ (45)        │
├──────────┼─────────────┼───────────┼──────────────┼─────────────┤
│ LeadCard │ LeadCard    │ LeadCard  │ LeadCard     │ (collapsed) │
│ LeadCard │ LeadCard    │           │              │             │
└──────────┴─────────────┴───────────┴──────────────┴─────────────┘
```

**LeadCard:**
- Company name (bold)
- Contact name
- Lead source badge
- Date created (relative)
- Assigned avatar
- Fabric of interest (truncated)

**Table View (toggle):**
Standard table with all lead fields + sorting.

**Filters:**
- By status, by assigned, by source, by date range, by country

---

### ADMIN PAGE 05: Lead Detail `/admin/leads/[id]`

**File:** `/src/app/(admin)/leads/[id]/page.tsx`

**Layout:** 2-column

**Left (lead details):**
- Contact information card
- Fabric of interest (link to fabric)
- Source + UTM params
- Status badge + change status dropdown
- Assign to dropdown (list of sales reps)

**Right (activity log + notes):**
- Timeline of all activities (status changes, notes, emails)
- Add note textarea + submit button
- Each note: author avatar, timestamp, text

---

### ADMIN PAGE 06: Social Media Queue `/admin/social`

**File:** `/src/app/(admin)/social/page.tsx`

**Layout:** Tabs per platform

**Tabs:** Instagram | TikTok | Pinterest | Facebook | All

**Content Queue Table:**
| # | Fabric | Content Type | Script Preview | Status | Scheduled At | Actions |
|---|--------|-------------|----------------|--------|-------------|---------|

**Status values:**
- DRAFT (AI generated, not reviewed)
- APPROVED (ready to publish)
- SCHEDULED (queued for publish time)
- PUBLISHED
- FAILED

**Actions per row:**
- Preview content (opens preview modal)
- Approve / Reject
- Edit caption
- Reschedule (date/time picker)

**Analytics Tab:**
- Per-post performance: reach, likes, shares, link clicks
- Trend chart: engagement over time

---

### ADMIN PAGE 07: Crawler Control `/admin/crawler`

**File:** `/src/app/(admin)/crawler/page.tsx`

**Layout:** 3 sections

**Section 1: Manual Trigger**
- Keyword input (textarea, one keyword per line)
- Source select (Alibaba / 1688 / Both)
- Max products per run (number input)
- "Запустить краулер" button
- Current run status / progress bar

**Section 2: Schedule Config**
- Display and edit cron times for each crawl step
- Toggle automatic crawling on/off

**Section 3: Run History**
| Date | Source | Keywords | Found | Errors | Duration | Status |
|------|--------|---------|-------|--------|----------|--------|

---

---

## 4. Shared Components Library

### 4.1 Header (`/src/components/common/Header.tsx`)
- Logo (SVG, links to /)
- Nav links: Каталог | Поставщики | Блог | О нас
- Search icon (opens search overlay)
- WhatsApp icon button (floating contact)
- Mobile: hamburger menu → full-screen nav drawer

### 4.2 Breadcrumb (`/src/components/common/Breadcrumb.tsx`)
- Accepts `items: { label: string; href?: string }[]`
- Separator: "/" (neutral-400)
- Last item: no link, neutral-900

### 4.3 StatusBadge (`/src/components/common/StatusBadge.tsx`)
- Accepts `status: FabricStatus | LeadStatus`
- Returns colored pill badge
- Color mapping from constants

### 4.4 LoadingSkeleton (multiple variants)
- `FabricCardSkeleton`
- `TableRowSkeleton`
- `StatCardSkeleton`
- All use Tailwind `animate-pulse`

### 4.5 EmptyState (`/src/components/common/EmptyState.tsx`)
- Accepts: `icon`, `title`, `description`, `action?: { label, onClick }`
- Centered layout, neutral colors

### 4.6 ConfirmDialog (`/src/components/common/ConfirmDialog.tsx`)
- Built on Shadcn AlertDialog
- Accepts: `title`, `description`, `onConfirm`, `isLoading`

### 4.7 DataTable (`/src/components/admin/DataTable.tsx`)
- Generic typed table component
- Built on TanStack Table v8
- Accepts: `columns`, `data`, `pagination`, `onSortChange`
- Built-in column sorting, row selection

### 4.8 StatsCard (`/src/components/admin/StatsCard.tsx`)
- Accepts: `title`, `value`, `change` (%), `icon`, `color`
- Shows trend arrow (up/down) with green/red color

---

## 5. State Management Architecture

### Public Marketplace
- **Server state:** TanStack Query
  - `useFabrics(filters)` – catalog list
  - `useFabric(slug)` – single fabric detail
  - `useSupplier(slug)` – supplier detail
- **UI state:** useState / useReducer (filter panel open/closed, modal open/closed)
- **URL state:** search params are the source of truth for filters

### Admin Dashboard
- **Server state:** TanStack Query
  - `useAdminFabrics(status, page)` – fabric queue
  - `useAdminLeads(filters)` – leads list
  - `useSocialQueue(platform)` – social content queue
- **Mutations:** useMutation for approve, reject, update lead, etc.
- **Optimistic updates:** Lead status changes are optimistic
- **Global state:** Zustand for:
  - Current user session info
  - Sidebar collapsed/expanded
  - Global notification/toast queue

---

## 6. Routing Architecture

### Public Routes
```
/                              → Homepage
/fabrics                       → Catalog (with query params for filters)
/fabrics?material=cotton&page=2→ Filtered catalog
/fabrics/[slug]                → Fabric detail
/suppliers                     → Suppliers list
/suppliers/[slug]              → Supplier profile
/contact                       → Contact page
/sitemap.xml                   → Auto-generated sitemap
/robots.txt                    → SEO robots
```

### Admin Routes (all require auth)
```
/admin                         → Redirect to /admin/dashboard
/admin/dashboard               → Overview
/admin/fabrics                 → Fabric management
/admin/fabrics/[id]            → Fabric detail/edit
/admin/leads                   → Lead CRM
/admin/leads/[id]              → Lead detail
/admin/suppliers               → Supplier management
/admin/suppliers/[id]          → Supplier detail/edit
/admin/social                  → Social media queue
/admin/crawler                 → Crawler control
/admin/settings                → System settings
```

### API Routes
```
/api/auth/[...nextauth]        → NextAuth.js handlers
/api/v1/fabrics                → Public fabric API
/api/v1/fabrics/[id]           → Single fabric
/api/v1/fabrics/[id]/related   → Related fabrics
/api/v1/suppliers              → Suppliers
/api/v1/suppliers/[id]         → Single supplier
/api/v1/leads                  → Create lead (POST)
/api/v1/admin/fabrics          → Admin fabric CRUD
/api/v1/admin/fabrics/[id]/status → Approve/reject
/api/v1/admin/leads            → Admin leads list
/api/v1/admin/leads/[id]       → Update lead
/api/v1/admin/crawler/run      → Trigger crawl
/api/v1/admin/social/queue     → Social queue
/api/v1/admin/social/[id]/approve → Approve post
```

---

## SEO Checklist (Frontend)

For every public page:
- [ ] `<title>` tag with target keyword (max 60 chars)
- [ ] `<meta name="description">` (max 155 chars)
- [ ] OpenGraph: `og:title`, `og:description`, `og:image`, `og:url`
- [ ] Twitter Card: `twitter:card`, `twitter:title`, `twitter:image`
- [ ] Canonical URL
- [ ] JSON-LD structured data (Product schema for fabric pages, Organization for homepage)
- [ ] Proper H1→H2→H3 hierarchy (only one H1 per page)
- [ ] All images have descriptive `alt` text in Russian
- [ ] Next.js `<Image>` for all images (auto WebP conversion)
- [ ] Sitemap auto-generated via next-sitemap
