import React, { useState, useEffect } from 'react';
import { apiGetStudents, apiGetStudentScores, apiGetSubjects } from '../services/api';
import { useQRCodeGenerator } from '../hooks/useQRCodeGenerator';
import { useAI } from '../hooks/useAI';
import Modal from './Modal';
import ReportCard from './ReportCard';

const StudentProfile = ({ demoUserId }) => {
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scores, setScores] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showAIAnalysis, setShowAIAnalysis] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    
    const { qrCodeUrl, isLoading: qrLoading } = useQRCodeGenerator(student?.admissionNo || '');
    const { generateResponse } = useAI();

    // Mock fee data - in real app, this would come from API
    const [feeData] = useState({
        totalFees: 150000,
        paidAmount: 120000,
        balance: 30000,
        lastPayment: '2024-01-15',
        paymentHistory: [
            { date: '2024-01-15', amount: 50000, description: 'Term 2 Fees' },
            { date: '2023-11-10', amount: 70000, description: 'Term 1 Fees' },
        ]
    });

    useEffect(() => {
        if (!demoUserId) {
            setLoading(false);
            return;
        }
        const fetchProfile = async () => {
            try {
                const allStudents = await apiGetStudents();
                const profile = allStudents.find(s => s.id === demoUserId);
                setStudent(profile);
                
                if (profile) {
                    // Fetch student scores and subjects
                    const [studentScores, allSubjects] = await Promise.all([
                        apiGetStudentScores(),
                        apiGetSubjects()
                    ]);
                    
                    const studentScoreData = studentScores.filter(score => 
                        score.studentId === profile.id
                    );
                    setScores(studentScoreData);
                    setSubjects(allSubjects);
                }
            } catch (error) {
                console.error('Error fetching student profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [demoUserId]);

    const generateAIAnalysis = async () => {
        if (!student || !scores.length) return;
        
        setAnalysisLoading(true);
        try {
            const prompt = `Analyze this student's academic performance and provide insights for teachers and administrators:

Student: ${student.name}
Class: ${student.class}
Scores: ${scores.map(s => `${s.subject}: ${s.score}%`).join(', ')}

Please provide:
1. Academic Performance Analysis
2. Strengths and Areas for Improvement
3. Behavioral Insights (if applicable)
4. Recommendations for Teachers
5. Suggested Interventions or Support

Keep the analysis professional and actionable for educators.`;

            const analysis = await generateResponse(prompt);
            setAiAnalysis(analysis);
            setShowAIAnalysis(true);
        } catch (error) {
            console.error('Error generating AI analysis:', error);
            setAiAnalysis('Unable to generate analysis at this time. Please try again later.');
            setShowAIAnalysis(true);
        } finally {
            setAnalysisLoading(false);
        }
    };

    const printReportCard = () => {
        setShowReportModal(true);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="card p-6 text-center">Loading profile...</div>;
    if (!student) return <div className="card p-6 text-center">Could not find student profile.</div>;

    const averageScore = scores.length > 0 
        ? (scores.reduce((sum, score) => sum + score.score, 0) / scores.length).toFixed(1)
        : 'N/A';

    return (
        <div className="space-y-6">
            {/* Header with Student Info */}
            <div className="card">
                <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                    <img 
                        src={student.photo || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(student.name)}`} 
                        alt={student.name} 
                        className="h-32 w-32 rounded-full object-cover ring-4 ring-indigo-300" 
                    />
                    <div className="text-center md:text-left flex-1">
                        <h2 className="text-3xl font-bold">{student.name}</h2>
                        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-gray-600 dark:text-gray-300">
                            <strong>Class:</strong><span>{student.class}</span>
                            <strong>Admission No:</strong><span>{student.admissionNo}</span>
                            <strong>Gender:</strong><span>{student.gender}</span>
                            <strong>Date of Birth:</strong><span>{student.dob}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={printReportCard}
                            className="btn btn-primary"
                        >
                            📄 Print Report Card
                        </button>
                        <button 
                            onClick={generateAIAnalysis}
                            disabled={analysisLoading}
                            className="btn btn-secondary"
                        >
                            {analysisLoading ? '🔄 Analyzing...' : '🤖 AI Analysis'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="card">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        {[
                            { id: 'overview', label: 'Overview', icon: '📊' },
                            { id: 'academic', label: 'Academic Performance', icon: '📚' },
                            { id: 'fees', label: 'School Fees', icon: '💰' },
                            { id: 'qr', label: 'Digital ID', icon: '📱' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-blue-900">Academic Average</h4>
                                <p className="text-2xl font-bold text-blue-600">{averageScore}%</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-green-900">Fee Status</h4>
                                <p className="text-lg font-semibold text-green-600">
                                    ₦{(feeData.paidAmount).toLocaleString()} paid
                                </p>
                                <p className="text-sm text-green-700">
                                    ₦{(feeData.balance).toLocaleString()} remaining
                                </p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-purple-900">Attendance</h4>
                                <p className="text-2xl font-bold text-purple-600">95%</p>
                                <p className="text-sm text-purple-700">This term</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'academic' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Academic Performance</h3>
                            {scores.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th className="th">Subject</th>
                                                <th className="th">Score</th>
                                                <th className="th">Grade</th>
                                                <th className="th">Remark</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {scores.map((score, index) => {
                                                const grade = score.score >= 80 ? 'A' : 
                                                            score.score >= 70 ? 'B' : 
                                                            score.score >= 60 ? 'C' : 
                                                            score.score >= 50 ? 'D' : 'F';
                                                const remark = score.score >= 80 ? 'Excellent' : 
                                                              score.score >= 70 ? 'Very Good' : 
                                                              score.score >= 60 ? 'Good' : 
                                                              score.score >= 50 ? 'Fair' : 'Poor';
                                                return (
                                                    <tr key={index}>
                                                        <td className="td">{score.subject}</td>
                                                        <td className="td">{score.score}%</td>
                                                        <td className="td">
                                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                                grade === 'A' ? 'bg-green-100 text-green-800' :
                                                                grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                                                grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                                                grade === 'D' ? 'bg-orange-100 text-orange-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                                {grade}
                                                            </span>
                                                        </td>
                                                        <td className="td">{remark}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500">No academic records available.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'fees' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">School Fee Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-2">Fee Summary</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span>Total Fees:</span>
                                                <span className="font-semibold">₦{feeData.totalFees.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Amount Paid:</span>
                                                <span className="font-semibold text-green-600">₦{feeData.paidAmount.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Balance:</span>
                                                <span className="font-semibold text-red-600">₦{feeData.balance.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Last Payment:</span>
                                                <span>{feeData.lastPayment}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Payment History</h4>
                                    <div className="space-y-2">
                                        {feeData.paymentHistory.map((payment, index) => (
                                            <div key={index} className="bg-white border rounded-lg p-3">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium">{payment.description}</p>
                                                        <p className="text-sm text-gray-500">{payment.date}</p>
                                                    </div>
                                                    <span className="font-semibold text-green-600">
                                                        ₦{payment.amount.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'qr' && (
                        <div className="text-center">
                            <h3 className="text-lg font-semibold mb-4">Digital ID</h3>
                            <div className="inline-block bg-white p-6 rounded-lg shadow-lg">
                                {qrLoading ? (
                                    <div className="w-40 h-40 bg-gray-200 animate-pulse rounded flex items-center justify-center">
                                        <span className="text-gray-500">Loading QR...</span>
                                    </div>
                                ) : qrCodeUrl ? (
                                    <img src={qrCodeUrl} alt="Student QR Code" className="w-40 h-40 mx-auto" />
                                ) : (
                                    <div className="w-40 h-40 bg-gray-100 rounded flex items-center justify-center">
                                        <span className="text-gray-500">QR Code unavailable</span>
                                    </div>
                                )}
                                <p className="mt-4 text-sm text-gray-600">
                                    Admission No: {student.admissionNo}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Present this QR code for attendance scanning
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Report Card Modal */}
            {showReportModal && (
                <Modal onClose={() => setShowReportModal(false)}>
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Report Card</h3>
                            <div className="space-x-2">
                                <button onClick={handlePrint} className="btn btn-primary">
                                    🖨️ Print
                                </button>
                                <button onClick={() => setShowReportModal(false)} className="btn btn-secondary">
                                    Close
                                </button>
                            </div>
                        </div>
                        <div className="print:shadow-none">
                            <ReportCard 
                                student={student} 
                                scores={scores}
                                subjects={subjects}
                            />
                        </div>
                    </div>
                </Modal>
            )}

            {/* AI Analysis Modal */}
            {showAIAnalysis && (
                <Modal onClose={() => setShowAIAnalysis(false)}>
                    <div className="max-w-2xl mx-auto">
                        <h3 className="text-lg font-semibold mb-4">🤖 AI Student Analysis</h3>
                        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-sm">{aiAnalysis}</pre>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={() => setShowAIAnalysis(false)} className="btn btn-primary">
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default StudentProfile;