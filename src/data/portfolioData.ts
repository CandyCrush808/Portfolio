export interface Project {
  id: string;
  title: string;
  category: 'Game Dev' | 'Full-Stack' | 'Tools' | 'Creative';
  shortDescription: string;
  fullDescription: string;
  problemSolved: string;
  keyFeatures: string[];
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  highlight?: boolean;
  imagePlaceholderColor?: string;
}

export interface SkillCategory {
  title: string;
  icon: string;
  skills: Array<{ name: string; level: string; note: string }>;
}

export interface DeveloperProfile {
  name: string;
  title: string;
  role: string;
  status: string;
  location: string;
  bio: string[];
  highlights: string[];
  email: string;
  github: string;
  repoUrl: string;
}

export interface QuestObjective {
  id: string;
  title: string;
  description: string;
  zone: string;
  completed: boolean;
}

export const DEVELOPER_PROFILE: DeveloperProfile = {
  name: 'CandyCrush808',
  title: 'Full-Stack Developer & Game Enthusiast',
  role: 'Developer & Creative Designer',
  status: 'Exploring • Open to Opportunities',
  location: 'Remote / Global',
  bio: [
    'Welcome to PixelQuest! I am a software developer passionate about building interactive, responsive web applications and playful digital experiences.',
    'I bridge the gap between robust software engineering and classic 16-bit game aesthetics. Whether building full-stack web platforms or custom canvas game engines, I focus on performance, accessibility, and delightful user experience.',
    'Explore the village to inspect my featured projects at the Portfolio Hall, view technical skills at the Forge, and get in touch at the Contact House!'
  ],
  highlights: [
    'Specializes in TypeScript, modern web architectures, and 2D canvas game mechanics',
    'Dedicated to responsive, cross-device design from mobile phones to high-res monitors',
    'Committed to clean code, modular architecture, and thorough documentation'
  ],
  email: 'candycrush808s@gmail.com',
  github: 'https://github.com/CandyCrush808',
  repoUrl: 'https://github.com/CandyCrush808/Portfolio',
};

