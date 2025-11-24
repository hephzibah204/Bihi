import type { UserRole } from "../types";
import { logger } from '../utils/logger';
import { 
  buildFinanceContext, 
  buildTeacherContext, 
  buildParentContext, 
  buildStudentContext,
  FinanceContext,
  TeacherContext,
  ParentContext,
  StudentContext
} from './contextBuilders';

// Enhanced question-aware context builder for AI chat
// Analyzes user questions to provide relevant dashboard/performance context

interface QuestionIntent {
  categories: string[];
  confidence: number;
  keywords: string[];
  specificMetrics: string[];
}

interface ContextData {
  dashboardContext?: any;
  performanceContext?: any;
  financeContext?: FinanceContext;
  teacherContext?: TeacherContext;
  parentContext?: ParentContext;
  studentContext?: StudentContext;
}

// Enhanced intent detection patterns with semantic groupings and synonyms
const INTENT_PATTERNS = {
  // Academic performance intents
  academic: {
    keywords: ['performance', 'scores', 'grades', 'results', 'average', 'exam', 'test', 'subject', 'class performance', 'term average', 'academic', 'marks', 'assessment', 'evaluation', 'achievement', 'progress', 'improvement', 'decline', 'ranking', 'position', 'percentile'],
    phrases: ['how are students doing', 'class performance', 'subject average', 'exam results', 'academic progress', 'student achievement', 'learning outcomes', 'grade distribution', 'top performers', 'struggling students'],
    metrics: ['termAveragePct', 'subjectAverages', 'classRanking', 'improvementTrend', 'failureRate', 'passRate']
  },
  
  // Attendance related intents
  attendance: {
    keywords: ['attendance', 'present', 'absent', 'late', 'punctuality', 'today attendance', 'attendance rate', 'absenteeism', 'truancy', 'tardiness', 'showing up', 'coming to school', 'missing', 'skipping'],
    phrases: ['who is present', 'attendance today', 'how many students present', 'attendance percentage', 'daily attendance', 'weekly attendance', 'monthly attendance', 'attendance trends', 'chronic absenteeism'],
    metrics: ['todayAttendancePct', 'weeklyAttendance', 'monthlyAttendance', 'attendanceTrend', 'chronicAbsentees', 'punctualityRate']
  },
  
  // Financial intents
  financial: {
    keywords: ['fees', 'payment', 'outstanding', 'balance', 'invoice', 'debt', 'arrears', 'financial', 'money', 'paid', 'tuition', 'billing', 'revenue', 'collection', 'defaulters', 'debtors', 'installments', 'due', 'overdue'],
    phrases: ['outstanding fees', 'fee balance', 'payment status', 'who owes fees', 'financial summary', 'fee collection', 'payment history', 'overdue payments', 'fee defaulters', 'revenue analysis'],
    metrics: ['outstandingFees', 'collectionRate', 'defaulterCount', 'revenueThisTerm', 'paymentTrends', 'feeStructure']
  },
  
  // Student count and demographics
  students: {
    keywords: ['students', 'enrollment', 'total students', 'how many', 'student count', 'new students', 'admissions', 'population', 'demographics', 'boys', 'girls', 'gender', 'age', 'class size', 'capacity'],
    phrases: ['how many students', 'total enrollment', 'student numbers', 'new admissions', 'student demographics', 'class distribution', 'gender ratio', 'age distribution', 'enrollment trends'],
    metrics: ['totalStudents', 'studentsDelta', 'newAdmissions', 'genderRatio', 'ageDistribution', 'classDistribution', 'capacityUtilization']
  },
  
  // Teacher specific intents
  teaching: {
    keywords: ['my class', 'my students', 'teaching', 'subjects I teach', 'class teacher', 'my subjects', 'lesson', 'curriculum', 'syllabus', 'assignments', 'homework', 'grading', 'classroom management'],
    phrases: ['students in my class', 'subjects I teach', 'my teaching load', 'class I manage', 'my lesson plans', 'assignments to grade', 'classroom performance', 'teaching schedule'],
    metrics: ['myClassSize', 'subjectsITeach', 'assignmentsToGrade', 'myClassAverage', 'mySubjectAverages', 'teachingLoad']
  },
  
  // Parent specific intents
  child: {
    keywords: ['my child', 'son', 'daughter', 'child performance', 'child attendance', 'child progress', 'kid', 'ward', 'behavior', 'discipline', 'homework', 'parent meeting', 'report card'],
    phrases: ['how is my child doing', 'child\'s performance', 'my child\'s grades', 'child attendance', 'behavioral issues', 'homework completion', 'parent-teacher meeting', 'child\'s progress'],
    metrics: ['childScores', 'childAttendance', 'childBehavior', 'homeworkCompletion', 'parentMeetings', 'childRanking']
  },

  // Behavioral and disciplinary intents
  behavior: {
    keywords: ['behavior', 'discipline', 'conduct', 'suspension', 'detention', 'counseling', 'incidents', 'violations', 'rules', 'policy', 'misconduct', 'good behavior', 'exemplary'],
    phrases: ['behavioral issues', 'discipline problems', 'conduct violations', 'suspension cases', 'counseling sessions', 'incident reports', 'behavioral improvement'],
    metrics: ['disciplinaryIncidents', 'suspensionCount', 'counselingSessions', 'behaviorTrends', 'goodBehaviorAwards']
  },

  // Staff and teacher management intents
  staff: {
    keywords: ['teachers', 'staff', 'faculty', 'employees', 'payroll', 'salary', 'leave', 'absence', 'training', 'professional development', 'workload', 'performance review'],
    phrases: ['teacher performance', 'staff attendance', 'payroll summary', 'leave requests', 'training programs', 'staff development', 'teacher workload'],
    metrics: ['teacherCount', 'staffAttendance', 'leaveRequests', 'trainingHours', 'performanceReviews', 'workloadDistribution']
  },

  // Infrastructure and resources intents
  resources: {
    keywords: ['facilities', 'infrastructure', 'resources', 'equipment', 'maintenance', 'library', 'laboratory', 'computers', 'books', 'supplies', 'budget', 'procurement'],
    phrases: ['facility maintenance', 'resource allocation', 'equipment status', 'library usage', 'lab equipment', 'supply inventory', 'budget utilization'],
    metrics: ['facilityStatus', 'resourceUtilization', 'maintenanceRequests', 'libraryUsage', 'equipmentInventory', 'budgetSpent']
  }
};

