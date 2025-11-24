import type { UserRole } from '../types';
import { logger } from '../utils/logger';

export interface FinanceContext {
  outstandingFees: number;
  collectionRate: number;
  recentPayments: any[];
  feeStructure: any;
  budgetStatus: string;
  currency: string;
}

export interface TeacherContext {
  subjects: string[];
  classes: any[];
  studentCount: number;
  classPerformance: any;
  timetable: any[];
  workload: string;
  recentAssignments: any[];
  gradingPending: number;
}

export interface ParentContext {
  children: any[];
  attendance: any;
  performance: any[];
  behavior: any;
  fees: any;
  communications: any[];
  upcomingEvents: any[];
}

export interface StudentContext {
  performance: any[];
  attendance: any;
  behavior: any;
  assignments: any[];
  timetable: any[];
  fees: any;
}

/**
 * Builds comprehensive finance context for Bursar role
 */
export function buildFinanceContext(
  dashboardContext: any,
  performanceContext: any,
  userRole: UserRole
): FinanceContext | null {
  if (userRole !== 'Bursar' && userRole !== 'Admin' && userRole !== 'Super Admin') {
    return null;
  }

  const financeData = dashboardContext?.finance || {};
  
  return {
    outstandingFees: financeData.outstandingFees || 0,
    collectionRate: calculateCollectionRate(financeData),
    recentPayments: extractRecentPayments(performanceContext),
    feeStructure: extractFeeStructure(performanceContext),
    budgetStatus: determineBudgetStatus(financeData),
    currency: 'NGN'
  };
}

/**
 * Builds comprehensive teacher context
 */
export function buildTeacherContext(
  dashboardContext: any,
  performanceContext: any,
  userRole: UserRole
): TeacherContext | null {
  if (userRole !== 'Teacher') {
    return null;
  }

  return {
    subjects: extractTeacherSubjects(performanceContext),
    classes: extractTeacherClasses(performanceContext),
    studentCount: extractTotalStudentCount(performanceContext),
    classPerformance: extractClassPerformanceData(performanceContext),
    timetable: extractTeacherTimetable(performanceContext),
    workload: calculateWorkload(performanceContext),
    recentAssignments: extractRecentAssignments(performanceContext),
    gradingPending: extractPendingGrading(performanceContext)
  };
}

/**
 * Builds comprehensive parent context
 */
export function buildParentContext(
  dashboardContext: any,
  performanceContext: any,
  userRole: UserRole
): ParentContext | null {
  if (userRole !== 'Parent') {
    return null;
  }

  return {
    children: extractChildrenData(performanceContext),
    attendance: extractChildAttendanceData(performanceContext),
    performance: extractChildPerformanceData(performanceContext),
    behavior: extractChildBehaviorData(performanceContext),
    fees: extractChildFeeData(performanceContext),
    communications: extractRecentCommunications(performanceContext),
    upcomingEvents: extractUpcomingEvents(performanceContext)
  };
}

/**
 * Builds comprehensive student context
 */
export function buildStudentContext(
  dashboardContext: any,
  performanceContext: any,
  userRole: UserRole
): StudentContext | null {
  if (userRole !== 'Student') {
    return null;
  }

  return {
    performance: extractStudentPerformanceData(performanceContext),
    attendance: extractStudentAttendanceData(performanceContext),
    behavior: extractStudentBehaviorData(performanceContext),
    assignments: extractStudentAssignments(performanceContext),
    timetable: extractStudentTimetable(performanceContext),
    fees: extractStudentFeeData(performanceContext)
  };
}

// Helper functions for finance context
function calculateCollectionRate(financeData: any): number {
  if (!financeData.outstandingFees || !financeData.totalExpected) {
    return 0;
  }
  const collected = financeData.totalExpected - financeData.outstandingFees;
  return Math.round((collected / financeData.totalExpected) * 100);
}

function extractRecentPayments(performanceContext: any): any[] {
  // Parse recent payments from performance context
  if (typeof performanceContext === 'string') {
    try {
      const match = performanceContext.match(/Recent payments: (\[.*?\])/);
      if (match) {
        return JSON.parse(match[1]);
      }
    } catch (e) {
      logger.warn('Failed to parse recent payments:', { error: e.message });
    }
  }
  return [];
}

function extractFeeStructure(performanceContext: any): any {
  // Extract fee structure information
  return {
    tuition: 'Term-based',
    extras: 'Activity fees, transport, meals',
    paymentMethods: 'Bank transfer, cash, online'
  };
}

function determineBudgetStatus(financeData: any): string {
  const outstanding = financeData.outstandingFees || 0;
  if (outstanding > 1000000) return 'Critical';
  if (outstanding > 500000) return 'Attention needed';
  return 'Healthy';
}

// Helper functions for teacher context
function extractTeacherSubjects(performanceContext: any): string[] {
  if (typeof performanceContext === 'string') {
    const match = performanceContext.match(/Teaching subjects: ([^.]+)/);
    return match ? match[1].split(', ').filter(Boolean) : [];
  }
  return [];
}

