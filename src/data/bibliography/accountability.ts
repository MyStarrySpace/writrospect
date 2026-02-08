import type { Source } from "./types";

export const accountabilitySources: Source[] = [
  {
    id: "oussedik-2017-accountability",
    title: "Accountability: a missing construct in models of adherence behavior and in clinical practice",
    authors: "Oussedik E, Foy CG, Masicampo EJ, Kammrath LK, Anderson RE, Feldman SR",
    journal: "Patient Preference and Adherence",
    year: 2017,
    doi: "10.2147/PPA.S135895",
    pmid: "28794618",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5536091/",
    tags: ["accountability", "behavior-change", "social-support"],
    verificationStatus: "verified",
    citations: [
      {
        citationId: "oussedik-2017-c1",
        sourceId: "oussedik-2017-accountability",
        quote: "Accountability partners help people keep a commitment, without the requirement of physical contact",
        context: "Digital accountability can be effective",
        projectRef: "Commitments: Why sharing commitments with accountability partners works",
      },
      {
        citationId: "oussedik-2017-c2",
        sourceId: "oussedik-2017-accountability",
        quote: "accountability-based adherence interventions could be implemented at low cost",
        context: "Scalability of accountability interventions",
        projectRef: "App design: Rationale for digital accountability features",
      },
    ],
  },
  {
    id: "lokhorst-2013-commitment-meta",
    title: "Commitment and Behavior Change: A Meta-Analysis and Critical Review of Commitment-Making Strategies in Environmental Research",
    authors: "Lokhorst AM, Werner C, Staats H, van Dijk E, Gale JL",
    journal: "Environment and Behavior",
    year: 2013,
    doi: "10.1177/0013916511411477",
    url: "https://journals.sagepub.com/doi/abs/10.1177/0013916511411477",
    tags: ["commitment", "behavior-change", "meta-analysis", "public-commitment"],
    verificationStatus: "verified",
    citations: [
      {
        citationId: "lokhorst-2013-c1",
        sourceId: "lokhorst-2013-commitment-meta",
        quote: "commitment strategies, both alone and in combination with other interventions, are generally effective in modifying environmental behaviors",
        context: "Meta-analysis of 19 studies on commitment strategies",
        projectRef: "Commitments: Evidence for commitment-making effectiveness",
      },
    ],
  },
  {
    id: "munson-2015-public-commitment",
    title: "Effects of Public Commitments and Accountability in a Technology-Supported Physical Activity Intervention",
    authors: "Munson SA, Krupka E, Richardson C, Resnick P",
    journal: "Proceedings of the 33rd Annual ACM Conference on Human Factors in Computing Systems",
    year: 2015,
    doi: "10.1145/2702123.2702524",
    url: "https://dl.acm.org/doi/10.1145/2702123.2702524",
    tags: ["public-commitment", "accountability", "behavior-change"],
    verificationStatus: "verified",
    citations: [
      {
        citationId: "munson-2015-c1",
        sourceId: "munson-2015-public-commitment",
        quote: "the prospect of public accountability may suppress the making of commitments in a way that counteracts the benefits of that accountability",
        context: "Public commitments can backfire by reducing commitment-making",
        projectRef: "Commitments: Why we offer private by default with optional sharing",
      },
      {
        citationId: "munson-2015-c2",
        sourceId: "munson-2015-public-commitment",
        quote: "People in both public announcements conditions were less likely to make commitments",
        context: "Public announcement reduced commitment rates",
        projectRef: "Commitments: Evidence for thoughtful accountability design",
      },
    ],
  },
];
