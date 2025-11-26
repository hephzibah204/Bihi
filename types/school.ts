// School-specific types for landing pages and admission management

export interface SchoolInfo {
  id: string;
  name: string;
  slug: string;
  motto?: string;
  description?: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  established?: string;
  principalName?: string;
  principalMessage?: string;
  stats?: {
    students: string;
    teachers: string;
    yearsOfExcellence: string;
    graduationRate: string;
    achievements?: string[];
  };
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  landing_page_content?: SchoolLandingPageContent;
  admission_settings?: AdmissionSettings;
  created_at?: string;
  updated_at?: string;
}

export interface SchoolLandingPageContent {
  hero: {
    title: string;
    subtitle: string;
    backgroundImage?: string;
    ctaText?: string;
    secondaryCtaText?: string;
  };
  about: {
    title: string;
    description: string;
    image?: string;
    mission?: string;
    vision?: string;
    values?: string[];
  };
  programs: {
    title: string;
    subtitle: string;
    programs: AcademicProgram[];
  };
  facilities: {
    title: string;
    subtitle: string;
    facilities: Facility[];
  };
  testimonials: {
    title: string;
    testimonials: Testimonial[];
  };
  contact: {
    title: string;
    subtitle: string;
    mapEmbedUrl?: string;
  };
  gallery?: {
    title: string;
    images: GalleryImage[];
  };
  news?: {
    title: string;
    articles: NewsArticle[];
  };
  achievements?: {
    title: string;
    achievements: Achievement[];
  };
  staff?: {
    title: string;
    subtitle: string;
    featured: StaffMember[];
  };
}

export interface AcademicProgram {
  id?: string;
  name: string;
  description: string;
  ageRange: string;
  duration: string;
  image?: string;
  subjects?: string[];
  features?: string[];
  tuitionFee?: string;
}

export interface Facility {
  id?: string;
  name: string;
  description: string;
  icon: string;
  image?: string;
  capacity?: string;
}

export interface Testimonial {
  id?: string;
  name: string;
  role: string;
  content: string;
  avatar?: string;
  rating?: number;
  graduationYear?: string;
}

export interface GalleryImage {
  id?: string;
  url: string;
  caption: string;
  category: 'campus' | 'events' | 'activities' | 'achievements';
}

export interface NewsArticle {
  id?: string;
  title: string;
  excerpt: string;
  content?: string;
  image?: string;
  publishDate: string;
  author?: string;
  category?: string;
}

export interface Achievement {
  id?: string;
  title: string;
  description: string;
  date: string;
  image?: string;
  category: 'academic' | 'sports' | 'arts' | 'community';
}

export interface StaffMember {
  id?: string;
  name: string;
  position: string;
  department: string;
  bio?: string;
  image?: string;
  qualifications?: string[];
  experience?: string;
}

export interface AdmissionSettings {
  isOpen: boolean;
  applicationDeadline?: string;
  academicYear: string;
  availableClasses: string[];
  requirements: AdmissionRequirement[];
  fees: AdmissionFee[];
  documents: RequiredDocument[];
  process: AdmissionStep[];
  contactInfo: {
    admissionOfficer: string;
    phone: string;
    email: string;
    officeHours: string;
  };
}

export interface AdmissionRequirement {
  id?: string;
  class: string;
  ageRange: string;
  requirements: string[];
  entrance_exam?: boolean;
  interview?: boolean;
}

export interface AdmissionFee {
  id?: string;
  class: string;
  registrationFee: number;
  tuitionFee: number;
  developmentFee?: number;
  uniformFee?: number;
  booksFee?: number;
  totalFee: number;
}

export interface RequiredDocument {
  id?: string;
  name: string;
  description: string;
  required: boolean;
  applicableClasses: string[];
}

export interface AdmissionStep {
  id?: string;
  step: number;
  title: string;
  description: string;
  duration?: string;
}

export interface AdmissionApplication {
  id: string;
  school_id: string;
  // Student Information
  student: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: string;
    gender: 'Male' | 'Female';
    nationality: string;
    stateOfOrigin?: string;
    religion?: string;
    bloodGroup?: string;
    medicalConditions?: string;
    previousSchool?: string;
    classApplyingFor: string;
  };
  // Parent/Guardian Information
  parent: {
    title: string;
    firstName: string;
    lastName: string;
    relationship: 'Father' | 'Mother' | 'Guardian';
    occupation: string;
    employer?: string;
    phone: string;
    email: string;
    address: string;
    alternativeContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  // Application Details
  applicationDetails: {
    preferredStartDate: string;
    hasSpecialNeeds: boolean;
    specialNeedsDescription?: string;
    previousSchoolRecords?: boolean;
    reasonForApplication?: string;
    howDidYouHearAboutUs?: string;
    referredBy?: string;
  };
  // Documents
  documents: {
    birthCertificate?: string;
    passportPhotograph?: string;
    previousSchoolRecords?: string;
    medicalRecords?: string;
    parentId?: string;
    additionalDocuments?: { name: string; url: string }[];
  };
  // Application Status
  status: 'submitted' | 'under_review' | 'interview_scheduled' | 'accepted' | 'rejected' | 'waitlisted';
  submissionDate: string;
  reviewDate?: string;
  interviewDate?: string;
  decisionDate?: string;
  notes?: string;
  reviewedBy?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SchoolDashboardStats {
  totalApplications: number;
  pendingReview: number;
  acceptedApplications: number;
  rejectedApplications: number;
  interviewsScheduled: number;
  recentApplications: AdmissionApplication[];
  applicationsByClass: { class: string; count: number }[];
  applicationsByMonth: { month: string; count: number }[];
}

// Landing Page Builder Types
export interface LandingPageTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'modern' | 'classic' | 'creative' | 'minimal';
  sections: string[];
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export interface PageSection {
  id: string;
  type: 'hero' | 'about' | 'programs' | 'facilities' | 'testimonials' | 'contact' | 'gallery' | 'news' | 'custom';
  title: string;
  enabled: boolean;
  order: number;
  settings: Record<string, any>;
}

export interface SchoolTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadows: boolean;
}