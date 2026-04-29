export interface Stage1Summary {
  tagline: string
  examWeight: string
  mustKnow: string[]
  commonMistakes: string[]
  connectedDomains: string[]
}

export interface KeyTerm {
  term: string
  definition: string
}

export interface Stage2Topic {
  topic: string
  summary: string
  bullets: string[]
  examTip: string
  keyTerms: KeyTerm[]
}

export interface Stage3DeepDive {
  overview: string
  howItWorks: string[]
  realWorldExample: {
    scenario: string
    application: string
    outcome: string
  }
  examScenario: {
    question: string
    wrongAnswer: string
    correctAnswer: string
  }
  frameworks: {
    name: string
    description: string
    stages: string[]
  }[]
  memoryAid: string
}

export interface Stage4Question {
  q: string
  a: string
  b: string
  c: string
  d: string
  correct: string
  explanation: string
}
