import React, { useState } from 'react';
import { apiGetPublicStudentResult, apiGetScratchCards, apiUseScratchCard } from '../services/api';
import { getReportCardTemplate } from '../utils/reportCardHelper';
import PrinterIcon from './icons/PrinterIcon';


const PublicResultViewer = () => {
    const [schoolId, setSchoolId] = useState('');
    const [admissionNo, setAdmissionNo] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resultData, setResultData] = useState(null);

    const handleCheckResult = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResultData(null);

        try {
            // 1. Validate scratch card first
            const allCards = await apiGetScratchCards(schoolId);
            if (!allCards) {
                throw new Error("Could not verify school portal ID or find scratch card data.");
            }

            const card = allCards.find(c => c.pin === pin);
            if (!card) {
                 throw new Error("Invalid scratch card PIN.");
            }
            if (card.used) {
                throw new Error("This scratch card has already been used.");
            }

            // 2. If card is valid, get student result
            const data = await apiGetPublicStudentResult(schoolId, admissionNo);
            
            // 3. Mark card as used and save
            await apiUseScratchCard(pin, schoolId);
            
            // 4. Display result
            setResultData(data);

        } catch (err) {
            setError(err.message || "An error occurred.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const handlePrint = () => {
        window.print();
    };

    if (resultData) {
        const ReportCardComponent = getReportCardTemplate(resultData.student.class);
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
                <div className="max-w-4xl mx-auto bg-white shadow-lg">
                    <div className="p-4" id="report-card-public">
                        <ReportCardComponent 
                            student={resultData.student}
                            students={resultData.students}
                            scores={resultData.scores}
                            subjects={resultData.subjects}
                            settings={resultData.schoolSettings}
                            term={resultData.schoolSettings.term}
                            session={resultData.schoolSettings.session}
                            // FIX: Added missing remarks and attendance props to satisfy component interface.
                            remarks={resultData.remarks}
                            attendance={resultData.attendance}
                        />
                    </div>
                    <div className="text-center my-6 no-print">
                         <button onClick={handlePrint} className="btn btn-primary mr-4">
                            <PrinterIcon className="w-5 h-5 mr-2" />
                            Print Report
                        </button>
                        <button onClick={() => setResultData(null)} className="btn btn-secondary">Check Another Result</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                        Check Student Result
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Enter details to view the report card.</p>
                </div>

                {error && (
                    <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                        {error}
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleCheckResult}>
                    <div>
                        <label htmlFor="schoolId" className="label">School Portal ID</label>
                        <input
                            id="schoolId"
                            type="text"
                            required
                            className="input-field"
                            value={schoolId}
                            onChange={(e) => setSchoolId(e.target.value.toLowerCase())}
                            placeholder="e.g., brightstar"
                        />
                    </div>
                    <div>
                        <label htmlFor="admissionNo" className="label">Admission Number</label>
                        <input
                            id="admissionNo"
                            type="text"
                            required
                            className="input-field"
                            value={admissionNo}
                            onChange={(e) => setAdmissionNo(e.target.value)}
                            placeholder="e.g., RS-001"
                        />
                    </div>
                     <div>
                        <label htmlFor="pin" className="label">Scratch Card PIN</label>
                        <input
                            id="pin"
                            type="text"
                            required
                            className="input-field"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="12-digit PIN"
                        />
                    </div>
                    <div>
                        <button type="submit" disabled={loading} className="w-full btn btn-primary">
                            {loading ? 'Checking...' : 'Check Result'}
                        </button>
                    </div>
                </form>
                 <p className="text-center text-sm text-gray-500">
                    <a href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Back to Home
                    </a>
                </p>
            </div>
        </div>
    );
};

export default PublicResultViewer;