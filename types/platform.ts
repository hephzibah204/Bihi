// Platform and Tenant Management Types

export interface Tenant {
  id: string;
  name: string;
  planId?: string;
  subscriptionStatus?: 'trial' | 'active' | 'expired' | 'unsubscribed';
  trialEndDate?: string;
  subscriptionExpiryDate?: string;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_termly: number;
  price_yearly: number;
  features: {
    maxStudents: number;
    [key: string]: boolean | number;
  };
}

// Feature Control Types
export interface ControllableFeature {
  key: string;
  name: string;
  description: string;
  applicableRoles: string[];
  category: string;
}

// Dashboard View Types
export type DashboardView = 
  | 'dashboard' | 'students' | 'student-profile' | 'subjects' | 'results' 
  | 'report-cards' | 'comprehensive-entry' | 'promotions' | 'attendance' | 'settings'
  | 'bursary' | 'communications' | 'ai-tools' | 'analytics' | 'alumni' | 'staff'
  | 'parents' | 'timetable' | 'id-cards' | 'behavioral-remarks' | 'general-remarks'
  | 'help' | 'resource-hub' | 'billing' | 'more' | 'events' | 'absence-management'
  | 'platform-settings' | 'users' | 'pages' | 'menus' | 'blog-articles' | 'kb-articles';
  
export type TeacherView = 
  | 'dashboard' | 'my-students' | 'enter-scores' | 'my-schedule' | 'ai-tools'
  | 'resource-hub' | 'my-payslips' | 'help' | 'more' | 'assignments' | 'behavioral';
  
export type StudentView = 
  | 'dashboard' | 'results' | 'assignments' | 'timetable' | 'ai-tools'
  | 'profile' | 'notifications' | 'transcript' | 'ai-tutor';
  
export type ParentView = 
  | 'dashboard' | 'results' | 'fees' | 'attendance' | 'behavioral'
  | 'assignments' | 'messages' | 'profile' | 'events' | 'report-absence';

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  type: string;
  description: string;
}

// Broadcast Notifications model for platform settings
export type BroadcastChannel = 'banner' | 'toast' | 'modal';
export type BroadcastType = 'info' | 'success' | 'warning' | 'error';

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  type: BroadcastType;
  channel: BroadcastChannel;
  roles?: string[]; // audience; omit or include 'all' means everyone
  tenants?: string[]; // subdomains/tenant ids; omit or include 'all' means all tenants
  startAt?: string; // ISO timestamp
  endAt?: string;   // ISO timestamp
  dismissible?: boolean;
  createdBy?: string;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
  // CTAs
  ctaText?: string;
  ctaUrl?: string;
  ctaByRole?: Record<string, { text: string; url: string }>;
  // Repeat behavior
  repeat?: 'always' | 'once' | 'daily' | 'weekly';
}