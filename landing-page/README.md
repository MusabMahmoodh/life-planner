# AchievaAI Landing Page

The marketing landing page for AchievaAI - Your Intelligent AI Coaching Companion.

## About

AchievaAI is the first AI companion that doesn't just track your goals—it understands you. When your plans fall apart, we help you re-route, just like a real human coach.

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- npm, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the landing page directory
cd landing-page

# Install dependencies
npm install
# or
pnpm install
# or
bun install
```

### Development

```bash
# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Build

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── Navigation.tsx      # Header navigation
│   ├── HeroSection.tsx     # Hero with chat mockup
│   ├── InteractiveChat.tsx # Live AI demo
│   └── ...                 # Other section components
├── pages/
│   ├── Index.tsx           # Main landing page
│   └── NotFound.tsx        # 404 page
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities
├── App.tsx                 # App entry with routing
├── main.tsx                # React DOM entry
└── index.css               # Global styles & Tailwind
```

## Page Sections

1. **Navigation** - Fixed header with mobile menu
2. **Hero** - Animated chat mockup with CTA
3. **Stats** - Featured press logos
4. **Problem** - "Why Most Plans Fail" section
5. **Solution** - Feature showcase with interactive demo
6. **Personas** - Target audience cards
7. **Pricing** - Starter, Premium, and Student tiers
8. **Testimonials** - User reviews
9. **Trust Stats** - Key metrics
10. **CTA** - Final conversion section
11. **Footer** - Links and social

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## License

Proprietary - All rights reserved.