export const PROJECTS: Project[] = [
  {
    id: 'pixelquest',
    title: 'PixelQuest: RPG Portfolio',
    category: 'Game Dev',
    shortDescription: 'Interactive 2D top-down RPG portfolio website built with Phaser 3, TypeScript, and Vite.',
    fullDescription: 'PixelQuest turns the traditional developer portfolio into an explorable 16-bit fantasy world. Visitors walk through a handcrafted village, interact with NPCs, and discover projects, skills, and contact information through in-game buildings.',
    problemSolved: 'Replaces static, uninspiring portfolio templates with a memorable interactive journey while retaining fast loading times and mobile-friendly usability.',
    keyFeatures: [
      'Edge-to-edge Phaser 3 canvas with responsive integer camera scaling',
      'Dual desktop keyboard & mobile touch D-pad controllers',
      'Data-driven building triggers, dialogue systems, and quest log',
      'Integrated Web Audio retro sound synthesizer without heavy audio files',
      'Fully accessible DOM UI overlays for screen readers and keyboard navigation'
    ],
    technologies: ['TypeScript', 'Phaser 3', 'Vite', 'HTML5 Canvas', 'Web Audio API', 'CSS Grid'],
    githubUrl: 'https://github.com/CandyCrush808/Portfolio',
    liveUrl: './',
    highlight: true,
    imagePlaceholderColor: '#222443',
  },
  {
    id: 'retro-crawler',
    title: 'Retro Dungeon Crawler Engine',
    category: 'Game Dev',
    shortDescription: 'Procedural dungeon exploration game featuring custom pathfinding and tile-based fog of war.',
    fullDescription: 'A retro dungeon crawler engineered with TypeScript. Features custom binary space partitioning for procedural room generation, Bresenham line-of-sight raycasting, and an extensible turn-based combat system.',
    problemSolved: 'Demonstrates algorithms for dynamic level creation, spatial indexing, and state management in game development.',
    keyFeatures: [
      'Procedural dungeon generation using BSP algorithms',
      'Field-of-view calculation and dynamic shadow masking',
      'Turn-based combat system with damage formula calculations',
      'Inventory, equipable weapons, and item pickup mechanics'
    ],
    technologies: ['TypeScript', 'Canvas 2D', 'Data Structures', 'Algorithms'],
    githubUrl: 'https://github.com/CandyCrush808',
    highlight: true,
    imagePlaceholderColor: '#183D32',
  },
  {
    id: 'task-platform',
    title: 'Real-Time Workspace & Kanban',
    category: 'Full-Stack',
    shortDescription: 'Collaborative team productivity application with live board updates and granular permissions.',
    fullDescription: 'A full-stack collaborative project management platform allowing teams to coordinate sprints, manage kanban boards, and chat in real-time. Built with optimistic UI updates and resilient offline sync.',
    problemSolved: 'Streamlines asynchronous team workflows with sub-second synchronization and minimal server overhead.',
    keyFeatures: [
      'Drag-and-drop kanban task boards with immediate optimistic state updates',
      'Real-time multi-user synchronization via WebSocket connections',
      'JWT token authentication and role-based access control (RBAC)',
      'Responsive design supporting mobile and desktop workstations'
    ],
    technologies: ['TypeScript', 'Node.js', 'Express', 'WebSocket', 'PostgreSQL', 'Tailwind CSS'],
    githubUrl: 'https://github.com/CandyCrush808',
    highlight: false,
    imagePlaceholderColor: '#26332C',
  },
  {
    id: 'chiptune-synth',
    title: 'Web Audio 8-Bit Synthesizer',
    category: 'Tools',
    shortDescription: 'In-browser sound effects and music generator mimicking classic gaming sound chips.',
    fullDescription: 'A lightweight audio tool built on the Web Audio API that generates authentic 8-bit square, triangle, and noise waves. Allows exporting custom SFX presets as WAV files for indie game creators.',
    problemSolved: 'Provides indie developers with an instant, zero-install way to design retro sound effects directly in the browser.',
    keyFeatures: [
      'Oscillator controls with customizable frequency envelopes and duty cycles',
      'Real-time frequency visualizer canvas',
      'Instant WAV audio export using custom client-side audio encoders',
      'Preset library for jump, laser, explosion, and coin chimes'
    ],
    technologies: ['Web Audio API', 'TypeScript', 'HTML5 Canvas', 'DSP'],
    githubUrl: 'https://github.com/CandyCrush808',
    highlight: false,
    imagePlaceholderColor: '#362A4F',
  },
  {
    id: 'cloud-observability',
    title: 'Cloud Metrics & Telemetry Dashboard',
    category: 'Full-Stack',
    shortDescription: 'High-density observability portal for service health monitoring and logs.',
    fullDescription: 'An interactive developer dashboard for viewing real-time latency distributions, error budgets, and container telemetry with sub-second charts and dark-mode optimization.',
    problemSolved: 'Aggregates fragmented cloud metrics into an easy-to-read, keyboard-accessible central interface.',
    keyFeatures: [
      'Interactive time-series metric graphs with scrub zoom',
      'Configurable alert thresholds with visual status badges',
      'High contrast accessible data tables with instant filtering'
    ],
    technologies: ['TypeScript', 'React', 'REST APIs', 'Chart.js'],
    githubUrl: 'https://github.com/CandyCrush808',
    highlight: false,
    imagePlaceholderColor: '#1A2930',
  }
];

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    title: 'Frontend & Game Architecture',
    icon: '⚔️',
    skills: [
      { name: 'TypeScript / JavaScript (ES6+)', level: 'Advanced', note: 'Strict typing, modern patterns, clean architecture' },
      { name: 'Phaser 3 Game Engine', level: 'Proficient', note: 'Scenes, cameras, arcade physics, sprite sheets' },
      { name: 'HTML5 Canvas 2D API', level: 'Proficient', note: 'Pixel manipulation, rendering loops, particle systems' },
      { name: 'Modern CSS3 & Animations', level: 'Advanced', note: 'Flexbox, Grid, custom properties, responsive design' },
      { name: 'Web Accessibility (a11y)', level: 'Proficient', note: 'ARIA roles, keyboard traps, focus management' }
    ]
  },
  {
    title: 'Backend & Systems',
    icon: '🛡️',
    skills: [
      { name: 'Node.js & Express', level: 'Proficient', note: 'RESTful API design, middleware, auth flows' },
      { name: 'Database Fundamentals', level: 'Proficient', note: 'PostgreSQL, schema modeling, query optimization' },
      { name: 'WebSockets & Real-time', level: 'Familiar', note: 'Live event streaming, state synchronization' },
      { name: 'Python', level: 'Familiar', note: 'Scripting, asset processing, data validation' }
    ]
  },
  {
    title: 'Tooling & Workflow',
    icon: '🛠️',
    skills: [
      { name: 'Vite & Module Bundlers', level: 'Advanced', note: 'Hot module replacement, production asset pipelines' },
      { name: 'Git & GitHub Collaboration', level: 'Advanced', note: 'Branching, PRs, CI workflows, version tracking' },
      { name: 'Linux / Bash Terminal', level: 'Proficient', note: 'Shell scripting, environment management' },
      { name: 'Asset Processing Pipelines', level: 'Proficient', note: 'Spritesheet slicing, atlas normalization, transparency' }
    ]
  },
  {
    title: 'Audio & Visual Design',
    icon: '🎨',
    skills: [
      { name: 'Pixel Art Aesthetics', level: 'Proficient', note: 'Palette selection, integer scaling, retro 16-bit style' },
      { name: 'UI / UX Design', level: 'Proficient', note: 'Information hierarchy, tactile feedback, affordances' },
      { name: 'Web Audio API Synthesis', level: 'Proficient', note: 'Chiptune sound effects, oscillators, gain nodes' }
    ]
  }
];

