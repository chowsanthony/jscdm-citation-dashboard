export interface Publication {
  doi: string;
  title: string;
  section: string;
  max_citations: number;
  crossref: number;
  semantic_scholar: number;
  opencitations: number;
}

export interface SectionStat {
  name: string;
  count: number;
  citations: number;
  avgCitations: number;
}
