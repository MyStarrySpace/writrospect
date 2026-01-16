# Writrospect

An AI-assisted reflective journaling application with a calming neomorphic design.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Database**: PostgreSQL via Prisma ORM (Neon serverless)
- **Auth**: Stack Auth (`@stackframe/stack`)
- **AI**: Anthropic Claude API (`@anthropic-ai/sdk`)
- **Styling**: Tailwind CSS 4 with custom neomorphic design system
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Authenticated routes (journal, dashboard, settings, etc.)
│   ├── api/              # API routes
│   ├── handler/[...stack]/ # Stack Auth handlers
│   ├── showcase/         # Design system showcase page
│   ├── page.tsx          # Landing page
│   └── layout.tsx        # Root layout with fonts and providers
├── components/
│   └── ui/               # Reusable UI components (Button, Card, Input, etc.)
├── lib/
│   ├── ai-tools/         # Claude AI tool definitions
│   ├── prompts/          # AI system prompts
│   ├── claude.ts         # Claude API client
│   ├── router.ts         # AI conversation router
│   ├── prisma.ts         # Prisma client singleton
│   └── theme-presets.ts  # Theme color presets
└── stack.ts              # Stack Auth configuration
```

## Design System

Neomorphic design with warm mauve/lavender color palette. All colors are CSS variables defined in `globals.css`.

### Color Variables
- `--background`: Base background (#e8dde8)
- `--foreground`: Primary text (#5c4a5c)
- `--shadow-light` / `--shadow-dark`: Neomorphic shadow colors
- `--accent`, `--accent-soft`, `--accent-primary`, `--accent-border`: Accent variations

### Shadow Variables
- `--neu-shadow`: Default raised shadow
- `--neu-shadow-sm`, `--neu-shadow-lg`: Size variants
- `--neu-shadow-inset`, `--neu-shadow-inset-sm`: Pressed/inset states
- `--neu-shadow-subtle`: Subtle raised effect

### UI Components
Always use the components from `@/components/ui/`:
- `Button` - Primary, secondary, ghost, danger variants with loading states
- `Card` - With `hover`, `pressed`, and `accent` props
- `Input`, `Textarea`, `Select` - Form elements with labels and error states
- `Modal`, `Tooltip`, `Badge`, `Spinner` - Additional UI elements

### Animation Patterns
- Use Framer Motion's `whileHover` and `whileTap` for interactive elements
- Spring physics: `{ type: "spring", stiffness: 300, damping: 30 }`
- Shadow transitions via JS `onMouseEnter`/`onMouseLeave` for neomorphic effects

## Database Schema

Key models in `prisma/schema.prisma`:
- `User` - Linked to Stack Auth via `stackUserId`
- `JournalEntry` - Journal entries with AI responses
- `Commitment` - Long-term goals with SMART components
- `Task` - Specific actionable items with urgency levels
- `Goal` - High-level aspirations
- `Strategy` - Approaches and their effectiveness
- `Person` - Relationship tracking
- `ChatMessage` - AI conversation history

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production (runs prisma generate)
npx prisma studio    # Open Prisma database GUI
npx prisma migrate dev --name <name>  # Create migration
npx prisma generate  # Regenerate Prisma client
```

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Claude API key
- `STACK_SECRET_SERVER_KEY` / `NEXT_PUBLIC_STACK_PROJECT_ID` - Stack Auth keys

## Key Patterns

### API Routes
- All API routes are in `src/app/api/`
- Use `stackServerApp.getUser()` for authentication
- Return `NextResponse.json()` with appropriate status codes

### AI Integration
- Chat routes use `src/lib/claude.ts` for Claude API calls
- Tools are defined in `src/lib/ai-tools/`
- System prompts are in `src/lib/prompts/`

### Fonts
- Headings: Comfortaa (via `font-heading` class)
- Body: Nunito (default body font)
