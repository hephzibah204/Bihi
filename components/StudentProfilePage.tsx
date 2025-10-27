import React, { useState, useEffect, useRef } from 'react';
import { apiGetStudents, apiGetScores, apiGetSubjects, apiGetInvoices, apiGetPayments } from '../services/api';
import { Student, Score, Subject, Invoice, Payment } from '../types';
import { ADMIN_VIEWS } from '../utils/constants';
import { useQRCodeGenerator } from '../hooks/useQRCodeGenerator';
import { buildStandardQRPayload } from '../utils/qrCodeGenerator';
import { apiSignQRPayload } from '../services/qr';

// Make Chart.js available from CDN
declare global {
    interface Window {
        Chart: any;
    }
}

const processDataForChart = (student: Student, allStudentsInClass: Student[], scoresForClass: Score[]) => {
    const scoresByTerm = scoresForClass.reduce((acc, score) => {
        const termKey = `${score.session} ${score.term}`;
        const termOrder = ['First', 'Second', 'Third'].indexOf(score.term.split(' ')[0]);
        const orderKey = `${score.session}-${termOrder}`;

        if (!acc[termKey]) {
            acc[termKey] = { scores: [], order: orderKey };
        }
        acc[termKey].scores.push(score);
        return acc;
    }, {} as Record<string, {scores: Score[], order: string}>);
    
    const sortedTerms = Object.keys(scoresByTerm).sort((a, b) => scoresByTerm[a].order.localeCompare(scoresByTerm[b].order));
    const labels = sortedTerms;

    const studentData = sortedTerms.map(term => {
        const termScores = scoresByTerm[term].scores.filter(s => s.studentId === student.id);
        if (termScores.length === 0) return null;
        const total = termScores.reduce((sum, s) => sum + (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0), 0);
        return (total / termScores.length);
    });

    const classData = sortedTerms.map(term => {
        const studentAverages = allStudentsInClass.map(s => {
            const studentTermScores = scoresByTerm[term].scores.filter(score => score.studentId === s.id);
            if (studentTermScores.length === 0) return null;
            const total = studentTermScores.reduce((sum, score) => sum + (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0), 0);
            return total / studentTermScores.length;
        }).filter(avg => avg !== null);

        if (studentAverages.length === 0) return null;
        const classAverage = studentAverages.reduce((sum, avg) => sum + avg!, 0) / studentAverages.length;
        return classAverage;
    });

    return {
        labels,
        datasets: [
            {
                label: `${student.name}'s Average`,
                data: studentData.map(d => d ? d.toFixed(1) : null),
                borderColor: '#4F46E5',
                backgroundColor: '#4F46E5',
                fill: false,
                tension: 0.1,
                borderWidth: 2,
            },
            {
                label: `Class Average`,
                data: classData.map(d => d ? d.toFixed(1) : null),
                borderColor: '#A5B4FC',
                backgroundColor: '#A5B4FC',
                borderDash: [5, 5],
                fill: false,
                tension: 0.1,
                borderWidth: 2,
            }
        ]
    };
};


