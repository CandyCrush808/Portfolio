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


export interface ExperienceItem {
  id: string;
  period: string;
  role: string;
  organization: string;
  location: string;
  type: 'Work' | 'Education' | 'Achievement';
  description: string;
  highlights: string[];
  badges: string[];
}

export interface ServiceItem {
  id: string;
  icon: string;
  title: string;
  tagline: string;
  description: string;
  deliverables: string[];
  technologies: string[];
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
    description: 'Walk around the central village square and admire the stone fountain.',
    zone: 'Main Plaza',
    completed: false,
  },
  {
    id: 'talk-guide',
    title: 'Meet Rowan the Guide',
    description: 'Speak with Rowan standing near the fountain to learn about the village.',
    zone: 'Main Plaza',
    completed: false,
  },
  {
    id: 'visit-about',
    title: 'Inspect About Me Cottage',
    description: 'Visit the cozy cottage on the western path to learn about the developer.',
    zone: 'About Cottage',
    completed: false,
  },
  {
    id: 'visit-portfolio',
    title: 'Inspect Projects Workshop',
    description: 'Travel North to the Projects Workshop and browse through featured creations.',
    zone: 'Projects Workshop',
    completed: false,
  },
  {
    id: 'visit-skills',
    title: 'Visit the Skills Library',
    description: 'Head Northwest to the Skills Library to view technical abilities and toolkits.',
    zone: 'Skills Library',
    completed: false,
  },
  {
    id: 'visit-experience',
    title: 'Enter Experience Guild Hall',
    description: 'Venture Northeast across the bridge to inspect career milestones and credentials.',
    zone: 'Guild Hall',
    completed: false,
  },
  {
    id: 'visit-services',
    title: 'Browse the Services Market',
    description: 'Visit the bustling market on the eastern side of the plaza to explore service offerings.',
    zone: 'Services Market',
    completed: false,
  },
  {
    id: 'visit-contact',
    title: 'Check the Contact Inn',
    description: 'Venture Southeast along the river path to the Contact Inn to connect directly.',
    zone: 'Contact Inn',
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


export const EXPERIENCE_DATA: ExperienceItem[] = [
  {
    id: 'lead-dev',
    period: '2023 — Present',
    role: 'Senior Full-Stack Developer & Game Architect',
    organization: 'Creative Interactive Labs',
    location: 'Remote / Global',
    type: 'Work',
    description: 'Directing the architecture and implementation of responsive web apps, canvas 2D visualization tools, and interactive educational software.',
    highlights: [
      'Architected custom Phaser 3 / TypeScript game engine abstractions delivering consistent 60 FPS across mobile and desktop devices.',
      'Developed real-time WebSocket state synchronizers with resilient reconnects and sub-50ms latency.',
      'Mentored junior engineers and led best practices in accessibility (a11y), clean code, and modular pipelines.'
    ],
    badges: ['TypeScript', 'Phaser 3', 'Node.js', 'WebSockets', 'Vite', 'Architecture']
  },
  {
    id: 'frontend-engineer',
    period: '2021 — 2023',
    role: 'Front-End Systems Engineer',
    organization: 'Nexus Web Systems',
    location: 'Remote',
    type: 'Work',
    description: 'Built high-throughput dashboard portals, reusable component libraries, and interactive canvas components for enterprise telemetry.',
    highlights: [
      'Refactored legacy UI components into strictly typed TypeScript and accessible modern CSS Grid designs.',
      'Improved lighthouse performance score from 68 to 98 through asset pipelining, lazy-loading, and bundling optimizations.',
      'Created automated visual regression test suites for cross-browser reliability.'
    ],
    badges: ['React', 'TypeScript', 'Tailwind CSS', 'Performance', 'CI/CD']
  },
  {
    id: 'cs-degree',
    period: '2017 — 2021',
    role: 'Bachelor of Science in Computer Science',
    organization: 'University Department of Engineering',
    location: 'Academic Campus',
    type: 'Education',
    description: 'Focused on algorithms, data structures, computer graphics, distributed systems, and human-computer interaction.',
    highlights: [
      'Graduated with First Class Honors and Dean\'s Academic Excellence Award.',
      'Completed Capstone project on procedural map generation and spatial indexing for 2D worlds.',
      'Organized collegiate game jams and developer workshops.'
    ],
    badges: ['Algorithms', 'Data Structures', 'Graphics', 'Distributed Systems', 'HCI']
  },
  {
    id: 'guild-master',
    period: 'Achievements & Honors',
    role: 'Guild Master Craftsman',
    organization: 'Global Indie & Web Development Communities',
    location: 'Worldwide',
    type: 'Achievement',
    description: 'Recognized for contributions to open-source game engines, developer tooling, and innovative interactive web portfolios.',
    highlights: [
      'Winner of 3 international Game Dev jams for technical polish and gameplay innovation.',
      'Authored popular open-source utilities for pixel-art tile extraction and spritesheet normalization.',
      'Active mentor helping aspiring developers break into software engineering.'
    ],
    badges: ['Open Source', 'Game Jams', 'Mentorship', 'Innovation']
  }
];

export const SERVICES_DATA: ServiceItem[] = [
  {
    id: 'fullstack-dev',
    icon: '💻',
    title: 'Full-Stack Web Applications',
    tagline: 'End-to-end modern web applications built for speed, scale, and resilience.',
    description: 'From interactive client-side interfaces to resilient backend APIs and databases, I build complete web platforms tailored to your vision.',
    deliverables: [
      'Modern responsive SPA and PWA development',
      'REST & GraphQL API design with Node.js and Express',
      'Database modeling with PostgreSQL, SQLite, or MongoDB',
      'Secure authentication, session management, and RBAC'
    ],
    technologies: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Vite', 'Tailwind CSS']
  },
  {
    id: 'game-dev',
    icon: '🎮',
    title: 'Interactive 2D Games & Canvas',
    tagline: 'Playful, memorable digital adventures and gamified interactive experiences.',
    description: 'I transform standard web products into unforgettable interactive experiences using Phaser 3, Canvas 2D, and custom game physics.',
    deliverables: [
      'Custom 2D RPG, puzzle, and platformer development',
      'Interactive product showcases and gamified onboarding',
      'Audio synthesis and custom soundscape integration',
      'Mobile-optimized touch controls and responsive viewports'
    ],
    technologies: ['Phaser 3', 'HTML5 Canvas', 'Web Audio API', 'Arcade Physics', 'Pixel Art']
  },
  {
    id: 'ui-ux-design',
    icon: '🎨',
    title: 'UI/UX Design Systems & Access',
    tagline: 'Tactile, high-contrast, accessible digital design with retro character.',
    description: 'Crafting cohesive design systems, tactile interface components, and fully keyboard/screen-reader accessible experiences.',
    deliverables: [
      'Design tokens and modular CSS component libraries',
      'Full WCAG AA/AAA accessibility compliance',
      'Retro pixel-art and modern hybrid aesthetic design',
      'Interactive animations, tactile micro-interactions, and sound cues'
    ],
    technologies: ['CSS Grid / Flexbox', 'ARIA', 'Figma', 'Pixel Art', 'Animations']
  },
  {
    id: 'consulting',
    icon: '⚡',
    title: 'Architecture & Performance Audits',
    tagline: 'Eliminating latency, streamlining asset pipelines, and elevating code quality.',
    description: 'Deep-dive technical audits to boost FPS, shrink bundle weights, improve Core Web Vitals, and establish robust engineering patterns.',
    deliverables: [
      'Lighthouse and Core Web Vitals performance optimization',
      'Asset pipeline automation and spritesheet slicing workflows',
      'TypeScript migration and architectural refactoring',
      'Code reviews and developer documentation'
    ],
    technologies: ['Vite', 'Webpack', 'Profilers', 'Automated CI/CD', 'Python Scripting']
  }
];

export const ELENA_DIALOGUE = [
  {
    speaker: 'Guildmaster Elena',
    title: 'Experience Guild',
    avatarKey: 'elena',
    text: 'Welcome to the Experience Guild Hall, traveler! I am Elena, Master of Chronicles.'
  },
  {
    speaker: 'Guildmaster Elena',
    title: 'Experience Guild',
    avatarKey: 'elena',
    text: 'Within these storied walls rest the developer\'s career timeline, verified credentials, and university honors.'
  },
  {
    speaker: 'Guildmaster Elena',
    title: 'Experience Guild',
    avatarKey: 'elena',
    text: 'Step forward to inspect our chronicles, or venture west into the village square when you are ready!'
  }
];

export const SILAS_DIALOGUE = [
  {
    speaker: 'Merchant Silas',
    title: 'Services Market',
    avatarKey: 'silas',
    text: 'Fine wares, sharp code, and bespoke craftsmanship! Welcome to the Services Market!'
  },
  {
    speaker: 'Merchant Silas',
    title: 'Services Market',
    avatarKey: 'silas',
    text: 'Need a full-stack web application, a custom 2D canvas game engine, or a performance overhaul?'
  },
  {
    speaker: 'Merchant Silas',
    title: 'Services Market',
    avatarKey: 'silas',
    text: 'Step up to my stall to browse our service offerings and technical deliverables. Satisfaction guaranteed!'
  }
];

export const FINN_DIALOGUE = [
  {
    speaker: 'Barkeep Finn',
    title: 'Contact Inn',
    avatarKey: 'finn',
    text: 'Pull up a stool, traveler! Rest your boots by the hearth at the Contact Inn.'
  },
  {
    speaker: 'Barkeep Finn',
    title: 'Contact Inn',
    avatarKey: 'finn',
    text: 'Looking to hire, collaborate on a project, or just discuss game mechanics? The message board is right here.'
  },
  {
    speaker: 'Barkeep Finn',
    title: 'Contact Inn',
    avatarKey: 'finn',
    text: 'Step inside to copy the developer\'s email, GitHub repository link, or send an inquiry!'
  }
];
