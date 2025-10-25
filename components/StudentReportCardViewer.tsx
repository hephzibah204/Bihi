import React, { useState, useEffect } from 'react';
// Fix: Replaced non-existent `getTenantData` with `apiGetRemarks`.
import { apiGetScores, apiGetSubjects, apiGetStudents, apiGetSchoolSettings, apiGetAttendance, apiGetRemarks } from '../services/api';
import { getReportCardTemplate } from '../utils/reportCardHelper';
import PrinterIcon from './icons/PrinterIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import { downloadElementAsPdf } from '../utils/pdfUtils';

const StudentReportCardViewer = ({ demoUserId }) => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!demoUserId) {
            setLoading(false);
            setError("Student profile not selected.");
            return;
        }
        
        const fetchReportData = async () => {
            setLoading(true);
            setError('');
            try {
                const [scores, subjects, students, settings, attendance, remarks] = await Promise.all([
                    apiGetScores(), apiGetSubjects(), apiGetStudents(), apiGetSchoolSettings(), apiGetAttendance(), apiGetRemarks()
                ]);

                const currentStudent = students.find(s => s.id === demoUserId);
                if (!currentStudent) throw new Error("Student profile not found.");

                setReportData({
                    student: currentStudent,
                    students,
                    scores,
                    subjects,
                    settings,
                    term: settings.term,
                    session: settings.session,
                    remarks,
                    attendance
                });

            } catch (err) {
                console.error("Failed to fetch report card data:", err);
                setError("Could not load your report card. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [demoUserId]);

    if (loading) {
        return <div className="card p-6 text-center">Loading your report card...</div>;
    }
    if (error) {
        return <div className="card p-6 text-center text-red-500">{error}</div>;
    }
    if (!reportData) {
        return <div className="card p-6 text-center text-gray-500">No report card available for the current term.</div>;
    }

    const ReportCardComponent = getReportCardTemplate(reportData.student.class, reportData.settings);

    return (
        <div className="flex flex-col items-center">
            <div className="no-print mb-6 w-full max-w-4xl flex justify-end gap-2">
                <button
                    onClick={() => downloadElementAsPdf('.printable-content', reportData?.student?.name || 'report-card')}
                    className="btn btn-secondary"
                    title="Download as PDF"
                >
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                    Download PDF
                </button>
                <button onClick={() => window.print()} className="btn btn-primary">
                    <PrinterIcon className="w-5 h-5 mr-2" />
                    Print Report Card
                </button>
            </div>
            <div className="printable-content bg-white shadow-lg">
                <ReportCardComponent {...reportData} />
            </div>
        </div>
    );
};

export default StudentReportCardViewer;