// services/fallbackTimetableService.ts
// Constraint-based timetable generation for when AI services are unavailable

export interface Teacher {
    id: string;
    name: string;
}

export interface Subject {
    id: string;
    name: string;
    classes: string[];
}

export interface TimeSlot {
    id: string;
    label: string;
}

export interface TimetableEntry {
    subjectId: string;
    teacherId: string;
}

export interface Timetable {
    [className: string]: {
        [day: string]: {
            [timeSlot: string]: TimetableEntry;
        };
    };
}

export class FallbackTimetableGenerator {
    private readonly teachers: Teacher[];
    private readonly subjects: Subject[];
    private readonly classes: string[];
    private readonly days: string[];
    private readonly timeSlots: TimeSlot[];
    
    // Track assignments to detect conflicts
    private readonly teacherAssignments: Map<string, Set<string>> = new Map(); // key: "teacher_day_slot"
    private readonly classAssignments: Map<string, Set<string>> = new Map(); // key: "class_day_slot"
    
    constructor(
        teachers: Teacher[],
        subjects: Subject[],
        classes: string[],
        days: string[],
        timeSlots: TimeSlot[]
    ) {
        this.teachers = teachers;
        this.subjects = subjects;
        this.classes = classes;
        this.days = days;
        this.timeSlots = timeSlots;
    }

    /**
     * Generate a complete timetable using constraint-based scheduling
     */
    public generate(): Timetable {
        const timetable: Timetable = {};
        
        // Initialize empty timetable for all classes
        for (const className of this.classes) {
            timetable[className] = {};
            for (const day of this.days) {
                timetable[className][day] = {};
            }
        }

        // Group subjects by class for distribution
        const subjectsByClass = this.groupSubjectsByClass();

        // For each class, assign subjects across the week
        for (const className of this.classes) {
            const classSubjects = subjectsByClass.get(className) || [];
            this.assignSubjectsToClass(className, classSubjects, timetable);
        }

        return timetable;
    }

    /**
     * Group subjects by class
     */
    private groupSubjectsByClass(): Map<string, Subject[]> {
        const grouped = new Map<string, Subject[]>();

        for (const subject of this.subjects) {
            for (const className of subject.classes) {
                if (!grouped.has(className)) {
                    grouped.set(className, []);
                }
                grouped.get(className)!.push(subject);
            }
        }

        return grouped;
    }

    /**
     * Assign subjects to a class across the week
     */
    private assignSubjectsToClass(
        className: string,
        subjects: Subject[],
        timetable: Timetable
    ): void {
        // Calculate how many slots needed per subject
        const totalSlots = this.days.length * this.timeSlots.length;
        const slotsPerSubject = this.calculateSlotsPerSubject(subjects.length, totalSlots);

        // Priority subjects get more slots
        const prioritySubjects = this.identifyPrioritySubjects(subjects);
        
        let subjectIndex = 0;
        let assignedSlots = 0;

        // Distribute subjects across days and time slots
        for (const day of this.days) {
            for (const timeSlot of this.timeSlots) {
                if (subjectIndex >= subjects.length) {
                    subjectIndex = 0; // Loop back to start
                }

                const subject = subjects[subjectIndex];
                const teacher = this.findAvailableTeacher(subject, className, day, timeSlot.label);

                if (teacher) {
                    timetable[className][day][timeSlot.label] = {
                        subjectId: subject.id,
                        teacherId: teacher.id
                    };

                    // Mark as assigned
                    this.markAssignment(teacher.id, className, day, timeSlot.label);
                    assignedSlots++;

                    // Move to next subject based on distribution
                    if (assignedSlots >= slotsPerSubject[subjectIndex]) {
                        subjectIndex++;
                        assignedSlots = 0;
                    }
                }
            }
        }
    }

    /**
     * Calculate how many slots each subject should get
     */
    private calculateSlotsPerSubject(subjectCount: number, totalSlots: number): number[] {
        const baseSlots = Math.floor(totalSlots / subjectCount);
        const remainder = totalSlots % subjectCount;
        
        const distribution: number[] = [];
        for (let i = 0; i < subjectCount; i++) {
            distribution.push(baseSlots + (i < remainder ? 1 : 0));
        }
        
        return distribution;
    }

    /**
     * Identify priority subjects (core subjects like Math, English, Science)
     */
    private identifyPrioritySubjects(subjects: Subject[]): Set<string> {
        const priorityKeywords = ['math', 'english', 'science', 'physics', 'chemistry', 'biology'];
        const priority = new Set<string>();

        for (const subject of subjects) {
            const nameLower = subject.name.toLowerCase();
            if (priorityKeywords.some(keyword => nameLower.includes(keyword))) {
                priority.add(subject.id);
            }
        }

        return priority;
    }