const StudentProfilePage = ({ studentId, setActiveView }) => {
    const [student, setStudent] = useState<Student | null>(null);
    const [scores, setScores] = useState<Score[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef(null);
    const [qrPayload, setQrPayload] = useState('');
    useEffect(() => {
        (async () => {
            if (!student) { setQrPayload(''); return; }
            const core = buildStandardQRPayload(student.id, student.admissionNo);
            const sig = await apiSignQRPayload(core);
            setQrPayload(sig ? `${core}|SIG=${sig}` : core);
        })();
    }, [student]);
    const { qrCodeUrl } = useQRCodeGenerator(qrPayload);

    useEffect(() => {
        if (!studentId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const studentsData = await apiGetStudents();
                setAllStudents(studentsData);
                const currentStudent = studentsData.find(s => s.id === studentId) || null;
                setStudent(currentStudent);

                if (currentStudent) {
                    const studentsInClass = studentsData.filter(s => s.class === currentStudent.class);
                    const studentIdsInClass = studentsInClass.map(s => s.id);

                    const [scoresData, subjectsData, invoicesData, paymentsData] = await Promise.all([
                        apiGetScores({ studentIds: studentIdsInClass }),
                        apiGetSubjects(),
                        apiGetInvoices(),
                        apiGetPayments(),
                    ]);

                    setScores(scoresData);
                    setSubjects(subjectsData);
                    setInvoices(invoicesData);
                    setPayments(paymentsData);
                }
            } catch (error) {
                console.error("Failed to load student profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [studentId]);
    
    useEffect(() => {
        if (loading || !student || !chartRef.current || !window.Chart) return;
        
        const studentsInClass = allStudents.filter(s => s.class === student.class);
        const chartData = processDataForChart(student, studentsInClass, scores);

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }
        
        const ctx = chartRef.current.getContext('2d');
        chartInstanceRef.current = new window.Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Average Score (%)' }
                    },
                    x: {
                        title: { display: true, text: 'Academic Term' }
                    }
                },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { mode: 'index', intersect: false },
                }
            }
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [loading, student, scores, subjects, allStudents]);

    if (loading) return <div className="card p-6 text-center">Loading profile...</div>;
    if (!student) return <div className="card p-6 text-center">Student not found. <button onClick={() => setActiveView(ADMIN_VIEWS.STUDENTS)} className="text-indigo-600">Go back</button></div>;
    
    // Simple logic to show recent scores for the current student
    const studentScores = scores.filter(score => score.studentId === student.id);
    const recentScores = studentScores.slice(-5).reverse().map(score => { // get last 5 scores
        const subject = subjects.find(s => s.id === score.subjectId);
        const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
        return { subjectName: subject?.name || 'Unknown', total, term: `${score.session} ${score.term}` };
    });

    return (
        <div>
             <button onClick={() => setActiveView(ADMIN_VIEWS.STUDENTS)} className="btn btn-secondary mb-4">&larr; Back to Students</button>
             <div className="card">
                <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                    <img src={student.photo || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(student.name)}`} alt={student.name} className="h-32 w-32 rounded-full object-cover" />
                    <div>
                        <h2 className="text-3xl font-bold">{student.name}</h2>
                        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-gray-600">
                            <span><strong>Class:</strong> {student.class}</span>
                            <span><strong>Admission No:</strong> {student.admissionNo}</span>
                             <span><strong>Gender:</strong> {student.gender}</span>
                            <span><strong>DOB:</strong> {student.dob}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2 card">
                    <div className="p-6">
                        <h3 className="text-xl font-semibold">Academic Progress</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Student's average performance compared to the class average over time.
                        </p>
                        <div className="mt-4 h-80 relative">
                             {scores.length > 0 ? (
                                <canvas ref={chartRef}></canvas>
                             ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">No score data to display chart.</div>
                             )}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <div className="card">
                        <div className="p-6">
                            <h3 className="text-xl font-semibold">Digital ID</h3>
                            <div className="text-center mt-4">
                                {qrCodeUrl ? (
                                    <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32 mx-auto" />
                                ) : (
                                    <p className="text-gray-400">QR code generating...</p>
                                )}
                                <p className="mt-2 text-sm text-gray-500">Scan for attendance & verification.</p>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="p-6">
                            <h3 className="text-xl font-semibold">Fees & Invoices</h3>
                            {student && (
                                (() => {
                                    const invs = invoices.filter(i => i.studentId === student.id);
                                    const totalBilled = invs.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
                                    const totalPaid = invs.reduce((sum, i) => sum + (i.amountPaid || 0), 0);
                                    const outstanding = Math.max(0, totalBilled - totalPaid);
                                    const recentInvs = invs.slice(-3).reverse();
                                    return (
                                        <div>
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                <div><span className="text-gray-500">Total Billed</span><div className="font-semibold">₦{totalBilled.toLocaleString()}</div></div>
                                                <div><span className="text-gray-500">Total Paid</span><div className="font-semibold">₦{totalPaid.toLocaleString()}</div></div>
                                                <div><span className="text-gray-500">Outstanding</span><div className="font-semibold text-red-600">₦{outstanding.toLocaleString()}</div></div>
                                            </div>
                                            <h4 className="mt-4 font-medium">Recent Invoices</h4>
                                            {recentInvs.length > 0 ? (
                                                <ul className="mt-2 divide-y">
                                                    {recentInvs.map(i => (
                                                        <li key={i.id} className="py-2 flex justify-between"><span>{i.term} {i.session}</span><span className="font-mono">₦{i.totalAmount.toLocaleString()}</span></li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-500 mt-2">No invoices.</p>
                                            )}
                                            <div className="mt-4 flex gap-2">
                                                <button onClick={() => setActiveView(ADMIN_VIEWS.REPORT_CARDS)} className="btn btn-secondary">Print Report Card</button>
                                            </div>
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    </div>
                    <div className="card">
                        <div className="p-6">
                            <h3 className="text-xl font-semibold">Recent Scores</h3>
                            {recentScores.length > 0 ? (
                                <ul className="mt-4 divide-y">
                                    {recentScores.map((s, i) => 
                                        <li key={i} className="py-3">
                                            <div className="flex justify-between font-semibold">
                                                <span>{s.subjectName}</span>
                                                <span>{s.total}%</span>
                                            </div>
                                            <p className="text-xs text-gray-500">{s.term}</p>
                                        </li>
                                    )}
                                </ul>
                            ) : <p className="mt-4 text-gray-500">No scores recorded yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfilePage;