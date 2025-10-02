import React, { useState, useEffect } from 'react';
import { apiGetScores, apiGetSubjects, apiGetStudents, apiGetSchoolSettings, apiGetAttendance, getTenantData } from '../services/api';
import { calculateGrade, getReportCardTemplate } from '../utils/reportCardHelper';
import Modal from './Modal';
import PrinterIcon from './icons/PrinterIcon';

const StudentResults = ({ demoUserId }) => {
    const [allResults, setAllResults] = useState({});
    const [student, setStudent] = useState(null);
    const [allData, setAllData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTermData, setSelectedTermData] = useState(null);

    useEffect(() => {
        if (!demoUserId) {
            setLoading(false);
            setError("Student profile not selected.");
            return;
        }
        
        const fetchResults = async () => {
            setLoading(true);
            setError('');
            try {
                const [scores, subjects, students, settings, attendance, remarks] = await Promise.all([
                    apiGetScores(), apiGetSubjects(), apiGetStudents(), apiGetSchoolSettings(), apiGetAttendance(), getTenantData('remarks') || []
                ]);
                setAllData({ scores, subjects, students, settings, attendance, remarks });

                const currentStudent = students.find(s => s.id === demoUserId);
                if (!currentStudent) throw new Error("Student profile not found.");
                setStudent(currentStudent);

                const studentScores = scores.filter(score => score.studentId === demoUserId);
                
                const resultsByTerm = studentScores.reduce((acc, score) => {
                    const termKey = `${score.session} - ${score.term}`;
                    if (!acc[termKey]) acc[termKey] = [];
                    
                    const subject = subjects.find(sub => sub.id === score.subjectId);
                    const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
                    const gradeInfo = calculateGrade(total, settings.gradingSystem || []);

                    acc[termKey].push({
                        subjectName: subject ? subject.name : 'Unknown Subject',
                        ...score, total, ...gradeInfo
                    });
                    return acc;
                }, {});
                
                setAllResults(resultsByTerm);

            } catch (err) {
                console.error("Failed to fetch results:", err);
                setError("Could not load your results. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [demoUserId]);
    
    const handleViewReport = (termKey) => {
        const [session, term] = termKey.split(' - ');
        setSelectedTermData({ session, term });
        setIsModalOpen(true);
    };

    if (loading) {
        return <div className="card p-6 text-center">Loading your results...</div>;
    }

    if (error) {
        return <div className="card p-6 text-center text-red-500">{error}</div>;
    }

    const sortedTerms = Object.keys(allResults).sort().reverse();
    
    const ReportCardComponent = selectedTermData && student
      ? getReportCardTemplate(student.class)
      : null;

    return (
        <div>
            {sortedTerms.length > 0 ? sortedTerms.map(termKey => (
                <div key={termKey} className="card mt-6">
                    <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
                        <h2 className="text-lg font-semibold">{termKey}</h2>
                        <button onClick={() => handleViewReport(termKey)} className="btn btn-secondary">View & Print Report Card</button>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead><tr><th className="th">Subject</th><th className="th text-center">Total Score</th><th className="th">Remark</th></tr></thead>
                            <tbody>
                                {allResults[termKey].map((res, index) => (
                                    <tr key={index}><td className="td font-medium">{res.subjectName}</td><td className="td text-center">{res.total}</td><td className="td">{res.remark}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )) : (
                <div className="card mt-6 p-6 text-center">No results have been uploaded for you yet.</div>
            )}

            {selectedTermData && student && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Report Card for ${selectedTermData.term}`} size="full">
                    <div className="bg-gray-100 dark:bg-gray-900 p-8 flex flex-col items-center">
                        <div className="printable-content bg-white shadow-lg">
                           {ReportCardComponent && <ReportCardComponent
                                student={student}
                                students={allData.students}
                                scores={allData.scores}
                                subjects={allData.subjects}
                                settings={allData.settings}
                                term={selectedTermData.term}
                                session={selectedTermData.session}
                                remarks={allData.remarks}
                                attendance={allData.attendance}
                            />}
                        </div>
                        <div className="no-print mt-8">
                             <button onClick={() => window.print()} className="btn btn-primary">
                                <PrinterIcon className="w-5 h-5 mr-2" />
                                Print Report
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default StudentResults;