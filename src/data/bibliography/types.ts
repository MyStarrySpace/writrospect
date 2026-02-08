export type TopicTag =
  | "goal-setting"
  | "habit-formation"
  | "motivation"
  | "self-regulation"
  | "accountability"
  | "commitment"
  | "progress-tracking"
  | "feedback"
  | "behavior-change"
  | "implementation-intentions"
  | "self-efficacy"
  | "intrinsic-motivation"
  | "extrinsic-motivation"
  | "procrastination"
  | "willpower"
  | "ego-depletion"
  | "mental-contrasting"
  | "cognitive-behavioral"
  | "positive-psychology"
  | "flow"
  | "mindfulness"
  | "journaling"
  | "reflection"
  | "social-support"
  | "public-commitment"
  | "streaks"
  | "gamification"
  | "meta-analysis";

export type VerificationStatus = "verified" | "unverified" | "unverifiable";

export interface Citation {
  /** Unique citation ID, e.g. "locke-1990-motivation-c1" */
  citationId: string;
  /** Parent source ID */
  sourceId: string;
  /** Exact quote from the paper (Ctrl+F verifiable) */
  quote: string;
  /** Editorial note or context for how the quote is used */
  context?: string;
  /** Location in source: page, section, figure, table */
  location?: string;
  /** What feature/concept in this project uses or references this quote */
  projectRef?: string;
}

export interface Source {
  /** Unique source ID, e.g. "locke-1990-motivation" */
  id: string;
  /** Full paper title */
  title: string;
  /** Authors in abbreviated format: "Locke EA, Latham GP" */
  authors: string;
  /** Journal name (full, not abbreviated) */
  journal: string;
  /** Publication year */
  year: number;
  /** DOI without https://doi.org/ prefix */
  doi?: string;
  /** PubMed ID (numeric string) */
  pmid?: string;
  /** Direct URL to the paper (PubMed, PMC, or publisher) */
  url?: string;
  /** Topic tags for cross-module discoverability */
  tags: TopicTag[];
  /** Citations (exact quotes) used in this project */
  citations: Citation[];
  /** Whether title/authors/year have been verified against PubMed or CrossRef */
  verificationStatus: VerificationStatus;
}