    /**
     * Find an available teacher for a subject at a given time
     */
    private findAvailableTeacher(
        subject: Subject,
        className: string,
        day: string,
        timeSlot: string
    ): Teacher | null {
        // For simplicity, assign teachers in round-robin fashion
        // In a real system, you'd match teachers to their qualified subjects
        
        for (const teacher of this.teachers) {
            if (this.isTeacherAvailable(teacher.id, day, timeSlot) &&
                this.isClassAvailable(className, day, timeSlot)) {
                return teacher;
            }
        }

        // If no teacher available, return first teacher anyway (conflict will be noted)
        return this.teachers.length > 0 ? this.teachers[0] : null;
    }

    /**
     * Check if teacher is available at this time
     */
    private isTeacherAvailable(teacherId: string, day: string, timeSlot: string): boolean {
        const key = `${teacherId}_${day}_${timeSlot}`;
        return !this.teacherAssignments.has(key);
    }

    /**
     * Check if class is available at this time
     */
    private isClassAvailable(className: string, day: string, timeSlot: string): boolean {
        const key = `${className}_${day}_${timeSlot}`;
        return !this.classAssignments.has(key);
    }

    /**
     * Mark a time slot as assigned
     */
    private markAssignment(teacherId: string, className: string, day: string, timeSlot: string): void {
        const teacherKey = `${teacherId}_${day}_${timeSlot}`;
        const classKey = `${className}_${day}_${timeSlot}`;

        if (!this.teacherAssignments.has(teacherKey)) {
            this.teacherAssignments.set(teacherKey, new Set());
        }
        this.teacherAssignments.get(teacherKey)!.add(className);

        if (!this.classAssignments.has(classKey)) {
            this.classAssignments.set(classKey, new Set());
        }
        this.classAssignments.get(classKey)!.add(teacherId);
    }

    /**
     * Validate the generated timetable for conflicts
     */
    public validateTimetable(timetable: Timetable): {
        isValid: boolean;
        conflicts: string[];
    } {
        const conflicts: string[] = [];

        // Check for teacher double-booking
        const teacherSlots = new Map<string, string>();
        
        for (const [className, days] of Object.entries(timetable)) {
            for (const [day, slots] of Object.entries(days)) {
                for (const [timeSlot, entry] of Object.entries(slots)) {
                    const key = `${entry.teacherId}_${day}_${timeSlot}`;
                    if (teacherSlots.has(key)) {
                        conflicts.push(
                            `Teacher conflict: ${entry.teacherId} assigned to both ${teacherSlots.get(key)} and ${className} on ${day} at ${timeSlot}`
                        );
                    }
                    teacherSlots.set(key, className);
                }
            }
        }

        return {
            isValid: conflicts.length === 0,
            conflicts
        };
    }
}

/**
 * Generate a basic timetable template (used when no data is available)
 */
export function generateBasicTimetableTemplate(
    classes: string[],
    days: string[],
    timeSlots: TimeSlot[]
): Timetable {
    const timetable: Timetable = {};
    
    const defaultSubjects = [
        { id: 'math', name: 'Mathematics' },
        { id: 'eng', name: 'English' },
        { id: 'sci', name: 'Science' },
        { id: 'soc', name: 'Social Studies' },
        { id: 'break', name: 'Break' }
    ];

    for (const className of classes) {
        timetable[className] = {};
        
        for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
            const day = days[dayIdx];
            timetable[className][day] = {};
            
            for (let slotIdx = 0; slotIdx < timeSlots.length; slotIdx++) {
                const timeSlot = timeSlots[slotIdx];
                
                // Assign subjects in rotation
                const subjectIdx = (dayIdx + slotIdx) % defaultSubjects.length;
                const subject = defaultSubjects[subjectIdx];
                
                timetable[className][day][timeSlot.label] = {
                    subjectId: subject.id,
                    teacherId: 'teacher_tbd'
                };
            }
        }
    }

    return timetable;
}

/**
 * Export a user-friendly timetable description
 */
export function formatTimetableForDisplay(timetable: Timetable): string {
    let output = '# Generated Timetable\n\n';
    output += '## Note\n';
    output += 'This timetable was generated using our offline scheduling algorithm. ';
    output += 'It provides a basic structure that you can customize.\n\n';

    for (const [className, days] of Object.entries(timetable)) {
        output += `## ${className}\n\n`;
        
        for (const [day, slots] of Object.entries(days)) {
            output += `### ${day}\n`;
            
            for (const [timeSlot, entry] of Object.entries(slots)) {
                output += `- **${timeSlot}**: Subject ${entry.subjectId} (Teacher: ${entry.teacherId})\n`;
            }
            
            output += '\n';
        }
    }

    return output;
}