export const QUEST_OBJECTIVES: QuestObjective[] = [
  {
    id: 'explore-plaza',
    title: 'Explore the Main Plaza',
    description: 'Walk around the central village square and get accustomed to the controls.',
    zone: 'Main Plaza',
    completed: true,
  },
  {
    id: 'talk-guide',
    title: 'Meet Rowan the Guide',
    description: 'Speak with Rowan standing near the plaza to learn about the village.',
    zone: 'Main Plaza',
    completed: false,
  },
  {
    id: 'visit-portfolio',
    title: 'Inspect Portfolio Hall',
    description: 'Travel North to the Portfolio Hall and browse through featured projects.',
    zone: 'Portfolio Hall',
    completed: false,
  },
  {
    id: 'visit-skills',
    title: 'Visit the Skills Forge',
    description: 'Head West to the Skills Forge to see technical abilities and toolkits.',
    zone: 'Skills Forge',
    completed: false,
  },
  {
    id: 'visit-contact',
    title: 'Check the Contact House',
    description: 'Venture South-East to the Contact House to find email and social channels.',
    zone: 'Contact House',
    completed: false,
  }
];

export const GUIDE_DIALOGUE = [
  {
    speaker: 'Rowan',
    title: 'Village Guide',
    avatarKey: 'guide',
    text: "Greetings, traveler! Welcome to PixelQuest."
  },
  {
    speaker: 'Rowan',
    title: 'Village Guide',
    avatarKey: 'guide',
    text: "This isn't an ordinary portfolio—it's an interactive world built with Phaser 3, TypeScript, and modern web tech."
  },
  {
    speaker: 'Rowan',
    title: 'Village Guide',
    avatarKey: 'guide',
    text: "Head North along the stone road to visit Portfolio Hall and inspect real project cards."
  },
  {
    speaker: 'Rowan',
    title: 'Village Guide',
    avatarKey: 'guide',
    text: "Follow the Western path to the Skills Forge, or take the South-Eastern path to the Contact House to send a message."
  },
  {
    speaker: 'Rowan',
    title: 'Village Guide',
    avatarKey: 'guide',
    text: "Use WASD or arrow keys to stroll, and press E or Space when near a door or sign. Have fun exploring!"
  }
];
