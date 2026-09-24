export type LegalBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'unordered-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] };

export interface LegalSection {
  id: string;
  index: number;
  number: string;
  rawHeading: string;
  title: string;
  blocks: LegalBlock[];
}

export function slugifyHeading(text: string): string {
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'section';
}

export function cleanHeadingTitle(raw: string): string {
  // Strip leading numbering like "1. ", "01. ", "1: ", etc. if present, to derive clean display title
  return raw.replace(/^\d+[\.\:\-]?\s+/, '').trim() || raw.trim();
}

export function parseLegalMarkdown(markdown: string): LegalSection[] {
  if (!markdown || !markdown.trim()) return [];

  const lines = markdown.split(/\r?\n/);
  const sections: LegalSection[] = [];
  const slugCounts = new Map<string, number>();

  let currentSection: LegalSection | null = null;
  let currentList: { type: 'unordered-list' | 'ordered-list'; items: string[] } | null = null;

  const flushList = () => {
    if (currentList && currentSection) {
      currentSection.blocks.push(currentList);
      currentList = null;
    }
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // Check for ## section heading
    if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      flushList();
      const rawHeading = trimmed.slice(3).trim();
      const title = cleanHeadingTitle(rawHeading);
      const baseSlug = slugifyHeading(title);
      const count = (slugCounts.get(baseSlug) || 0) + 1;
      slugCounts.set(baseSlug, count);
      const id = count === 1 ? baseSlug : `${baseSlug}-${count}`;
      const index = sections.length;
      const number = String(index + 1).padStart(2, '0');

      currentSection = {
        id,
        index,
        number,
        rawHeading,
        title,
        blocks: [],
      };
      sections.push(currentSection);
      continue;
    }

    // Ignore content before first heading or empty lines
    if (!currentSection) continue;

    if (!trimmed) {
      flushList();
      continue;
    }

    // Check for ### subsection heading
    if (trimmed.startsWith('### ')) {
      flushList();
      currentSection.blocks.push({
        type: 'h3',
        text: trimmed.slice(4).trim(),
      });
      continue;
    }

    // Check for unordered list item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const itemText = trimmed.slice(2).trim();
      if (currentList && currentList.type === 'unordered-list') {
        currentList.items.push(itemText);
      } else {
        flushList();
        currentList = { type: 'unordered-list', items: [itemText] };
      }
      continue;
    }

    // Check for ordered list item (e.g., 1. Item)
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      const itemText = orderedMatch[2].trim();
      if (currentList && currentList.type === 'ordered-list') {
        currentList.items.push(itemText);
      } else {
        flushList();
        currentList = { type: 'ordered-list', items: [itemText] };
      }
      continue;
    }

    // Regular paragraph
    flushList();
    currentSection.blocks.push({
      type: 'paragraph',
      text: trimmed,
    });
  }

  flushList();
  return sections;
}