type BaseContext = {
  dashboardContext?: any;
  performanceContext?: any;
  activeView?: string;
  userName?: string;
};

function normalize(str?: string) {
  return (str || "").toLowerCase();
}

function pickAdminMetrics(question: string, dashboardContext: any) {
  const q = normalize(question);
  const result: Record<string, any> = { intent: "general" };

  const wantsAttendance = /(attendance|present|absent|attend)/.test(q);
  const wantsFees = /(fee|invoice|payment|outstanding|balance|arrear|tuition)/.test(q);
  const wantsStudents = /(student|enroll|admission|new\s+student|population|count)/.test(q);
  const wantsPerformance = /(score|grade|average|performance|exam|test)/.test(q);

  if (wantsAttendance && dashboardContext?.attendancePercentage != null) {
    result.attendancePercentage = dashboardContext.attendancePercentage;
    result.intent = "attendance";
  }
  if (wantsFees && dashboardContext?.outstandingFees != null) {
    result.outstandingFees = dashboardContext.outstandingFees;
    result.intent = result.intent === "general" ? "fees" : result.intent;
  }
  if (wantsStudents && dashboardContext?.totalStudents != null) {
    result.totalStudents = dashboardContext.totalStudents;
    result.intent = result.intent === "general" ? "students" : result.intent;
  }
  if (wantsPerformance && dashboardContext?.termAveragePercentage != null) {
    result.termAveragePercentage = dashboardContext.termAveragePercentage;
    result.intent = result.intent === "general" ? "performance" : result.intent;
  }

  // Include basic session/term labels for context.
  if (dashboardContext?.currentSessionLabel) {
    result.currentSessionLabel = dashboardContext.currentSessionLabel;
  }
  if (dashboardContext?.currentTermLabel) {
    result.currentTermLabel = dashboardContext.currentTermLabel;
  }

  return result;
}

