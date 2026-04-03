# Balloon Design Pricing App - Development Plan

## Design Guidelines

### Design References
- **Style**: Golden Honey - Warm, elegant, professional balloon business aesthetic
- **Mobile-first**: Optimized for mobile usage with touch-friendly controls

### Color Palette
- Primary: #D4A017 (Golden Honey)
- Primary Light: #F5E6B8 (Light Gold)
- Primary Dark: #8B6914 (Dark Gold)
- Background: #FFFDF7 (Warm White)
- Card Background: #FFFFFF
- Text Primary: #2D2006 (Dark Brown)
- Text Secondary: #7A6B4E (Medium Brown)
- Accent: #E8C547 (Bright Gold)
- Success: #4CAF50
- Destructive: #E53935

### Typography
- Headings: Inter font-weight 700
- Body: Inter font-weight 400
- Numbers/Prices: Inter font-weight 600

### Key Component Styles
- Cards: White background, subtle gold border, 12px rounded, soft shadow
- Buttons: Golden gradient background, white text, 8px rounded
- Inputs: Light gold border, warm white background, focus: golden ring
- Navigation: Bottom tab bar for mobile, golden accent on active tab

---

## Development Tasks

### Files to Create (7 files):
1. **src/index.css** - Update with Golden Honey theme CSS variables
2. **src/lib/auth.ts** - Auth hook for user session management
3. **src/components/Header.tsx** - App header with avatar icon and login/logout
4. **src/components/BottomNav.tsx** - Bottom navigation bar (Calculator, Settings, History)
5. **src/pages/Index.tsx** - Main calculator page with balloon pricing form
6. **src/pages/Settings.tsx** - Settings page for labor rate, overhead, markup, balloon sizes
7. **src/pages/History.tsx** - Saved designs history list
8. **src/App.tsx** - Update routes for Settings and History pages

### Features:
1. **Auth**: Login/logout via avatar icon, session persistence
2. **Calculator**: Add balloons by size, set labor hours, hardware cost; auto-calculate MSRP with overhead/markup; add perceived value; save design
3. **Settings**: Manage default hourly rate, overhead %, markup %; CRUD balloon sizes with custom names and prices
4. **History**: View saved designs with date, name, final price; tap to view details; delete designs