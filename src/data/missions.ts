export interface ExampleMission {
  prompt: string
  tag: string
  hint: string
}

/** One-click missions. Chosen to be genuinely hard, not demo-friendly. */
export const EXAMPLE_MISSIONS: ExampleMission[] = [
  {
    prompt: 'Design a city where owning a private car becomes unnecessary by 2040.',
    tag: 'Urban systems',
    hint: 'The flagship analysis — fully authored',
  },
  {
    prompt: 'Make Chicago car-free by 2040 without destroying local businesses.',
    tag: 'Policy',
    hint: 'Two objectives that actively fight each other',
  },
  {
    prompt: 'Launch a consumer robotics company with $250,000.',
    tag: 'Venture',
    hint: 'Capital constraint an order of magnitude below the norm',
  },
  {
    prompt: 'Design a university that makes traditional degrees obsolete.',
    tag: 'Institutions',
    hint: 'Attacks a 900-year-old credential monopoly',
  },
  {
    prompt: 'Turn an abandoned mall into a profitable micro-city.',
    tag: 'Development',
    hint: 'Distressed asset, mixed-use conversion, real financing',
  },
  {
    prompt: 'Get humanity to a permanent Moon base before 2040.',
    tag: 'Frontier',
    hint: 'Multi-decade programme across hostile funding cycles',
  },
  {
    prompt: 'Cut a mid-size hospital’s readmission rate by 40% in three years.',
    tag: 'Health systems',
    hint: 'Incentives point the wrong way by design',
  },
  {
    prompt: 'Build a power grid for a country that leapfrogs fossil fuels entirely.',
    tag: 'Energy',
    hint: 'Infrastructure, sovereignty, and financing at once',
  },
]

export const DEMO_MISSION_PROMPT = EXAMPLE_MISSIONS[0].prompt