function pickTeacherMetrics(question: string, performanceContext: any) {
  const q = normalize(question);
  const result: Record<string, any> = { intent: "general" };

  const wantsAttendance = /(attendance|present|absent|attend)/.test(q);
  const wantsPerformance = /(score|grade|average|performance|exam|test)/.test(q);
  const wantsClassSize = /(class\s*size|students\s*in\s*class|roster|enrollment|student\s*count)/.test(q);

  // We expect performanceContext to include class-wise or subject-wise aggregates.
  if (wantsPerformance && performanceContext?.subjectAverages) {
    result.subjectAverages = performanceContext.subjectAverages;
    result.intent = "performance";
  }
  if (wantsAttendance && performanceContext?.todayClassAttendance) {
    result.todayClassAttendance = performanceContext.todayClassAttendance;
    result.intent = result.intent === "general" ? "attendance" : result.intent;
  }
  if (wantsClassSize && performanceContext?.taughtStudentsCount != null) {
    result.taughtStudentsCount = performanceContext.taughtStudentsCount;
    result.intent = result.intent === "general" ? "students" : result.intent;
  }

  return result;
}

function pickParentMetrics(question: string, performanceContext: any) {
  const q = normalize(question);
  const result: Record<string, any> = { intent: "general" };

  const wantsAttendance = /(attendance|present|absent|attend)/.test(q);
  const wantsPerformance = /(score|grade|average|performance|exam|test)/.test(q);

  if (wantsPerformance && performanceContext?.childRecentScores) {
    result.childRecentScores = performanceContext.childRecentScores;
    result.intent = "performance";
  }
  if (wantsAttendance && performanceContext?.childAttendanceToday != null) {
    result.childAttendanceToday = performanceContext.childAttendanceToday;
    result.intent = result.intent === "performance" ? "performance_attendance" : "attendance";
  }

  return result;
}

function pickBursarMetrics(question: string, performanceContext: any, dashboardContext: any) {
  const q = normalize(question);
  const result: Record<string, any> = { intent: "general" };
  const wantsFees = /(fee|invoice|payment|outstanding|balance|arrear|tuition)/.test(q);

  // Prefer finance-only metrics; avoid academic metrics.
  if (wantsFees) {
    if (performanceContext?.financeSummaries) {
      result.financeSummaries = performanceContext.financeSummaries;
      result.intent = "fees";
    } else if (dashboardContext?.outstandingFees != null) {
      // Only include if already available in local context due to admin view.
      result.outstandingFees = dashboardContext.outstandingFees;
      result.intent = "fees";
    }
  }

  return result;
}