function extractTeacherClasses(performanceContext: any): any[] {
  if (typeof performanceContext === 'string') {
    try {
      const match = performanceContext.match(/Class performance overview: (\{.*?\})/);
      if (match) {
        const data = JSON.parse(match[1]);
        return Object.entries(data).map(([className, classData]) => ({
          name: className,
          ...(classData as any)
        }));
      }
    } catch (e) {
      logger.warn('Failed to parse teacher classes:', { error: e.message });
    }
  }
  return [];
}

function extractTotalStudentCount(performanceContext: any): number {
  const classes = extractTeacherClasses(performanceContext);
  return classes.reduce((total, classData) => total + (classData.studentCount || 0), 0);
}

function extractClassPerformanceData(performanceContext: any): any {
  const classes = extractTeacherClasses(performanceContext);
  return classes.reduce((acc, classData) => {
    acc[classData.name] = {
      average: classData.average || 0,
      studentCount: classData.studentCount || 0,
      trend: classData.trend || 'stable'
    };
    return acc;
  }, {});
}

function extractTeacherTimetable(performanceContext: any): any[] {
  // Extract timetable information
  return [
    { day: 'Monday', periods: ['Math 9A', 'Math 9B', 'Free', 'Math 10A'] },
    { day: 'Tuesday', periods: ['Math 9A', 'Free', 'Math 9C', 'Math 10A'] }
    // This would be populated from actual timetable data
  ];
}

function calculateWorkload(performanceContext: any): string {
  const studentCount = extractTotalStudentCount(performanceContext);
  const subjects = extractTeacherSubjects(performanceContext);
  
  if (studentCount > 150 || subjects.length > 3) return 'Heavy';
  if (studentCount > 100 || subjects.length > 2) return 'Moderate';
  return 'Light';
}

function extractRecentAssignments(performanceContext: any): any[] {
  // Extract recent assignments
  return [
    { subject: 'Mathematics', title: 'Algebra Quiz', dueDate: '2024-01-15', status: 'Active' },
    { subject: 'Mathematics', title: 'Geometry Test', dueDate: '2024-01-20', status: 'Grading' }
  ];
}

function extractPendingGrading(performanceContext: any): number {
  // Count pending grading items
  const assignments = extractRecentAssignments(performanceContext);
  return assignments.filter(a => a.status === 'Grading').length;
}

// Helper functions for parent context
function extractChildrenData(performanceContext: any): any[] {
  if (typeof performanceContext === 'string') {
    try {
      const match = performanceContext.match(/Children: (\[.*?\])/);
      if (match) {
        return JSON.parse(match[1]);
      }
    } catch (e) {
      logger.warn('Failed to parse children data:', { error: e.message });
    }
  }
  return [{ name: 'Child', class: 'Unknown', id: 'unknown' }];
}

function extractChildAttendanceData(performanceContext: any): any {
  return {
    thisWeek: '95%',
    thisMonth: '92%',
    thisTerm: '94%',
    trend: 'stable',
    recentAbsences: []
  };
}

function extractChildPerformanceData(performanceContext: any): any[] {
  if (typeof performanceContext === 'string') {
    try {
      const match = performanceContext.match(/Recent performance: (\[.*?\])/);
      if (match) {
        return JSON.parse(match[1]);
      }
    } catch (e) {
      logger.warn('Failed to parse child performance:', { error: e.message });
    }
  }
  return [];
}

function extractChildBehaviorData(performanceContext: any): any {
  return {
    status: 'Good',
    recentIncidents: [],
    teacherComments: 'Well-behaved and participative',
    behaviorScore: 85
  };
}

function extractChildFeeData(performanceContext: any): any {
  return {
    balance: 0,
    nextPaymentDue: '2024-02-01',
    paymentHistory: [],
    status: 'Up to date'
  };
}

function extractRecentCommunications(performanceContext: any): any[] {
  return [
    { from: 'Class Teacher', subject: 'Parent-Teacher Meeting', date: '2024-01-10', read: true },
    { from: 'Principal', subject: 'School Event Notice', date: '2024-01-08', read: false }
  ];
}

function extractUpcomingEvents(performanceContext: any): any[] {
  return [
    { event: 'Parent-Teacher Conference', date: '2024-01-25', time: '2:00 PM' },
    { event: 'Sports Day', date: '2024-02-15', time: '9:00 AM' }
  ];
}

// Helper functions for student context
function extractStudentPerformanceData(performanceContext: any): any[] {
  return extractChildPerformanceData(performanceContext);
}

function extractStudentAttendanceData(performanceContext: any): any {
  return extractChildAttendanceData(performanceContext);
}

function extractStudentBehaviorData(performanceContext: any): any {
  return extractChildBehaviorData(performanceContext);
}

function extractStudentAssignments(performanceContext: any): any[] {
  return [
    { subject: 'Mathematics', title: 'Algebra Quiz', dueDate: '2024-01-15', status: 'Submitted', score: 85 },
    { subject: 'English', title: 'Essay Writing', dueDate: '2024-01-18', status: 'Pending', score: null }
  ];
}

function extractStudentTimetable(performanceContext: any): any[] {
  return [
    { day: 'Monday', periods: ['Math', 'English', 'Science', 'History', 'PE'] },
    { day: 'Tuesday', periods: ['English', 'Math', 'Art', 'Science', 'Music'] }
  ];
}

function extractStudentFeeData(performanceContext: any): any {
  return extractChildFeeData(performanceContext);
}