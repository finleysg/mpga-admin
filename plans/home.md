# MPGA Public Site - Home Page Implementation Plan

## Overview

Build the home page for Minnesota Public Golf Association's public site with a classic/traditional golf club aesthetic.

---

## Design System

### Color Palette

**Primary**: `#00a261` - MPGA Green
**Secondary**: `##07485B`
**Accent**: `#DBA507`

| Token         | Hex       | Usage                       |
| ------------- | --------- | --------------------------- |
| `primary-50`  | `#e6f7ef` | Light backgrounds           |
| `primary-100` | `#b3e6d1` | Hover states (light)        |
| `primary-500` | `#00a261` | Primary buttons, links      |
| `primary-600` | `#008c54` | Button hover                |
| `primary-700` | `#007a48` | Dark accents                |
| `primary-900` | `#004d2d` | Header backgrounds          |
| `accent-500`  | `#d4a853` | Accent (awards, highlights) |
| `neutral-50`  | `#fafafa` | Page background             |
| `neutral-100` | `#f5f5f5` | Card backgrounds            |
| `neutral-700` | `#4a4a4a` | Secondary text              |
| `neutral-900` | `#1a1a1a` | Primary text                |

### Typography

- **Headings**: Playfair Display (Google Font) - serif, classic golf aesthetic
- **Body**: Inter (Google Font) - clean sans-serif for readability

---

## Home Page Structure

```
┌─────────────────────────────────────────────────────────┐
│        Home | Tournaments | Match Play | Members | News │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  HERO CAROUSEL                                          │
│  ┌────────────────────────────┬────────────────────┐    │
│  │                            │ Tournament Name    │    │
│  │    Tournament Image        │ June 15-17, 2025   │    │
│  │         (2/3)              │ Oak Ridge GC       │    │
│  │                            │ [Learn More]       │    │
│  └────────────────────────────┴────────────────────┘    │
│                    ● ○ ○ ○ ○                            │
├─────────────────────────────────────────────────────────┤
│  FEATURE CARDS (3 columns)                              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐              │
│  │           │ │           │ │           │              │
│  │Tournament │ │ Team      │ │ 100+      │              │
│  │Competition│ │ Match Play│ │ Member    │              │
│  │ 8 annual  │ │ Club vs   │ │ Clubs     │              │
│  │ events... │ │ club...   │ │ across MN │              │
│  └───────────┘ └───────────┘ └───────────┘              │
├─────────────────────────────────────────────────────────┤
│  ABOUT MPGA                                             │
│  [Organization description from database]               │
├─────────────────────────────────────────────────────────┤
│  LATEST NEWS                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ News Card 1 │ │ News Card 2 │ │ News Card 3 │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
│                              [View All News →]          │
├─────────────────────────────────────────────────────────┤
│         Links | Contact Us | About Us | Social          │
└─────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

### 1. Tailwind Config - Update Colors

**File**: `tooling/tailwind/base.css`

- Replace cyan primary palette with MPGA green palette
- Add gold accent color

### 2. Layout & Fonts

**File**: `apps/public/src/app/layout.tsx`

- Add Google Fonts: Playfair Display, Inter
- Configure font CSS variables

### 3. Global Styles

**File**: `apps/public/src/app/globals.css`

- Typography classes for headings/body

### 4. shadcn/ui Setup

**Package**: `packages/ui`

- Initialize shadcn/ui with `components.json` config
- Install required shadcn components:

| shadcn Component  | Purpose                       |
| ----------------- | ----------------------------- |
| `button`          | CTAs, links styled as buttons |
| `card`            | Feature cards, news cards     |
| `navigation-menu` | Header desktop navigation     |
| `carousel`        | Hero tournament carousel      |
| `sheet`           | Mobile slide-out menu         |

### 5. Custom UI Components

**Package**: `packages/ui/src/components/`

Built on top of shadcn primitives:

| Component    | File               | Built With                  |
| ------------ | ------------------ | --------------------------- |
| Header       | `Header.tsx`       | `navigation-menu` + `sheet` |
| Footer       | `Footer.tsx`       | Custom (no shadcn needed)   |
| HeroCarousel | `HeroCarousel.tsx` | `carousel` + custom slide   |
| HeroSlide    | `HeroSlide.tsx`    | Custom layout               |
| FeatureCard  | `FeatureCard.tsx`  | `card`                      |
| NewsCard     | `NewsCard.tsx`     | `card`                      |

### 6. Home Page

**File**: `apps/public/src/app/page.tsx`

- Server component fetching data
- Compose all sections

### 7. Data Fetching

**File**: `apps/public/src/lib/queries.ts`

- `getUpcomingTournaments()` - from `tournamentInstance` table
- `getAboutContent()` - from `content` table (contentType = 'H')
- `getFeatureCards()` - from `content` table (contentType IN ['T1', 'M1', 'C1'])
- `getLatestAnnouncements()` - from `announcement` table
- `isOffseason()` - check if current date is in season

### 8. Revalidation API

**File**: `apps/public/src/app/api/revalidate/route.ts`

- On-demand revalidation endpoint for ISR
- Accepts secret token + path parameter
- Called by admin site when content changes

---

## Data Strategy

**Approach**: On-demand Incremental Static Regeneration (ISR)

- Home page is statically generated at build time (fast for visitors)
- When admins update content in `admin.mpga.net`, it triggers revalidation
- Next visitor sees updated content within seconds

**Reference**: https://nextjs.org/docs/app/guides/incremental-static-regeneration#on-demand-revalidation-with-revalidatepath

**Revalidate API** (`/api/revalidate`):

```typescript
// apps/public/src/app/api/revalidate/route.ts
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const path = request.nextUrl.searchParams.get("path") || "/";

  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ message: "Invalid secret" }, { status: 401 });
  }

  revalidatePath(path);
  return Response.json({ revalidated: true, path });
}
```

**Environment Variable**:

- `REVALIDATE_SECRET` - shared secret between public and admin sites

**Admin Site Integration** (future):

- After saving content mutations, call: `POST https://mpga.net/api/revalidate?secret=xxx&path=/`