// Enhanced semantic similarity function
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  // Jaccard similarity
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// Enhanced intent analysis with semantic matching and confidence scoring
export function analyzeQuestionIntent(question: string): QuestionIntent {
  const lowerQuestion = question.toLowerCase();
  const categories: string[] = [];
  const matchedKeywords: string[] = [];
  const specificMetrics: string[] = [];
  let totalConfidence = 0;

  // Check each intent category
  Object.entries(INTENT_PATTERNS).forEach(([category, pattern]) => {
    let categoryScore = 0;
    const categoryKeywords: string[] = [];

    // Direct keyword matching (weight: 1)
    pattern.keywords.forEach(keyword => {
      if (lowerQuestion.includes(keyword.toLowerCase())) {
        categoryScore += 1;
        categoryKeywords.push(keyword);
      }
    });

    // Phrase matching with semantic similarity (weight: 2-3)
    pattern.phrases.forEach(phrase => {
      const similarity = calculateSimilarity(lowerQuestion, phrase);
      if (similarity > 0.3) { // 30% similarity threshold
        const weight = similarity > 0.6 ? 3 : 2; // Higher weight for better matches
        categoryScore += weight;
        categoryKeywords.push(phrase);
      }
    });

    // Context-aware metric detection
    if (pattern.metrics) {
      pattern.metrics.forEach(metric => {
        // Check if question implies need for this specific metric
        const metricKeywords = {
          'termAveragePct': ['average', 'performance', 'overall'],
          'todayAttendancePct': ['today', 'attendance', 'present'],
          'outstandingFees': ['outstanding', 'owe', 'balance', 'unpaid'],
          'totalStudents': ['how many', 'total', 'count', 'number'],
          'myClassSize': ['my class', 'students in my', 'class size'],
          'childScores': ['my child', 'child performance', 'grades']
        };

        const keywords = metricKeywords[metric] || [];
        const hasMetricKeywords = keywords.some(kw => lowerQuestion.includes(kw));
        if (hasMetricKeywords) {
          specificMetrics.push(metric);
          categoryScore += 0.5; // Bonus for specific metric relevance
        }
      });
    }

    // Contextual boosting based on question structure
    if (lowerQuestion.includes('?')) categoryScore += 0.5; // Question format
    if (lowerQuestion.includes('how')) categoryScore += 0.5; // How questions
    if (lowerQuestion.includes('what')) categoryScore += 0.5; // What questions
    if (lowerQuestion.includes('show me') || lowerQuestion.includes('tell me')) categoryScore += 0.5; // Direct requests

    // If category has sufficient matches, include it
    if (categoryScore >= 1) {
      categories.push(category);
      matchedKeywords.push(...categoryKeywords);
      totalConfidence += categoryScore;
    }
  });

  // Advanced confidence calculation with diminishing returns
  const baseConfidence = Math.min(totalConfidence / 15, 1);
  const categoryBonus = Math.min(categories.length * 0.1, 0.3); // Bonus for multiple relevant categories
  const confidence = Math.min(baseConfidence + categoryBonus, 1);

  return {
    categories,
    confidence,
    keywords: [...new Set(matchedKeywords)],
    specificMetrics: [...new Set(specificMetrics)]
  };
}

