import type { AboutContent } from './siteContentApi';

export type AboutSectionId = 'mission' | 'values' | 'milestones' | 'team' | 'ecosystem';

export function visibleAboutSections(content: AboutContent) {
  const sections: Array<{ id: AboutSectionId; title: string }> = [
    { id: 'mission', title: 'Về Nexora' },
    { id: 'values', title: 'Giá trị cốt lõi' },
    ...(content.milestones.length ? [{ id: 'milestones' as const, title: 'Hành trình phát triển' }] : []),
    ...(content.teamSectionEnabled && content.teamMembers.length ? [{ id: 'team' as const, title: 'Đội ngũ' }] : []),
    { id: 'ecosystem', title: 'Nexora hỗ trợ bạn' },
  ];
  return sections.map((section, index) => ({ ...section, number: String(index + 1).padStart(2, '0') }));
}
