# Accountabili-bot Project

## Overview

A personal accountability and goal-tracking application built with evidence-based behavioral science principles.

## Tech Stack

- **Next.js** (App Router)
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Prisma** with Neon PostgreSQL
- **Stack Auth** for authentication

## Research & Citation Standards

### Bibliography Location

All scientific sources supporting our methodology live in `src/data/bibliography/`:
- `goal-setting.ts` — Goal Setting Theory, Implementation Intentions
- `habit-formation.ts` — Habit formation research, Self-Determination Theory
- `accountability.ts` — Accountability, commitment, social support
- `behavior-change.ts` — Mental contrasting, self-monitoring, feedback

### Adding New Sources

When adding a new source:
1. **ALWAYS use WebFetch or WebSearch** to verify citation details before adding
2. Choose the appropriate module file based on topic
3. Follow the `Source` interface structure from `types.ts`
4. Include at least one `Citation` with an exact quote
5. Verify quotes by fetching the actual source URL when possible
6. Run `npm run verify-bib` to check sources against PubMed/CrossRef APIs

### Required Source Fields

Every source MUST have:
- **Exact title** as it appears on the publication
- **Authors** in abbreviated format: `"Locke EA, Latham GP"`
- **Journal** full name
- **Year** of publication
- **DOI** when available
- **PMID** when indexed in PubMed
- **projectRef** in citations linking to app features

### Research Requirements

- **ALWAYS use web search** to verify factual claims about behavioral science
- When adding features, reference supporting research in the bibliography
- Prefer meta-analyses and systematic reviews for stronger evidence
- Note effect sizes, not just statistical significance

## Key Scientific Principles

Our app is built on these evidence-based foundations:

### 1. Goal Setting Theory (Locke & Latham)
- Specific, difficult goals outperform "do your best" (d = .42-.80)
- Goals should be challenging but achievable

### 2. Implementation Intentions (Gollwitzer)
- If-then planning dramatically improves follow-through (d = .61-.77)
- Context matters: when, where, how

### 3. Habit Formation (Lally et al.)
- Average 66 days to automaticity (range: 18-254 days)
- Missing one day doesn't reset progress
- Complexity affects formation time

### 4. Self-Determination Theory (Ryan & Deci)
- Support autonomy, competence, and relatedness
- Avoid controlling, punitive features
- Choice enhances intrinsic motivation

### 5. Self-Monitoring (Multiple meta-analyses)
- Progress tracking improves goal attainment
- Digital self-monitoring is effective
- Feedback frequency matters

### 6. Accountability (Oussedik et al.)
- Accountability partners help commitment-keeping
- Public commitment can backfire (reduces commitment-making)
- Offer private by default with optional sharing

## Planning

### Plan Storage

Implementation plans go in `.claude/plans/` with format `[topic]-[date].md`

### When to Create Plans

- Multi-file changes
- New feature additions
- Research-intensive updates
