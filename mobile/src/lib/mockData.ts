// AFeeree Certification - Real Course Data
// Based on "A-Feeree: The Physical Language" by BaKari Ifasegun Lindsay

import type { User, Module, Assignment, Notification, Participant, FeedbackMessage } from './types';

// Google Drive Resource Links
export const resourceLinks = {
  notationImages: 'https://drive.google.com/file/d/1pq70_m7CfmQXsGW3qwstRpEaPriw2Buz/view?usp=drivesdk',
  syllabus: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk',
  culturalResearch: 'https://drive.google.com/file/d/1SsZkzHSWkQygnpixWrVSmoALOJIWxw7w/view?usp=drivesdk',
};

// Individual Kata page links
export const kataLinks = {
  kunindi: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk&disco=AAABx461S9I',
  torsoDevelopment: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk&disco=AAABy8JWcZE',
  footRhythms: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk&disco=AAABy8JWcZQ',
  traditionalSquats: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk&disco=AAABy8JWcZU',
  balaLapi: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk&disco=AAABy8JWcZY',
  semboo: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk&disco=AAABy8JWcZw',
  flatBacks: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk&disco=AAABy8JWcaY',
  barente: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk&disco=AAABy8JWcac',
  sevenPrinciples: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk&disco=AAABy8JWcbQ',
};

// Video Demonstrations
export const videoLinks = {
  part1: 'https://vimeo.com/455075353',
  part2: 'https://vimeo.com/455075798',
  keyPrinciples: 'https://vimeo.com/771232190',
};

// Seven Foundational Principles from Asante's African Culture Framework
export const foundationalPrinciples = [
  { name: 'Polyrhythm', description: 'Multiple distinct rhythms maintaining individual identity while creating unified expression' },
  { name: 'Polycentrism', description: 'Movement originating from multiple centers of the body simultaneously' },
  { name: 'Curvilinear Form', description: 'Emphasis on curved, flowing movement patterns' },
  { name: 'Dimensionality', description: 'Use of all spatial planes and levels in movement' },
  { name: 'Epic Memory', description: 'Connection to ancestral and cultural movement traditions' },
  { name: 'Repetition', description: 'Purposeful repetition for mastery and rhythmic grounding' },
  { name: 'Holism', description: 'Integration of mind, body, and spirit in movement practice' },
];

// Mandinka Terminology
export const mandinkaTerms = [
  { term: 'A-Feeree', meaning: 'Training/Method', phonetic: 'Ah Fee Ree', audio: require('../../assets/audio/afeeree.m4a') },
  { term: 'Kunidi', meaning: 'Awakening', phonetic: 'Koo nee thee', audio: require('../../assets/audio/kunidi.m4a') },
  { term: 'Kata', meaning: 'Movement', phonetic: 'Kar tar', audio: require('../../assets/audio/kata.m4a') },
  { term: 'Bala', meaning: 'On', phonetic: 'Bar La', audio: require('../../assets/audio/bala.m4a') },
  { term: 'Barente', meaning: 'Move', phonetic: 'Bar Ren teh', audio: require('../../assets/audio/barente.m4a') },
  { term: 'Saba', meaning: 'Stretch', phonetic: 'Sah Bah', audio: require('../../assets/audio/saba.m4a') },
  { term: 'Semboo', meaning: 'Strength', phonetic: 'Sem Bow', audio: require('../../assets/audio/semboo.m4a') },
  { term: 'Lapi', meaning: 'Beat', phonetic: 'Lah pee', audio: require('../../assets/audio/lapi.m4a') },
];

export const mockUser: User = {
  id: '1',
  name: '',
  email: '',
  enrollmentDate: '',
  certificationLevel: 'Foundation',
  progress: 0,
  role: 'student',
};

// Use local image for all modules
const danceClassImage = require('../../public/image-1769399578.jpeg');

