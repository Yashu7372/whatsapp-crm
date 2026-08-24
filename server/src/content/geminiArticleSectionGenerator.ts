import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  ArticleSection,
  SectionGenerator,
} from './articleContentWorker.js';

let client: GoogleGenerativeAI | undefined;

function getClient(): GoogleGenerativeAI {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required for article section generation');
  }
  client = new GoogleGenerativeAI(apiKey);
  return client;
}

function safeJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export class GeminiArticleSectionGenerator implements SectionGenerator {
  constructor(private readonly modelName = process.env.ARTICLE_GEMINI_MODEL || 'gemini-2.0-flash') {}

  async generate(input: Parameters<SectionGenerator['generate']>[0]): Promise<ArticleSection> {
    const model = getClient().getGenerativeModel({ model: this.modelName });
    const prompt = [
      'You are generating ONE section of a source-grounded engineering article.',
      'Do not claim an implementation is real unless the supplied context includes evidence.',
      'Use VERIFIED only for claims backed by evidence; otherwise describe capability as DESIGN_INTENT.',
      'If incident source is generalized or hypothetical, say so explicitly.',
      'Dry engineering sarcasm is allowed only when the section policy permits it, maximum two short lines, and never mock people or teams.',
      'Do not invent outages, incidents, metrics, commits, classes, tests or production behavior.',
      'Return valid JSON only with keys: id, title, content.',
      '',
      `Series:\n${safeJson(input.series)}`,
      '',
      `Article model:\n${safeJson({
        id: input.article.id,
        number: input.article.number,
        title: input.article.title,
        subtitle: input.article.subtitle,
        sourceLabel: input.article.sourceLabel,
        claims: input.article.claims,
        existingSections: input.article.sections.map((section) => ({ id: section.id, title: section.title })),
      })}`,
      '',
      `Section contract:\n${safeJson(input.section)}`,
      '',
      `Task-specific context and evidence:\n${safeJson(input.context)}`,
    ].join('\n');

    const response = await model.generateContent(prompt);
    const text = response.response.text().trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Article generator returned non-JSON output for section ${input.section.id}`);

    const parsed = JSON.parse(match[0]) as Partial<ArticleSection>;
    if (parsed.id !== input.section.id || typeof parsed.title !== 'string' || typeof parsed.content !== 'string') {
      throw new Error(`Article generator returned invalid contract for section ${input.section.id}`);
    }

    return {
      id: parsed.id,
      title: parsed.title,
      content: parsed.content,
      data: parsed.data,
    };
  }
}
