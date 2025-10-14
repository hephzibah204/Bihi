import React, { useState, useEffect, useMemo } from 'react';
// Fix: Correct import path
import { apiGetAssignments, apiGetAssignmentScores, apiGetStudents, apiGetSubjects } from '../services/api';
// Fix: Correct import path
import { Assignment, AssignmentScore, Student, Subject } from '../types';
import { formatDate } from '../utils/dateHelpers';

const StudentAssignments = ({ demoUserId }) => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [scores, setScores] = useState<AssignmentScore[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('upcoming');

    useEffect(() => {
        if (!demoUserId) {
            setLoading(false);
            setError("Student profile not found.");
            return;
        }
        const fetchData = async () => {
            try {
                const [asgs, scs, studs, subs] = await Promise.all([
                    apiGetAssignments(),
                    apiGetAssignmentScores(),
                    apiGetStudents(),
                    apiGetSubjects()
                ]);
                const currentStudent = studs.find(s => s.id === demoUserId);
                setStudent(currentStudent);
                setAssignments(asgs);
                setScores(scs);
                setSubjects(subs);
            } catch (err) {
                setError("Could not load assignments.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [demoUserId]);

    const getSubjectName = (subjectId: string) => subjects.find(s => s.id === subjectId)?.name || 'N/A';

    const studentAssignments = useMemo(() => {
        if (!student) return [];
        return assignments.filter(a => a.class === student.class);
    }, [student, assignments]);

    const { upcoming, graded } = useMemo(() => {
        // Fix: Explicitly type the Map to ensure `score` is not of type unknown.
        const studentScoresMap = new Map<string, AssignmentScore>(scores.filter(s => s.studentId === student?.id).map(s => [s.assignmentId, s]));
        // Fix: Add explicit types for upcoming and graded assignments.
        const upcoming: (Assignment & { scoreInfo?: AssignmentScore })[] = [];
        const graded: (Assignment & { scoreInfo?: AssignmentScore })[] = [];
        
        studentAssignments.forEach(a => {
            const score = studentScoresMap.get(a.id);
            if (score && typeof score.score === 'number') {
                graded.push({ ...a, scoreInfo: score });
            } else {
                upcoming.push(a);
            }
        });

        upcoming.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        graded.sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

        return { upcoming, graded };
    }, [student, studentAssignments, scores]);
    
    if (loading) return <div className="card p-6 text-center">Loading assignments...</div>;
    if (error) return <div className="card p-6 text-center text-red-500">{error}</div>;

    // Fix: Added explicit props interface to resolve type conflicts with React's internal 'key' prop.
    interface AssignmentCardProps {
      assignment: Assignment & { scoreInfo?: AssignmentScore };
    }
    // Fix: Explicitly type the component as React.FC to correctly handle the special 'key' prop.
    const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment }) => (
        <div className="card p-4">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold">{assignment.title}</p>
                    <p className="text-sm text-gray-500">{getSubjectName(assignment.subjectId)} - {assignment.type}</p>
                </div>
                 <div className="text-right">
                    {assignment.scoreInfo ? (
                         <p className="text-xl font-bold">{assignment.scoreInfo.score}<span className="text-sm font-normal text-gray-500">/{assignment.maxScore}</span></p>
                    ) : (
                        <p className="text-sm text-gray-500">Due: {formatDate(assignment.dueDate)}</p>
                    )}
                </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{assignment.description}</p>
            {assignment.scoreInfo?.comment && (
                <div className="mt-2 pt-2 border-t text-sm">
                    <p><strong>Teacher's Comment:</strong> {assignment.scoreInfo.comment}</p>
                </div>
            )}
        </div>
    );

    return (
        <div>
            <div className="flex border-b mb-6">
                <button onClick={() => setActiveTab('upcoming')} className={`px-4 py-2 font-semibold ${activeTab === 'upcoming' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}>
                    Upcoming ({upcoming.length})
                </button>
                 <button onClick={() => setActiveTab('graded')} className={`px-4 py-2 font-semibold ${activeTab === 'graded' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}>
                    Graded ({graded.length})
                </button>
            </div>

            <div className="space-y-4">
                {activeTab === 'upcoming' && (upcoming.length > 0 ? upcoming.map(a => <AssignmentCard key={a.id} assignment={a} />) : <p className="text-center text-gray-500">No upcoming assignments.</p>)}
                {activeTab === 'graded' && (graded.length > 0 ? graded.map(a => <AssignmentCard key={a.id} assignment={a} />) : <p className="text-center text-gray-500">No assignments have been graded yet.</p>)}
            </div>
        </div>
    );
};

export default StudentAssignments;