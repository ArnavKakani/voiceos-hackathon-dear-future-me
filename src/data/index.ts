// ─── Navigation ──────────────────────────────────────────────────────────────
export const BEFORE_IT_BREAKS_URL = 'https://before-it-breaks.vercel.app/';
export const PRE_SURVEY_URL = 'https://neurohealthalliance.questionpro.com/t/AbYLCZ6Dsf';
export const POST_SURVEY_URL = 'https://neurohealthalliance.questionpro.com/t/AbYLCZ6DtH';

export const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Check In', path: '/check-in' },
  { label: 'Explore', path: '/explore' },
  { label: 'Check Out', path: '/check-out' },
  { label: 'Stories', path: '/stories' },
  { label: 'About', path: '/about' },
  { label: 'DFM Voice', path: '/voice' },
];

export const footerLinks = [
  ...navLinks,
  { label: 'Feedback', path: '/feedback' },
  { label: 'Developer', path: '/developer' },
];

// ─── Impact Stats ─────────────────────────────────────────────────────────────
export const impactStats = [
  { value: '26', label: 'Schools reached', accent: 'softgreen' },
  { value: '720', label: 'Workshop attendees', accent: 'softblue' },
  { value: '↓ 3.95→3.32', label: 'Avg. anxiety score after participation', accent: 'yellow' },
];

// ─── How It Works ─────────────────────────────────────────────────────────────
export const howItWorksSteps = [
  {
    number: '01',
    title: 'Check in with yourself',
    description: 'A short, honest moment before anything else. No right answers.',
    icon: 'heart',
    accent: 'peach',
  },
  {
    number: '02',
    title: 'Choose what you need',
    description: 'Write, reflect, build, or play. You decide what feels right today.',
    icon: 'compass',
    accent: 'yellow',
  },
  {
    number: '03',
    title: 'Reflect, write, or play',
    description: 'Explore your inner world through letters, vision boards, or Before It Breaks.',
    icon: 'feather',
    accent: 'softgreen',
  },
  {
    number: '04',
    title: 'Leave with perspective',
    description: 'Take a small insight with you. The kind that actually helps.',
    icon: 'star',
    accent: 'softblue',
  },
];

// ─── Activities ───────────────────────────────────────────────────────────────
export const activities = [
  {
    id: 'non-resume',
    title: 'Non-Resume Accomplishments',
    prompt: 'What are you proud of that would never fit on an application?',
    button: 'Start Writing',
    icon: 'award',
    accent: 'peach',
    moods: ['overwhelmed', 'behind', 'burned-out'],
  },
  {
    id: 'vision-board',
    title: 'Vision Board',
    prompt: 'What kind of life are you trying to grow toward?',
    button: 'Build Vision',
    icon: 'image',
    accent: 'softblue',
    moods: ['hopeful', 'unsure'],
  },
  {
    id: 'letter',
    title: 'Letter to Future Self',
    prompt: 'Write to the version of you who made it through.',
    button: 'Write Letter',
    icon: 'mail',
    accent: 'yellow',
    moods: ['overwhelmed', 'burned-out', 'comparing'],
  },
  {
    id: 'before-it-breaks',
    title: 'Before It Breaks',
    prompt: 'Walk through a simulated semester and see how choices affect your well-being.',
    button: 'Play Game',
    icon: 'gamepad',
    accent: 'softgreen',
    moods: ['behind', 'burned-out', 'comparing'],
  },
  {
    id: 'gratitude',
    title: 'Gratitude Note',
    prompt: 'Name one small thing that kept you going.',
    button: 'Add Note',
    icon: 'star',
    accent: 'yellow',
    moods: ['hopeful', 'unsure', 'overwhelmed'],
  },
  {
    id: 'reset',
    title: 'Reset Card',
    prompt: 'Take a 60-second pause before moving forward.',
    button: 'Start Reset',
    icon: 'refresh',
    accent: 'softblue',
    moods: ['burned-out', 'overwhelmed', 'behind'],
  },
];

export const moodFilters = [
  { id: 'overwhelmed', label: 'Overwhelmed' },
  { id: 'behind', label: 'Behind' },
  { id: 'burned-out', label: 'Burned out' },
  { id: 'hopeful', label: 'Hopeful' },
  { id: 'unsure', label: 'Unsure' },
  { id: 'comparing', label: 'Comparing myself' },
];

// ─── Community Stories ────────────────────────────────────────────────────────
export const storyTags = [
  'Academic pressure',
  'College anxiety',
  'Comparison',
  'Burnout',
  'Family pressure',
  'Small wins',
  'Hope',
];

export const stories = [
  {
    id: 1,
    text: 'I thought everyone else had it figured out. They didn\'t. None of us do, and somehow that made me feel less alone.',
    tags: ['Comparison', 'Hope'],
    color: 'yellow',
    rotation: '-1deg',
  },
  {
    id: 2,
    text: 'My small win was sleeping before midnight for once. It felt rebellious and also like the most caring thing I\'d done for myself in months.',
    tags: ['Small wins', 'Burnout'],
    color: 'peach',
    rotation: '1.5deg',
  },
  {
    id: 3,
    text: 'I\'m trying to stop treating rest like a reward I have to earn. Rest is not a trophy. It\'s just something I need.',
    tags: ['Burnout', 'Academic pressure'],
    color: 'softgreen',
    rotation: '-0.5deg',
  },
  {
    id: 4,
    text: 'I want future me to know I was trying. Even when it didn\'t look like it from the outside.',
    tags: ['Hope', 'Academic pressure'],
    color: 'softblue',
    rotation: '1deg',
  },
  {
    id: 5,
    text: 'My parents want me to be a doctor. I want to make music. I haven\'t told them yet, but I told this page.',
    tags: ['Family pressure', 'College anxiety'],
    color: 'yellow',
    rotation: '-1.5deg',
  },
  {
    id: 6,
    text: 'I got rejected from my top school and somehow it was... kind of okay? I thought it would break me. It didn\'t.',
    tags: ['College anxiety', 'Hope'],
    color: 'peach',
    rotation: '0.5deg',
  },
];

// ─── About Timeline ────────────────────────────────────────────────────────────
export const timelineItems = [
  { year: '2023', label: 'Research', description: 'Surveyed 1,109 high school students across 26 schools about academic pressure, burnout, and mental health.' },
  { year: '2023', label: 'Outreach', description: 'Connected with school counselors, educators, and students. Average anxiety score: 3.95 out of 5.' },
  { year: '2024', label: 'Workshops', description: 'Hosted in-person reflection workshops with 720 student attendees across ~33,200 reachable students.' },
  { year: '2024', label: 'Platform Launch', description: 'Launched the Dear Future Me digital platform for reflections, community stories, and interactive tools.' },
  { year: '2025', label: 'Measurable Impact', description: '989 post-reflections completed. Average anxiety score dropped from 3.95 to 3.32 after participation.' },
  { year: '2026', label: 'Expansion', description: 'Expanding to new schools, adding Before It Breaks, and growing the student community.' },
];

// ─── Game Choices ─────────────────────────────────────────────────────────────
export const gameChoices = [
  { label: '6 AP Classes', stress: 90, energy: 30, social: 40 },
  { label: '3 AP Classes', stress: 55, energy: 65, social: 65 },
  { label: 'No AP Classes', stress: 25, energy: 85, social: 80 },
];
