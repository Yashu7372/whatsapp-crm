import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export type ClaimStatus = 'VERIFIED' | 'DESIGN_INTENT' | 'UNKNOWN' | 'UNSUPPORTED';

export type SectionPattern = {
  id: string;
  type: string;
  required: boolean;
  minWords?: number;
  sourceGrounded?: boolean;
  policy?: Record<string, unknown>;
};

export type ArticlePattern = {
  id: string;
  sections: SectionPattern[];
  quality: {
    minArticleWords: number;
    maxArticleWords: number;
    unsupportedClaimsAllowed: number;
    requireIncidentSourceLabel?: boolean;
    requireImplementationEvidence?: boolean;
    requireVerificationSection?: boolean;
    requireTaskBeforeAndAfter?: boolean;
  };
};

export type SeriesConfig = {
  id: string;
  title: string;
  totalArticles: number;
  articlePattern: string;
  tone?: Record<string, unknown>;
  publishing?: Record<string, unknown>;
  visuals?: Record<string, unknown>;
};

export type EvidenceRef = {
  kind: 'code' | 'test' | 'commit' | 'doc' | 'runtime' | 'config' | 'external';
  ref: string;
  note?: string;
};

export type ArticleClaim = {
  text: string;
  status: ClaimStatus;
  evidence: EvidenceRef[];
};

export type ArticleSection = {
  id: string;
  title: string;
  content: string;
  data?: Record<string, unknown>;
};

export type ArticleModel = {
  id: string;
  number: number;
  seriesId: string;
  title: string;
  subtitle?: string;
  sourceLabel?: 'real' | 'generalized' | 'hypothetical';
  sections: ArticleSection[];
  claims: ArticleClaim[];
  metadata?: Record<string, unknown>;
};

export type ValidationFlag = {
  id: string;
  passed: boolean;
  detail?: string;
};

export type ArticleValidation = {
  articleId: string;
  done: boolean;
  flags: ValidationFlag[];
};

export interface SectionGenerator {
  generate(input: {
    article: ArticleModel;
    section: SectionPattern;
    series: SeriesConfig;
    context: Record<string, unknown>;
  }): Promise<ArticleSection>;
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function getSection(model: ArticleModel, id: string): ArticleSection | undefined {
  return model.sections.find((section) => section.id === id);
}

export function validateArticle(
  article: ArticleModel,
  pattern: ArticlePattern,
  series: SeriesConfig,
): ArticleValidation {
  const flags: ValidationFlag[] = [];
  const add = (id: string, passed: boolean, detail?: string) => flags.push({ id, passed, detail });

  add('series_number_valid', article.number > 0 && article.number <= series.totalArticles,
    `article=${article.number}, seriesTotal=${series.totalArticles}`);

  for (const section of pattern.sections) {
    const actual = getSection(article, section.id);
    const exists = Boolean(actual?.content.trim());
    add(`section:${section.id}:present`, !section.required || exists,
      exists ? undefined : 'required section is missing or empty');
    if (actual && section.minWords) {
      const words = wordCount(actual.content);
      add(`section:${section.id}:min_words`, words >= section.minWords,
        `words=${words}, required=${section.minWords}`);
    }
  }

  const unsupported = article.claims.filter((claim) => claim.status === 'UNSUPPORTED');
  add('claims:no_unsupported', unsupported.length <= pattern.quality.unsupportedClaimsAllowed,
    `unsupported=${unsupported.length}`);

  const verifiedWithoutEvidence = article.claims.filter(
    (claim) => claim.status === 'VERIFIED' && claim.evidence.length === 0,
  );
  add('claims:verified_have_evidence', verifiedWithoutEvidence.length === 0,
    `verifiedWithoutEvidence=${verifiedWithoutEvidence.length}`);

  if (pattern.quality.requireIncidentSourceLabel) {
    add('incident:source_label', Boolean(article.sourceLabel),
      article.sourceLabel ? `sourceLabel=${article.sourceLabel}` : 'source label is required');
  }

  if (pattern.quality.requireImplementationEvidence) {
    const implementationClaims = article.claims.filter((claim) =>
      claim.evidence.some((evidence) => ['code', 'test', 'commit', 'config', 'runtime'].includes(evidence.kind)),
    );
    add('implementation:evidence_present', implementationClaims.length > 0,
      `groundedClaims=${implementationClaims.length}`);
  }

  if (pattern.quality.requireVerificationSection) {
    add('verification:present', Boolean(getSection(article, 'verification')));
  }

  if (pattern.quality.requireTaskBeforeAndAfter) {
    add('task:snapshots_present', Boolean(getSection(article, 'snapshot_before')) && Boolean(getSection(article, 'snapshot_after')));
  }

  const canonical = renderMarkdown(article, series);
  const totalWords = wordCount(canonical);
  add('article:min_words', totalWords >= pattern.quality.minArticleWords,
    `words=${totalWords}, min=${pattern.quality.minArticleWords}`);
  add('article:max_words', totalWords <= pattern.quality.maxArticleWords,
    `words=${totalWords}, max=${pattern.quality.maxArticleWords}`);

  return {
    articleId: article.id,
    done: flags.every((flag) => flag.passed),
    flags,
  };
}

export function renderMarkdown(article: ArticleModel, series: SeriesConfig): string {
  const heading = `# ${article.title}`;
  const subtitle = article.subtitle ? `\n\n*${article.subtitle}*` : '';
  const seriesLine = `\n\n**${series.title} · Article ${article.number} / ${series.totalArticles}**`;
  const body = article.sections
    .filter((section) => section.id !== 'hero')
    .map((section) => `\n\n## ${section.title}\n\n${section.content.trim()}`)
    .join('');
  return `${heading}${subtitle}${seriesLine}${body}\n`;
}

export async function generateMissingSections(
  article: ArticleModel,
  pattern: ArticlePattern,
  series: SeriesConfig,
  generator: SectionGenerator,
  context: Record<string, unknown>,
): Promise<ArticleModel> {
  const existing = new Map(article.sections.map((section) => [section.id, section]));
  const sections: ArticleSection[] = [];

  for (const sectionPattern of pattern.sections) {
    const current = existing.get(sectionPattern.id);
    if (current?.content.trim()) {
      sections.push(current);
      continue;
    }
    if (!sectionPattern.required) continue;
    sections.push(await generator.generate({ article, section: sectionPattern, series, context }));
  }

  return { ...article, sections };
}

export async function loadJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(resolve(path), 'utf8')) as T;
}

export async function saveArticleArtifacts(input: {
  article: ArticleModel;
  pattern: ArticlePattern;
  series: SeriesConfig;
  outputDir: string;
}): Promise<ArticleValidation> {
  const validation = validateArticle(input.article, input.pattern, input.series);
  const outputDir = resolve(input.outputDir);
  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outputDir, 'article-model.json'), JSON.stringify(input.article, null, 2) + '\n', 'utf8'),
    writeFile(resolve(outputDir, 'article.md'), renderMarkdown(input.article, input.series), 'utf8'),
    writeFile(resolve(outputDir, 'validation.json'), JSON.stringify(validation, null, 2) + '\n', 'utf8'),
  ]);
  return validation;
}

export async function ensureParent(path: string): Promise<void> {
  await mkdir(dirname(resolve(path)), { recursive: true });
}