export function buildQuestionFocusContext(
  question: string,
  userRole: UserRole,
  dashboardContext: string,
  performanceContext: string
): string {
  const intent = analyzeQuestionIntent(question);
  
  // If confidence is too low, return minimal context
  if (intent.confidence < 0.2) {
    return `Question intent unclear (confidence: ${intent.confidence.toFixed(2)}). Available context: role=${userRole}`;
  }

  const contextData: ContextData = {};
  
  // Parse existing contexts safely with enhanced extraction
  try {
    if (dashboardContext) {
      const match = dashboardContext.match(/\{.*\}/);
      if (match) {
        contextData.dashboardContext = JSON.parse(match[0]);
      }
    }
    
    if (performanceContext) {
      const match = performanceContext.match(/\{.*\}/);
      if (match) {
        contextData.performanceContext = JSON.parse(match[0]);
      }
    }
  } catch (e) {
    // Enhanced fallback parsing for string contexts
    contextData.dashboardContext = dashboardContext;
    contextData.performanceContext = performanceContext;
  }

  // Build role-specific structured contexts
  contextData.financeContext = buildFinanceContext(contextData.dashboardContext, contextData.performanceContext, userRole);
  contextData.teacherContext = buildTeacherContext(contextData.dashboardContext, contextData.performanceContext, userRole);
  contextData.parentContext = buildParentContext(contextData.dashboardContext, contextData.performanceContext, userRole);
  contextData.studentContext = buildStudentContext(contextData.dashboardContext, contextData.performanceContext, userRole);

  const focusedContext: any = {
    userRole,
    questionIntent: {
      categories: intent.categories,
      confidence: intent.confidence,
      keywords: intent.keywords,
      specificMetrics: intent.specificMetrics
    },
    timestamp: new Date().toISOString()
  };

  // Enhanced role-specific context building with granular data extraction
  intent.categories.forEach(category => {
    switch (category) {
      case 'academic':
        if (userRole === 'Admin' || userRole === 'Super Admin') {
          if (contextData.dashboardContext?.academics) {
            focusedContext.academics = {
              termAverage: contextData.dashboardContext.academics.termAveragePct,
              trend: 'stable', // Could be calculated from historical data
              subjectBreakdown: contextData.performanceContext || 'Not available'
            };
          }
        } else if (userRole === 'Teacher') {
          focusedContext.teacherAcademics = {
            classPerformance: contextData.performanceContext,
            mySubjects: extractTeacherSubjects(contextData.performanceContext),
            averages: extractSubjectAverages(contextData.performanceContext)
          };
        } else if (userRole === 'Parent' || userRole === 'Student') {
          focusedContext.studentAcademics = {
            recentScores: contextData.performanceContext,
            performance: extractStudentPerformance(contextData.performanceContext)
          };
        }
        break;

      case 'attendance':
        if (userRole === 'Admin' || userRole === 'Super Admin') {
          if (contextData.dashboardContext?.attendance) {
            focusedContext.attendance = {
              today: contextData.dashboardContext.attendance.todayAttendancePct,
              trend: 'improving', // Could be calculated
              details: `${contextData.dashboardContext.attendance.todayAttendancePct}% present today`
            };
          }
        } else if (userRole === 'Teacher') {
          focusedContext.classAttendance = extractClassAttendance(contextData.performanceContext);
        } else if (userRole === 'Parent') {
          focusedContext.childAttendance = extractChildAttendance(contextData.performanceContext);
        }
        break;

      case 'financial':
        if (userRole === 'Admin' || userRole === 'Super Admin' || userRole === 'Bursar') {
          if (contextData.financeContext) {
            focusedContext.finance = contextData.financeContext;
          } else if (contextData.dashboardContext?.finance) {
            focusedContext.finance = {
              outstanding: contextData.dashboardContext.finance.outstandingFees,
              currency: 'NGN',
              breakdown: 'Term fees and other charges',
              collectionRate: calculateCollectionRate(contextData.dashboardContext.finance)
            };
          }
        }
        break;

      case 'students':
        if (userRole === 'Admin' || userRole === 'Super Admin') {
          if (contextData.dashboardContext?.totals) {
            focusedContext.studentTotals = {
              total: contextData.dashboardContext.totals.totalStudents,
              delta: contextData.dashboardContext.totals.studentsDelta,
              trend: contextData.dashboardContext.totals.studentsDelta > 0 ? 'growing' : 'stable',
              demographics: 'Mixed gender distribution' // Could be calculated
            };
          }
        } else if (userRole === 'Teacher') {
          focusedContext.myStudents = extractTeacherStudentCount(contextData.performanceContext);
        }
        break;

      case 'teaching':
        if (userRole === 'Teacher') {
          if (contextData.teacherContext) {
            focusedContext.teachingContext = contextData.teacherContext;
          } else {
            focusedContext.teachingContext = {
              subjects: extractTeacherSubjects(contextData.performanceContext),
              classSize: extractTeacherStudentCount(contextData.performanceContext),
              performance: extractSubjectAverages(contextData.performanceContext),
              workload: 'Normal'
            };
          }
        }
        break;

      case 'child':
        if (userRole === 'Parent') {
          if (contextData.parentContext) {
            focusedContext.childContext = contextData.parentContext;
          } else {
            focusedContext.childContext = {
              performance: extractStudentPerformance(contextData.performanceContext),
              attendance: extractChildAttendance(contextData.performanceContext),
              behavior: 'Good',
              recentActivity: 'Regular class participation'
            };
          }
        } else if (userRole === 'Student') {
          if (contextData.studentContext) {
            focusedContext.studentContext = contextData.studentContext;
          } else {
            focusedContext.studentContext = {
              performance: extractStudentPerformance(contextData.performanceContext),
              attendance: extractChildAttendance(contextData.performanceContext),
              behavior: 'Good',
              recentActivity: 'Regular class participation'
            };
          }
        }
        break;

      case 'behavior':
        if (userRole === 'Admin' || userRole === 'Super Admin') {
          focusedContext.behaviorOverview = {
            incidents: 'Low', // Could be from disciplinary records
            trend: 'Improving',
            interventions: 'Counseling programs active'
          };
        } else if (userRole === 'Teacher') {
          focusedContext.classBehavior = {
            myClassBehavior: 'Generally good',
            incidents: 'Minimal',
            interventions: 'Positive reinforcement'
          };
        } else if (userRole === 'Parent') {
          focusedContext.childBehavior = {
            status: 'Good',
            recentIncidents: 'None',
            teacherFeedback: 'Positive'
          };
        }
        break;

      case 'staff':
        if (userRole === 'Admin' || userRole === 'Super Admin') {
          focusedContext.staffOverview = {
            totalTeachers: 'Available in staff records',
            attendance: 'Good',
            training: 'Ongoing professional development',
            performance: 'Meeting expectations'
          };
        }
        break;

      case 'resources':
        if (userRole === 'Admin' || userRole === 'Super Admin') {
          focusedContext.resourceStatus = {
            facilities: 'Well maintained',
            equipment: 'Functional',
            budget: 'Within limits',
            maintenance: 'Scheduled'
          };
        }
        break;
    }
  });

  // Add specific metric data if requested
  if (intent.specificMetrics.length > 0) {
    focusedContext.requestedMetrics = {};
    intent.specificMetrics.forEach(metric => {
      focusedContext.requestedMetrics[metric] = extractSpecificMetric(metric, contextData, userRole);
    });
  }

  return JSON.stringify(focusedContext, null, 2);
}

