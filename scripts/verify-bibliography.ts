/**
 * Bibliography Verification Script
 *
 * Checks each source against PubMed (NCBI E-utilities) and CrossRef APIs
 * to validate title, authors, journal, and year.
 *
 * Run: npx tsx scripts/verify-bibliography.ts
 */

import { sources } from "../src/data/bibliography";
import type { Source } from "../src/data/bibliography/types";

// ── Helpers ──────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function firstAuthorLastName(authors: string): string {
  // "Locke EA, Latham GP" → "locke"
  const first = authors.split(",")[0].trim();
  const cleaned = first.replace(/\.$/, "").trim();
  const parts = cleaned.split(/\s+/);
  // Filter out initials: tokens that are all uppercase and ≤3 chars
  const nonInitials = parts.filter((p) => {
    const stripped = p.replace(/[.\-]/g, "");
    if (stripped.length <= 3 && stripped === stripped.toUpperCase()) return false;
    return true;
  });
  if (nonInitials.length === 0) return parts[0]?.toLowerCase() ?? "";
  return nonInitials[0].toLowerCase();
}

// ── API Fetchers ────────────────────────────────────────────────────

interface ApiResult {
  title?: string;
  authors?: string;
  firstAuthorFamily?: string;
  journal?: string;
  year?: number;
  error?: string;
}

async function fetchPubMed(pmid: string): Promise<ApiResult> {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    const doc = data?.result?.[pmid];
    if (!doc) return { error: "No result for PMID" };
    const firstAuthor = doc.authors?.[0]?.name;
    const firstFamily = firstAuthor?.split(" ")[0]?.toLowerCase();
    return {
      title: doc.title,
      authors: doc.authors?.map((a: { name: string }) => a.name).join(", "),
      firstAuthorFamily: firstFamily,
      journal: doc.fulljournalname || doc.source,
      year: parseInt(doc.pubdate?.split(" ")[0], 10) || undefined,
    };
  } catch (e) {
    return { error: String(e) };
  }
}

async function fetchCrossRef(doi: string): Promise<ApiResult> {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Accountabili-bot/1.0 (bibliography-verification; mailto:noreply@example.com)",
      },
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    const msg = data?.message;
    if (!msg) return { error: "No message in CrossRef response" };
    const authors = msg.author
      ?.map((a: { family?: string; given?: string }) =>
        [a.given, a.family].filter(Boolean).join(" ")
      )
      .join(", ");
    const firstFamily = msg.author?.[0]?.family?.toLowerCase();
    const year =
      msg.published?.["date-parts"]?.[0]?.[0] ??
      msg["published-print"]?.["date-parts"]?.[0]?.[0] ??
      msg["published-online"]?.["date-parts"]?.[0]?.[0];
    return {
      title: Array.isArray(msg.title) ? msg.title[0] : msg.title,
      authors,
      firstAuthorFamily: firstFamily,
      journal: Array.isArray(msg["container-title"])
        ? msg["container-title"][0]
        : msg["container-title"],
      year: year ? Number(year) : undefined,
    };
  } catch (e) {
    return { error: String(e) };
  }
}

// ── Comparison ──────────────────────────────────────────────────────

interface ComparisonResult {
  field: string;
  ours: string;
  api: string;
  match: boolean;
}

