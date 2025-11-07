import NurseryReportCard from '../components/report-templates/NurseryReportCard';
import PrimaryReportCard from '../components/report-templates/PrimaryReportCard';
import SecondaryReportCard from '../components/report-templates/SecondaryReportCard';
import ModernReportCard from '../components/report-templates/ModernReportCard';
import ClassicReportCard from '../components/report-templates/ClassicReportCard';
import MinimalistReportCard from '../components/report-templates/MinimalistReportCard';

// A helper function to calculate grade and remark based on score
export const calculateGrade = (score, gradingSystem) => {
    if (typeof score !== 'number' || !Array.isArray(gradingSystem)) {
        return { grade: 'N/A', remark: 'N/A' };
    }
    const gradeInfo = gradingSystem.find(g => score >= g.from && score <= g.to);
    if (gradeInfo) {
        return { grade: gradeInfo.grade, remark: gradeInfo.remark };
    }
    return { grade: 'N/G', remark: 'Not Graded' };
};

export const getReportCardTemplate = (className: string, settings?: any) => {
    if (!className) {
        const choice = settings?.reportCardSettings?.primaryTemplate || 'primary_default';
        if (choice === 'modern') return ModernReportCard;
        if (choice === 'classic') return ClassicReportCard;
        if (choice === 'minimalist') return MinimalistReportCard;
        return PrimaryReportCard; // Default fallback
    }
    const lowerClassName = className.toLowerCase();
    
    if (lowerClassName.includes('nursery') || lowerClassName.includes('playgroup') || lowerClassName.includes('kg')) {
        return NurseryReportCard;
    }
    if (lowerClassName.includes('jss') || lowerClassName.includes('sss')) {
        const secondaryChoice = settings?.reportCardSettings?.secondaryTemplate || 'secondary_default';
        if (secondaryChoice === 'modern') return ModernReportCard;
        if (secondaryChoice === 'classic') return ClassicReportCard;
        if (secondaryChoice === 'minimalist') return MinimalistReportCard;
        return SecondaryReportCard;
    }
    // Primary-level selection driven by settings
    const choice = settings?.reportCardSettings?.primaryTemplate || 'primary_default';
    if (choice === 'modern') return ModernReportCard;
    if (choice === 'classic') return ClassicReportCard;
    if (choice === 'minimalist') return MinimalistReportCard;
    return PrimaryReportCard;
};

export const calculateOverallPerformance = (studentId, studentClass, allStudents, allScores, allSubjects, term, session) => {
    const classStudents = allStudents.filter(s => s.class === studentClass);
    const subjectsForClass = allSubjects.filter(sub => sub.classes.includes(studentClass));
    const subjectIdsForClass = new Set(subjectsForClass.map(s => s.id));

    const scoresByStudent = allScores.reduce((acc, score) => {
      if (score.term === term && score.session === session && subjectIdsForClass.has(score.subjectId)) {
        if (!acc[score.studentId]) {
          acc[score.studentId] = [];
        }
        acc[score.studentId].push(score);
      }
      return acc;
    }, {});

    const classAverages = classStudents.map(s => {
        const studentScoresForTerm = scoresByStudent[s.id] || [];
        const total = studentScoresForTerm.reduce((acc, score) => acc + (score?.ca1 || 0) + (score?.ca2 || 0) + (score?.exam || 0), 0);
        return { studentId: s.id, total, average: subjectsForClass.length > 0 ? total / subjectsForClass.length : 0 };
    });

    classAverages.sort((a, b) => b.average - a.average);
    
    const studentPerformance = classAverages.find(s => s.studentId === studentId);
    const position = classAverages.findIndex(s => s.studentId === studentId) + 1;

    return {
        totalScore: studentPerformance?.total || 0,
        average: studentPerformance?.average.toFixed(2) || '0.00',
        position: position > 0 ? position : 'N/A',
        totalStudentsInClass: classStudents.length,
    };
};

export const summarizeAttendance = (studentId, attendanceRecords) => {
    let present = 0, late = 0, absent = 0;
    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
        return { present, late, absent, total: 0 };
    }
    
    attendanceRecords.forEach(record => {
        const status = record.statuses?.[studentId];
        const normalized = String(status || '').toLowerCase();
        if (normalized === 'present') present++;
        else if (normalized === 'late') late++;
        else if (normalized === 'absent') absent++;
        // else ignore unknown statuses
    });

    return { present, late, absent, total: present + late + absent };
};