// Helper functions for data extraction
function extractTeacherSubjects(performanceContext: any): string[] {
  if (typeof performanceContext === 'string') {
    const match = performanceContext.match(/Teaching subjects: ([^.]+)/);
    return match ? match[1].split(', ').filter(Boolean) : [];
  }
  return [];
}

function extractSubjectAverages(performanceContext: any): any {
  if (typeof performanceContext === 'string') {
    try {
      const match = performanceContext.match(/Class performance overview: (\{.*\})/);
      if (match) {
        const data = JSON.parse(match[1]);
        return data;
      }
    } catch (e) {
      return 'Performance data parsing error';
    }
  }
  return {};
}

function extractStudentPerformance(performanceContext: any): any {
  if (typeof performanceContext === 'string') {
    try {
      const match = performanceContext.match(/Recent performance: (\[.*\])/);
      if (match) {
        const data = JSON.parse(match[1]);
        return data;
      }
    } catch (e) {
      return 'Student performance data parsing error';
    }
  }
  return {};
}

function extractTeacherStudentCount(performanceContext: any): number {
  if (typeof performanceContext === 'string') {
    try {
      const match = performanceContext.match(/Class performance overview: (\{.*\})/);
      if (match) {
        const data = JSON.parse(match[1]);
        const obj = data as Record<string, any>;
        return Object.values(obj).reduce((total: number, classData: any) => 
          total + (classData?.studentCount ?? 0), 0);
      }
    } catch (e) {
      return 0;
    }
  }
  return 0;
}

function extractClassAttendance(performanceContext: any): string {
  return 'Class attendance data not available in current context';
}

function extractChildAttendance(performanceContext: any): string {
  return 'Child attendance data not available in current context';
}

function calculateCollectionRate(financeData: any): string {
  if (financeData && financeData.outstandingFees) {
    return 'Collection rate calculation requires additional data';
  }
  return 'N/A';
}

function extractSpecificMetric(metric: string, contextData: ContextData, userRole: UserRole): any {
  switch (metric) {
    case 'termAveragePct':
      return contextData.dashboardContext?.academics?.termAveragePct || 'Not available';
    case 'todayAttendancePct':
      return contextData.dashboardContext?.attendance?.todayAttendancePct || 'Not available';
    case 'outstandingFees':
      return contextData.dashboardContext?.finance?.outstandingFees || 'Not available';
    case 'totalStudents':
      return contextData.dashboardContext?.totals?.totalStudents || 'Not available';
    case 'myClassSize':
      return extractTeacherStudentCount(contextData.performanceContext);
    case 'childScores':
      return extractStudentPerformance(contextData.performanceContext);
    default:
      // Handle unknown metrics gracefully
      logger.warn(`Unknown metric requested: ${metric}`);
      return `Metric "${metric}" is not available. Please try a different metric or contact support.`;
  }
}