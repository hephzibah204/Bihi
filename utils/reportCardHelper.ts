import NurseryReportCard from '../components/report-templates/NurseryReportCard';
import PrimaryReportCard from '../components/report-templates/PrimaryReportCard';
import SecondaryReportCard from '../components/report-templates/SecondaryReportCard';

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

export const getReportCardTemplate = (className: string) => {
    if (!className) return PrimaryReportCard; // Default fallback
    const lowerClassName = className.toLowerCase();
    
    if (lowerClassName.includes('nursery') || lowerClassName.includes('playgroup') || lowerClassName.includes('kg')) {
        return NurseryReportCard;
    }
    if (lowerClassName.includes('jss') || lowerClassName.includes('sss')) {
        return SecondaryReportCard;
    }
    // Default to Primary for 'Primary', 'Basic', or anything else
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
        if (status === 'present') present++;
        else if (status === 'late') late++;
        else if (status === 'absent') absent++;
    });

    return { present, late, absent, total: present + late + absent };
};

export const formatOrdinalPosition = (position) => {
    if (position === undefined || position === null) {
        return 'N/A';
    }

    if (typeof position !== 'number' || Number.isNaN(position)) {
        return position || 'N/A';
    }

    const remainder10 = position % 10;
    const remainder100 = position % 100;

    if (remainder10 === 1 && remainder100 !== 11) return `${position}st`;
    if (remainder10 === 2 && remainder100 !== 12) return `${position}nd`;
    if (remainder10 === 3 && remainder100 !== 13) return `${position}rd`;
    return `${position}th`;
};

