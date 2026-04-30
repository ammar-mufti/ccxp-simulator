export interface CertDomain {
  name: string
  weight: number
  percentage: number
  topics: string[]
}

export interface Certification {
  id: string
  name: string
  fullName: string
  issuer: string
  color: string
  icon: string
  examQuestions: number
  examDuration: number
  passingScore: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  category: string
  domains: CertDomain[]
  about: string
  examFee: string
  renewalYears: number
  isAvailable: boolean
  popularity: 'high' | 'medium' | 'low'
}

export const CERTIFICATIONS: Certification[] = [

  // ── AVAILABLE NOW ──────────────────────────────

  {
    id: 'ccxp',
    name: 'CCXP',
    fullName: 'Certified Customer Experience Professional',
    issuer: 'CXPA',
    color: '#4A9EDB',
    icon: '🎯',
    examQuestions: 100,
    examDuration: 180,
    passingScore: 70,
    difficulty: 'Advanced',
    category: 'Customer Experience',
    examFee: '$495 USD',
    renewalYears: 3,
    isAvailable: true,
    popularity: 'high',
    about: 'The global standard for CX professionals. Tests knowledge across customer insight, strategy, design, metrics, and organizational adoption.',
    domains: [
      { name: 'CX Strategy', weight: 20, percentage: 20,
        topics: ['CX Vision & Mission','Business Case for CX','CX Maturity Models','CX Governance & Ownership','CX Roadmap & Prioritization','Aligning CX to Corporate Strategy'] },
      { name: 'Customer-Centric Culture', weight: 17, percentage: 17,
        topics: ['Culture Change Management','Leadership Buy-in & Sponsorship','Employee Engagement in CX','CX Champions Network','Embedding CX Behaviors'] },
      { name: 'Voice of Customer', weight: 20, percentage: 20,
        topics: ['VoC Program Design','Listening Post Strategy','Quantitative vs Qualitative Research','Customer Journey Analytics','Insight Generation & Storytelling','Closing the Feedback Loop'] },
      { name: 'Experience Design', weight: 18, percentage: 18,
        topics: ['Customer Journey Mapping','Service Design Principles','Design Thinking Process','Moments of Truth','Prototyping & Testing','Innovation in CX'] },
      { name: 'Metrics & Measurement', weight: 15, percentage: 15,
        topics: ['NPS CSAT CES Explained','Linking CX to Business Outcomes','Building a CX Dashboard','Statistical Concepts for CX','ROI Calculation Methods'] },
      { name: 'Organizational Adoption', weight: 10, percentage: 10,
        topics: ['Change Management for CX','Cross-functional Alignment','CX Roles & Responsibilities','Governance Structures','Sustaining CX Momentum'] },
    ],
  },

  {
    id: 'pmp',
    name: 'PMP',
    fullName: 'Project Management Professional',
    issuer: 'PMI',
    color: '#E8904A',
    icon: '📋',
    examQuestions: 180,
    examDuration: 230,
    passingScore: 70,
    difficulty: 'Advanced',
    category: 'Project Management',
    examFee: '$405 USD (PMI member)',
    renewalYears: 3,
    isAvailable: true,
    popularity: 'high',
    about: "The world's most recognised project management certification. Covers predictive, agile, and hybrid approaches across the full project lifecycle.",
    domains: [
      { name: 'People', weight: 63, percentage: 42,
        topics: ['Managing Conflict','Leading a Team','Supporting Team Performance','Empowering Team Members','Training and Mentoring','Building a Team','Addressing and Removing Impediments','Negotiating Project Agreements','Collaborating with Stakeholders','Building Shared Understanding','Engaging and Supporting Virtual Teams','Defining Team Ground Rules','Mentoring Relevant Stakeholders','Promoting Team Performance'] },
      { name: 'Process', weight: 81, percentage: 50,
        topics: ['Executing Project with Urgency','Managing Communications','Assessing and Managing Risks','Engaging Stakeholders','Planning and Managing Budget','Planning and Managing Schedule','Planning and Managing Quality','Planning and Managing Scope','Integrating Project Planning','Managing Project Changes','Planning and Managing Procurement','Managing Project Artifacts','Determining Appropriate Project Methodology','Establishing Project Governance','Managing Project Issues','Ensuring Knowledge Transfer'] },
      { name: 'Business Environment', weight: 36, percentage: 8,
        topics: ['Planning and Managing Project Compliance','Evaluating and Delivering Project Benefits','Evaluating and Addressing Internal Environment','Evaluating and Addressing External Business Environment','Supporting Organizational Change'] },
    ],
  },

  {
    id: 'aws-ccp',
    name: 'AWS CCP',
    fullName: 'AWS Certified Cloud Practitioner',
    issuer: 'Amazon Web Services',
    color: '#F59E0B',
    icon: '☁️',
    examQuestions: 65,
    examDuration: 90,
    passingScore: 70,
    difficulty: 'Beginner',
    category: 'Cloud Computing',
    examFee: '$100 USD',
    renewalYears: 3,
    isAvailable: true,
    popularity: 'high',
    about: 'Entry-level AWS certification covering cloud concepts, core AWS services, security, architecture, pricing and support. Ideal first cloud certification.',
    domains: [
      { name: 'Cloud Concepts', weight: 17, percentage: 26,
        topics: ['Cloud Computing Benefits','AWS Global Infrastructure','Cloud Deployment Models','Cloud Economics','High Availability and Fault Tolerance','Scalability and Elasticity'] },
      { name: 'Security and Compliance', weight: 21, percentage: 25,
        topics: ['Shared Responsibility Model','AWS IAM','Data Protection','Compliance Programs','Security Services Overview','AWS Artifact'] },
      { name: 'Cloud Technology and Services', weight: 33, percentage: 33,
        topics: ['AWS Core Services (EC2 S3 RDS VPC)','Serverless and Containers','Networking Services','Storage Services','Database Services','Management and Governance','Application Integration','AI and ML Services'] },
      { name: 'Billing Pricing and Support', weight: 18, percentage: 16,
        topics: ['AWS Pricing Models','Cost Management Tools','AWS Support Plans','Billing and Cost Optimization','AWS Free Tier','Reserved vs On-Demand Pricing'] },
    ],
  },

  {
    id: 'psm',
    name: 'PSM I',
    fullName: 'Professional Scrum Master I',
    issuer: 'Scrum.org',
    color: '#7BC67A',
    icon: '🔄',
    examQuestions: 80,
    examDuration: 60,
    passingScore: 85,
    difficulty: 'Intermediate',
    category: 'Agile & Scrum',
    examFee: '$150 USD',
    renewalYears: 0,
    isAvailable: true,
    popularity: 'high',
    about: 'Validates deep understanding of Scrum framework, values, and principles. Higher pass mark than most certs — requires genuine mastery not memorisation.',
    domains: [
      { name: 'Scrum Theory and Principles', weight: 20, percentage: 25,
        topics: ['Empiricism and Scrum Pillars','Scrum Values','Self-Managing Teams','Scrum vs Other Frameworks','Agile Manifesto Alignment'] },
      { name: 'Scrum Framework', weight: 28, percentage: 35,
        topics: ['Scrum Events','Scrum Artifacts','Scrum Team Roles','Sprint Planning','Daily Scrum','Sprint Review','Sprint Retrospective','Definition of Done','Product Backlog Refinement'] },
      { name: 'Scrum Master Role', weight: 24, percentage: 30,
        topics: ['Servant Leadership','Coaching the Team','Facilitating Events','Removing Impediments','Supporting the Product Owner','Organisational Change','Scrum Adoption'] },
      { name: 'Scaled Scrum', weight: 8, percentage: 10,
        topics: ['Nexus Framework','Scaling Challenges','Cross-Team Dependencies','Integrated Increment'] },
    ],
  },

  {
    id: 'itil4',
    name: 'ITIL 4',
    fullName: 'ITIL 4 Foundation',
    issuer: 'Axelos / PeopleCert',
    color: '#C97AC9',
    icon: '⚙️',
    examQuestions: 40,
    examDuration: 60,
    passingScore: 65,
    difficulty: 'Beginner',
    category: 'IT Service Management',
    examFee: '$370 USD',
    renewalYears: 3,
    isAvailable: true,
    popularity: 'medium',
    about: 'Foundation level certification for IT service management. Covers the ITIL 4 framework, service value system, four dimensions model, and core practices.',
    domains: [
      { name: 'Key Concepts of ITIL', weight: 10, percentage: 25,
        topics: ['Service and Service Management','Value and Value Co-creation','Organisations Providers and Consumers','Products and Services','Service Relationships','Value Outcomes Costs and Risks'] },
      { name: 'Four Dimensions of Service Management', weight: 8, percentage: 20,
        topics: ['Organisations and People','Information and Technology','Partners and Suppliers','Value Streams and Processes','External Factors PESTLE'] },
      { name: 'ITIL Service Value System', weight: 10, percentage: 25,
        topics: ['Service Value Chain','Guiding Principles','Governance','Continual Improvement','Practices Overview'] },
      { name: 'ITIL Practices', weight: 12, percentage: 30,
        topics: ['Incident Management','Problem Management','Change Enablement','Service Desk','Service Level Management','IT Asset Management','Monitoring and Event Management','Release Management','Service Request Management','Deployment Management'] },
    ],
  },

  // ── COMING SOON ────────────────────────────────

  {
    id: 'cspo',
    name: 'CSPO',
    fullName: 'Certified Scrum Product Owner',
    issuer: 'Scrum Alliance',
    color: '#7AC9C9',
    icon: '🎯',
    examQuestions: 0,
    examDuration: 0,
    passingScore: 74,
    difficulty: 'Intermediate',
    category: 'Agile & Scrum',
    examFee: '$200 USD',
    renewalYears: 2,
    isAvailable: false,
    popularity: 'high',
    about: 'Validates product ownership skills including backlog management, stakeholder collaboration, and value maximisation.',
    domains: [],
  },

  {
    id: 'aws-saa',
    name: 'AWS SAA',
    fullName: 'AWS Solutions Architect Associate',
    issuer: 'Amazon Web Services',
    color: '#F59E0B',
    icon: '🏗️',
    examQuestions: 65,
    examDuration: 130,
    passingScore: 72,
    difficulty: 'Intermediate',
    category: 'Cloud Computing',
    examFee: '$300 USD',
    renewalYears: 3,
    isAvailable: false,
    popularity: 'high',
    about: 'Validates ability to design resilient, high-performing, secure and cost-optimised AWS architectures.',
    domains: [],
  },

  {
    id: 'shrm-cp',
    name: 'SHRM-CP',
    fullName: 'SHRM Certified Professional',
    issuer: 'SHRM',
    color: '#E8904A',
    icon: '👥',
    examQuestions: 134,
    examDuration: 235,
    passingScore: 70,
    difficulty: 'Advanced',
    category: 'Human Resources',
    examFee: '$335 USD (SHRM member)',
    renewalYears: 3,
    isAvailable: false,
    popularity: 'medium',
    about: 'Global HR certification covering behavioural competencies and HR knowledge across the full employee lifecycle.',
    domains: [],
  },
]

export const AVAILABLE_CERTS = CERTIFICATIONS.filter(c => c.isAvailable)
export const COMING_SOON_CERTS = CERTIFICATIONS.filter(c => !c.isAvailable)

export const getCert = (id: string) =>
  CERTIFICATIONS.find(c => c.id === id)

export const getCertColor = (id: string) =>
  getCert(id)?.color ?? '#4A9EDB'
