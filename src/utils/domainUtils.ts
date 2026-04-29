export const DOMAIN_SLUGS: Record<string, string> = {
  'CX Strategy': 'cx-strategy',
  'Customer-Centric Culture': 'customer-centric-culture',
  'Voice of Customer': 'voice-of-customer',
  'Experience Design': 'experience-design',
  'Metrics & Measurement': 'metrics-measurement',
  'Organizational Adoption': 'organizational-adoption',
}

export const DOMAIN_FROM_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(DOMAIN_SLUGS).map(([k, v]) => [v, k])
)

export const toDomainSlug = (domain: string): string =>
  DOMAIN_SLUGS[domain] ?? domain.toLowerCase().replace(/\s+/g, '-')

export const fromDomainSlug = (slug: string): string =>
  DOMAIN_FROM_SLUG[slug] ?? slug

export const DOMAIN_TOPICS: Record<string, string[]> = {
  'CX Strategy': [
    'CX Vision & Mission',
    'Business Case for CX',
    'CX Maturity Models',
    'CX Governance & Ownership',
    'CX Roadmap & Prioritization',
    'Aligning CX to Corporate Strategy',
  ],
  'Customer-Centric Culture': [
    'Culture Change Management',
    'Leadership Buy-in & Sponsorship',
    'Employee Engagement in CX',
    'CX Champions Network',
    'Embedding CX Behaviors',
  ],
  'Voice of Customer': [
    'VoC Program Design',
    'Listening Post Strategy',
    'Quantitative vs Qualitative Research',
    'Customer Journey Analytics',
    'Insight Generation & Storytelling',
    'Closing the Feedback Loop',
  ],
  'Experience Design': [
    'Customer Journey Mapping',
    'Service Design Principles',
    'Design Thinking Process',
    'Moments of Truth',
    'Prototyping & Testing',
    'Innovation in CX',
  ],
  'Metrics & Measurement': [
    'NPS CSAT CES Explained',
    'Linking CX to Business Outcomes',
    'Building a CX Dashboard',
    'Statistical Concepts for CX',
    'ROI Calculation Methods',
  ],
  'Organizational Adoption': [
    'Change Management for CX',
    'Cross-functional Alignment',
    'CX Roles & Responsibilities',
    'Governance Structures',
    'Sustaining CX Momentum',
  ],
}

export const toTopicSlug = (topic: string): string =>
  topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