export const mockModules: Module[] = [
  {
    id: '1',
    title: 'Kunindi (Awakening)',
    description: 'Opening positions and foundational torso work. Prepares the body through culturally-informed movement principles for African and African Diasporic dance.',
    notationRef: 'KATA 1-2, Pages 10-12',
    pdfPage: 10,
    pdfEndPage: 12,
    pdfLink: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk',
    localImage: danceClassImage,
    duration: '4 weeks',
    lessons: 8,
    completedLessons: 0,
    isLocked: false,
    category: 'Technique',
    contactHours: 4,
    videoUrl: 'https://vimeo.com/455075353',
  },
  {
    id: '2',
    title: 'Torso Development',
    description: 'Master the two-sectional body approach separating upper (torso, arms, head) and lower (pelvis, legs) with emphasis on spiral, contraction, and release.',
    notationRef: 'KATA 2A-3, Pages 13-15',
    pdfPage: 13,
    pdfEndPage: 15,
    pdfLink: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk',
    localImage: danceClassImage,
    duration: '3 weeks',
    lessons: 6,
    completedLessons: 0,
    isLocked: false,
    category: 'Technique',
    contactHours: 4,
    videoUrl: 'https://vimeo.com/455075353',
  },
  {
    id: '3',
    title: 'Foot Rhythms & Isolations',
    description: 'Develop polyrhythmic movement where feet maintain foundational rhythm while upper body layers multiple simultaneous rhythmic patterns.',
    notationRef: 'KATA 3A-3B, Page 15',
    pdfPage: 15,
    pdfEndPage: 15,
    pdfLink: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk',
    localImage: danceClassImage,
    duration: '3 weeks',
    lessons: 7,
    completedLessons: 0,
    isLocked: false,
    category: 'Technique',
    contactHours: 4,
    videoUrl: 'https://vimeo.com/455075353',
  },
  {
    id: '4',
    title: 'Traditional Squats',
    description: 'Deep squats with core engagement rooted in African dance traditions. Build strength and flexibility through functional movement patterns.',
    notationRef: 'KATA 4-5, Pages 16-19',
    pdfPage: 16,
    pdfEndPage: 19,
    pdfLink: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk',
    localImage: danceClassImage,
    duration: '2 weeks',
    lessons: 5,
    completedLessons: 0,
    isLocked: false,
    category: 'Technique',
    contactHours: 4,
    videoUrl: 'https://vimeo.com/455075798',
  },
  {
    id: '5',
    title: 'Bala-Lapi (Mandinka) On Beat',
    description: 'Isolated polyrhythmic movements: hand circles, head/neck isolation, shoulder work, rib-cage articulation, and windmill arms with footwork.',
    notationRef: 'KATA 6-18A, Pages 21-34',
    pdfPage: 21,
    pdfEndPage: 34,
    pdfLink: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk',
    localImage: danceClassImage,
    duration: '5 weeks',
    lessons: 12,
    completedLessons: 0,
    isLocked: false,
    category: 'Technique',
    contactHours: 4,
    videoUrl: 'https://vimeo.com/455075798',
  },
  {
    id: '6',
    title: 'Semboo (Stretch & Strength)',
    description: 'Pelvic articulation with arm coordination, lunges, forward bends, lateral stretches, and flat backs with spinal rippling.',
    notationRef: 'KATA 19-19P, Pages 35-47',
    pdfPage: 35,
    pdfEndPage: 47,
    pdfLink: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk',
    localImage: danceClassImage,
    duration: '4 weeks',
    lessons: 10,
    completedLessons: 0,
    isLocked: false,
    category: 'Technique',
    contactHours: 4,
    videoUrl: 'https://vimeo.com/455075798',
  },
  {
    id: '7',
    title: 'Flat Backs with Ripples & Side Laterals',
    description: 'Spinal articulation techniques creating wave-like movements through the spine for expressive and powerful dance vocabulary.',
    notationRef: 'KATA 20-23, Pages 48-53',
    pdfPage: 48,
    pdfEndPage: 53,
    pdfLink: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk',
    localImage: danceClassImage,
    duration: '3 weeks',
    lessons: 6,
    completedLessons: 0,
    isLocked: false,
    category: 'Technique',
    contactHours: 4,
    videoUrl: 'https://vimeo.com/771232190',
  },
  {
    id: '8',
    title: 'Barente (Mandinka) or Move',
    description: 'Combined choreographic sequences integrating all learned elements into flowing combinations with 6/8 rhythmic pulse.',
    notationRef: 'KATA 24-25, Pages 54-55',
    pdfPage: 54,
    pdfEndPage: 55,
    pdfLink: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk',
    localImage: danceClassImage,
    duration: '6 weeks',
    lessons: 15,
    completedLessons: 0,
    isLocked: false,
    category: 'Technique',
    contactHours: 4,
    videoUrl: 'https://vimeo.com/771232190',
  },
  {
    id: '9',
    title: 'Seven Foundational Principles',
    description: 'Study Polyrhythm, Polycentrism, Curvilinear Form, Dimensionality, Epic Memory, Repetition, and Holism from Asante\'s framework.',
    notationRef: 'Theory Section, Page 5',
    pdfPage: 5,
    pdfEndPage: 5,
    pdfLink: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk',
    localImage: danceClassImage,
    duration: '4 weeks',
    lessons: 7,
    completedLessons: 0,
    isLocked: false,
    category: 'Theory',
    contactHours: 4,
    videoUrl: 'https://vimeo.com/771232190',
  },
  {
    id: 'history',
    title: 'History and Context of the Development of AFeeree',
    description: 'Explore the historical roots and scholarly research behind the development of AFeeree — from its West African origins to its contemporary pedagogical framework. Required readings with timed study sessions.',
    notationRef: 'History & Research Readings',
    pdfPage: 1,
    pdfEndPage: 10,
    localImage: danceClassImage,
    duration: '4 weeks',
    lessons: 6,
    completedLessons: 0,
    isLocked: false,
    category: 'Theory',
    contactHours: 4,
    isHistoryModule: true,
  },
];

export const mockAssignments: Assignment[] = [
  {
    id: 'assign-2',
    title: 'Cultural Research Reflection',
    description: 'Write a reflection (300–500 words) on the cultural origins and significance of AFeeree dance. Use the provided research document as a starting point. How does this history inform your practice?',
    moduleId: 'module-2',
    moduleName: 'Cultural Context & History',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    type: 'reflection',
  },
  {
    id: 'assign-3',
    title: 'Teaching Demo — Physical Language Sequence',
    description: 'Upload a video of yourself teaching the physical language sequence to at least one other person. Demonstrate clear verbal cues, proper demonstration, and the ability to correct form in real time.',
    moduleId: 'module-3',
    moduleName: 'Teaching Methodology',
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    type: 'teaching_demo',
  },
];

export const mockNotifications: Notification[] = [];

// Participants for feedback - will be populated when real users join
export const mockParticipants: Participant[] = [];

// Feedback messages - will be populated with real conversations
export const mockFeedbackMessages: FeedbackMessage[] = [];