function compare(
  source: Source,
  api: ApiResult
): ComparisonResult[] {
  const results: ComparisonResult[] = [];

  if (api.title) {
    const ours = normalize(source.title);
    const theirs = normalize(api.title);
    results.push({
      field: "title",
      ours: source.title,
      api: api.title,
      match: ours.includes(theirs) || theirs.includes(ours),
    });
  }

  if (api.firstAuthorFamily) {
    const ourFirst = firstAuthorLastName(source.authors);
    results.push({
      field: "first_author",
      ours: ourFirst,
      api: api.firstAuthorFamily,
      match: ourFirst === api.firstAuthorFamily,
    });
  }

  if (api.year != null) {
    results.push({
      field: "year",
      ours: String(source.year),
      api: String(api.year),
      match: source.year === api.year,
    });
  }

  if (api.journal) {
    const ours = normalize(source.journal);
    const theirs = normalize(api.journal);
    results.push({
      field: "journal",
      ours: source.journal,
      api: api.journal,
      match: ours.includes(theirs) || theirs.includes(ours),
    });
  }

  return results;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("Bibliography Verification");
  console.log("========================");
  console.log();

  // Step 1: Duplicate check
  const ids = sources.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) {
    console.error(`DUPLICATE IDs: ${dupes.join(", ")}`);
    process.exit(1);
  }

  // Step 2: Categorize
  const withPmid = sources.filter((s) => s.pmid);
  const doiOnly = sources.filter((s) => !s.pmid && s.doi);
  const unverifiable = sources.filter((s) => !s.pmid && !s.doi);

  console.log(`Total sources: ${sources.length}`);
  console.log(
    `With PMID: ${withPmid.length} | DOI only: ${doiOnly.length} | Unverifiable: ${unverifiable.length}`
  );
  console.log();

  let verified = 0;
  let mismatches = 0;
  let apiErrors = 0;
  const mismatchDetails: string[] = [];

  // Step 3: Verify PMID sources
  for (const source of withPmid) {
    await sleep(340); // PubMed rate limit: 3/sec
    const api = await fetchPubMed(source.pmid!);
    if (api.error) {
      apiErrors++;
      console.log(`  API ERROR: ${source.id} — ${api.error}`);
      continue;
    }
    const comparisons = compare(source, api);
    const hasMismatch = comparisons.some((c) => !c.match);
    if (hasMismatch) {
      mismatches++;
      const detail = [`MISMATCH: ${source.id} (PMID: ${source.pmid})`];
      for (const c of comparisons.filter((x) => !x.match)) {
        detail.push(`  ${c.field}:`);
        detail.push(`    Ours: ${c.ours}`);
        detail.push(`    API:  ${c.api}`);
      }
      mismatchDetails.push(detail.join("\n"));
    } else {
      verified++;
    }
  }

  // Step 4: Verify DOI-only sources
  for (const source of doiOnly) {
    await sleep(1000); // CrossRef polite rate: 1/sec
    const api = await fetchCrossRef(source.doi!);
    if (api.error) {
      apiErrors++;
      console.log(`  API ERROR: ${source.id} — ${api.error}`);
      continue;
    }
    const comparisons = compare(source, api);
    const hasMismatch = comparisons.some((c) => !c.match);
    if (hasMismatch) {
      mismatches++;
      const detail = [`MISMATCH: ${source.id} (DOI: ${source.doi})`];
      for (const c of comparisons.filter((x) => !x.match)) {
        detail.push(`  ${c.field}:`);
        detail.push(`    Ours: ${c.ours}`);
        detail.push(`    API:  ${c.api}`);
      }
      mismatchDetails.push(detail.join("\n"));
    } else {
      verified++;
    }
  }

  // Step 5: Print summary
  console.log("--- RESULTS ---");
  console.log(`Verified:     ${verified}`);
  console.log(`Mismatches:   ${mismatches}`);
  console.log(`API errors:   ${apiErrors}`);
  console.log(`Unverifiable: ${unverifiable.length}`);
  console.log();

  if (mismatchDetails.length > 0) {
    console.log("--- MISMATCHES ---");
    for (const d of mismatchDetails) {
      console.log(d);
      console.log();
    }
  }

  if (unverifiable.length > 0) {
    console.log("--- UNVERIFIABLE (no PMID or DOI) ---");
    for (const s of unverifiable) {
      console.log(`  ${s.id}: ${s.title}`);
    }
    console.log();
  }

  // Exit with error if mismatches
  if (mismatches > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
