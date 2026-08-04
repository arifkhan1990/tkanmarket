export interface AboutTeamMember {
  name: string
  role: string
  description: string
  imageSrc: string
  imageAlt: string
}

export interface AboutProcessStep {
  index: string
  title: string
  description: string
}

export interface AboutStatCard {
  eyebrow: string
  value: string
  description: string
  variant: 'inventory' | 'suppliers' | 'globalReach'
}

