// AFeeree Certification Program - Real Course Data
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
  { term: 'A-Feeree', meaning: 'Training/Method' },
  { term: 'Kunidi', meaning: 'Awakening' },
  { term: 'Kata', meaning: 'Movement' },
  { term: 'Bala', meaning: 'On' },
  { term: 'Barente', meaning: 'Move' },
  { term: 'Saba', meaning: 'Stretch' },
  { term: 'Semboo', meaning: 'Strength' },
  { term: 'Lapi', meaning: 'Beat' },
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
    pdfLink: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk&disco=AAABx461S9I',
    localImage: danceClassImage,
    duration: '4 weeks',
    lessons: 8,
    completedLessons: 0,
    isLocked: false,
    category: 'Technique',
  },
  {
    id: '2',
    title: 'Torso Development',
    description: 'Master the two-sectional body approach separating upper (torso, arms, head) and lower (pelvis, legs) with emphasis on spiral, contraction, and release.',
    notationRef: 'KATA 2A-3, Pages 13-15',
    pdfPage: 13,
    pdfLink: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk&disco=AAABy8JWcZE',
    localImage: danceClassImage,
    duration: '3 weeks',
    lessons: 6,
    completedLessons: 0,
    isLocked: false,
    category: 'Technique',
  },
  {
    id: '3',
    title: 'Foot Rhythms & Isolations',
    description: 'Develop polyrhythmic movement where feet maintain foundational rhythm while upper body layers multiple simultaneous rhythmic patterns.',
    notationRef: 'KATA 3A-3B, Page 15',
    pdfPage: 15,
    pdfLink: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk&disco=AAABy8JWcZQ',
    localImage: danceClassImage,
    duration: '3 weeks',
    lessons: 7,
    completedLessons: 0,
    isLocked: false,
    category: 'Technique',
  },
  {
    id: '4',
    title: 'Traditional Squats',
    description: 'Deep squats with core engagement rooted in African dance traditions. Build strength and flexibility through functional movement patterns.',
    notationRef: 'KATA 4-5, Pages 16-19',
    pdfPage: 16,
    pdfLink: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk&disco=AAABy8JWcZU',
    localImage: danceClassImage,
    duration: '2 weeks',
    lessons: 5,
    completedLessons: 0,
    isLocked: false,
    category: 'Technique',
  },
  {
    id: '5',
    title: 'Bala-Lapi (Mandinka) On Beat',
    description: 'Isolated polyrhythmic movements: hand circles, head/neck isolation, shoulder work, rib-cage articulation, and windmill arms with footwork.',
    notationRef: 'KATA 6-18A, Pages 21-34',
    pdfPage: 21,
    pdfLink: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk&disco=AAABy8JWcZY',
    localImage: danceClassImage,
    duration: '5 weeks',
    lessons: 12,
    completedLessons: 0,
    isLocked: false,
    category: 'Technique',
  },
  {
    id: '6',
    title: 'Semboo (Stretch & Strength)',
    description: 'Pelvic articulation with arm coordination, lunges, forward bends, lateral stretches, and flat backs with spinal rippling.',
    notationRef: 'KATA 19-19P, Pages 35-47',
    pdfPage: 35,
    pdfLink: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk&disco=AAABy8JWcZw',
    localImage: danceClassImage,
    duration: '4 weeks',
    lessons: 10,
    completedLessons: 0,
    isLocked: false,
    category: 'Technique',
  },
  {
    id: '7',
    title: 'Flat Backs with Ripples & Side Laterals',
    description: 'Spinal articulation techniques creating wave-like movements through the spine for expressive and powerful dance vocabulary.',
    notationRef: 'KATA 20-23, Pages 48-53',
    pdfPage: 48,
    pdfLink: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk&disco=AAABy8JWcaY',
    localImage: danceClassImage,
    duration: '3 weeks',
    lessons: 6,
    completedLessons: 0,
    isLocked: false,
    category: 'Technique',
  },
  {
    id: '8',
    title: 'Barente (Mandinka) or Move',
    description: 'Combined choreographic sequences integrating all learned elements into flowing combinations with 6/8 rhythmic pulse.',
    notationRef: 'KATA 24-25, Pages 54-55',
    pdfPage: 54,
    pdfLink: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk&disco=AAABy8JWcac',
    localImage: danceClassImage,
    duration: '6 weeks',
    lessons: 15,
    completedLessons: 0,
    isLocked: false,
    category: 'Technique',
  },
  {
    id: '9',
    title: 'Seven Foundational Principles',
    description: 'Study Polyrhythm, Polycentrism, Curvilinear Form, Dimensionality, Epic Memory, Repetition, and Holism from Asante\'s framework.',
    notationRef: 'Theory Section, Page 5',
    pdfPage: 5,
    pdfLink: 'https://drive.google.com/file/d/1KmXAtqxPeYkKLJiTN4Z3t-f-X4QZQ2Kv/view?usp=drivesdk&disco=AAABy8JWcbQ',
    localImage: danceClassImage,
    duration: '4 weeks',
    lessons: 7,
    completedLessons: 0,
    isLocked: false,
    category: 'Theory',
  },
];

export const mockAssignments: Assignment[] = [];

export const mockNotifications: Notification[] = [];

// Participants for feedback - will be populated when real users join
export const mockParticipants: Participant[] = [];

// Feedback messages - will be populated with real conversations
export const mockFeedbackMessages: FeedbackMessage[] = [];
