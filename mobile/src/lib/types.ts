// AFeeree Certification Program Types

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  enrollmentDate: string;
  certificationLevel: 'Foundation' | 'Intermediate' | 'Advanced' | 'Master';
  progress: number; // 0-100
  role: 'student' | 'instructor' | 'admin';
}

export interface FeedbackMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'instructor' | 'admin';
  recipientId: string;
  recipientName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  certificationLevel: 'Foundation' | 'Intermediate' | 'Advanced' | 'Master';
  progress: number;
  lastActive: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  localImage?: any;
  notationRef?: string;
  pdfPage?: number;
  pdfLink?: string;
  duration: string;
  lessons: number;
  completedLessons: number;
  isLocked: boolean;
  category: 'Technique' | 'Theory' | 'Teaching Practice' | 'Research';
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  moduleName: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded' | 'resubmit';
  submittedDate?: string;
  grade?: string;
  feedback?: string;
  type: 'video' | 'document' | 'teaching_demo' | 'reflection';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'assignment' | 'grade' | 'announcement' | 'reminder';
}