---

## Database Queries

> **Note**: Uses Drizzle ORM with camelCase table/column names matching the schema.

### Upcoming Tournaments (Hero Carousel)

```typescript
// Tables: tournamentInstance + tournament + golfCourse
// Display: tournament name, startDate, venue name
// Images: placeholder for now (future: file system)

db.select({
  id: tournamentInstance.id,
  name: tournamentInstance.name,
  startDate: tournamentInstance.startDate,
  tournamentName: tournament.name,
  venueName: golfCourse.name,
})
  .from(tournamentInstance)
  .innerJoin(tournament, eq(tournamentInstance.tournamentId, tournament.id))
  .leftJoin(golfCourse, eq(tournamentInstance.locationId, golfCourse.id))
  .where(gte(tournamentInstance.startDate, sql`CURDATE()`))
  .orderBy(asc(tournamentInstance.startDate))
  .limit(5);
```

### About Content

```typescript
// contentType = 'H' for home page about section
db.select({
  title: content.title,
  contentText: content.contentText,
})
  .from(content)
  .where(eq(content.contentType, "H"))
  .limit(1);
```

### Feature Cards

```typescript
// Three cards from content table
// T1 = Tournaments, M1 = Match Play, C1 = Clubs
db.select({
  title: content.title,
  contentText: content.contentText,
  contentType: content.contentType,
})
  .from(content)
  .where(inArray(content.contentType, ["T1", "M1", "C1"]));
```

**Feature Card Routing:**
| contentType | Route |
|-------------|-------|
| `T1` | `/tournaments` |
| `M1` | `/match-play` |
| `C1` | `/members` |

### Latest News

```typescript
// All announcements, latest 3
db.select().from(announcement).orderBy(desc(announcement.createDate)).limit(3);
```

---

## Component Details

### Header

- Sticky position
- White background with subtle shadow
- Logo links to home
- Desktop: Horizontal nav links
- Mobile (<768px): Hamburger icon → slide-out menu
- Active nav state with primary color underline

### Hero Carousel

- Full width, ~60vh height
- Manual navigation only (arrows + dots)
- Slide structure: 66% image | 33% content
- Content side: Green background (primary-900)
- Default logic:
  - If tournaments exist with `startDate` in future → show upcoming
  - Else (offseason) → show logo slide

### Feature Cards

- 3-column grid (responsive: stack on mobile)
- Each card: Icon (emoji or SVG), title, 2-3 line description
- Hover: subtle lift shadow
- Click → navigate to respective section

### About Section

- Max-width container, centered
- Heading: "About MPGA"
- Content from database, rendered as paragraphs
- Classic serif heading, sans-serif body

### News Section

- Heading: "Latest News"
- 3-column card grid
- Each card: Title, date, excerpt
- "View All News →" link to /news

### Footer

- Dark background (primary-900 or neutral-900)
- 4 columns: Navigation, About, Contact, Social
- Copyright line at bottom

---

## Implementation Order

1. **Tailwind colors** - Update `base.css` with MPGA green palette
2. **Fonts** - Add Google Fonts to layout
3. **shadcn/ui setup** - Initialize in `packages/ui`, create `components.json`
4. **shadcn components** - Install: button, card, navigation-menu, carousel, sheet
5. **Header component** - Using navigation-menu + sheet for mobile
6. **Footer component** - Custom component
7. **Layout integration** - Add Header/Footer to layout.tsx
8. **FeatureCard component** - Using card primitive
9. **HeroSlide component** - Custom layout component
10. **HeroCarousel component** - Using carousel primitive
11. **NewsCard component** - Using card primitive
12. **Data queries** - Create query functions
13. **Revalidation API** - Create `/api/revalidate` endpoint
14. **Home page** - Compose all sections with data

---

## Verification Plan

1. **Run dev server**: `pnpm dev`
2. **Visual check** at http://localhost:3000:
   - Header displays logo and nav links
   - Hero carousel shows tournament data (or logo if offseason)
   - Carousel arrows/dots work for manual navigation
   - Feature cards display with correct links
   - About section renders database content
   - News section shows 3 latest articles
   - Footer displays all links and social icons
3. **Mobile responsive**: Resize to <768px, verify hamburger menu
4. **Revalidation API**: Test with curl:
   ```bash
   curl -X POST "http://localhost:3000/api/revalidate?secret=test&path=/"
   ```
5. **TypeScript**: `pnpm typecheck` passes
6. **Lint**: `pnpm lint` passes

---

## Notes

- Current Tailwind config uses cyan (#0ea5e9) - needs replacement with MPGA green
- UI package (`packages/ui`) is empty - ready for shadcn/ui initialization
- **shadcn/ui** (https://ui.shadcn.com/) is the component foundation - installed in `packages/ui` for sharing
- Database tables use camelCase: `tournamentInstance`, `tournament`, `golfCourse`, `content`, `announcement`
- All components should be created in `packages/ui` for sharing with admin app
