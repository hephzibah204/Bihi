import React, { useState } from 'react';
import { useAI } from '../hooks/useAI';
import { apiGetInvoices, apiGetPayments, apiGetExpenses, apiGetPayrollRuns } from '../services/api';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';

const BursaryAIAnalyst = () => {
    const { generateResponse, status } = useAI();
    const [query, setQuery] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [error, setError] = useState('');

    const handleAnalysis = async () => {
        if (!query.trim()) return;
        setIsAnalyzing(true);
        setAnalysisResult('');
        setError('');

        try {
            const [invoices, payments, expenses, payrollRuns] = await Promise.all([
                apiGetInvoices(),
                apiGetPayments(),
                apiGetExpenses(),
                apiGetPayrollRuns(),
            ]);

            const context = {
                revenue: {
                    totalInvoiced: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
                    totalPaid: invoices.reduce((sum, i) => sum + i.amountPaid, 0),
                    paymentMethods: payments.reduce((acc, p) => {
                        acc[p.method] = (acc[p.method] || 0) + p.amount;
                        return acc;
                    }, {}),
                },
                expenses: {
                    totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
                    byCategory: expenses.reduce((acc, e) => {
                        acc[e.category] = (acc[e.category] || 0) + e.amount;
                        return acc;
                    }, {}),
                },
                payroll: {
                    totalPaid: payrollRuns.reduce((sum, run) => sum + run.totalNet, 0),
                    runs: payrollRuns.length,
                }
            };

            const prompt = `
                You are a financial analyst for a school. Analyze the following financial data summary to answer the user's question. Provide clear, concise answers. If asked for a breakdown, use a simple list format.

                **Financial Data Summary (JSON):**
                ${JSON.stringify(context, null, 2)}

                **User's Question:**
                "${query}"

                **Your Analysis:**
            `;
            
            const result = await generateResponse({ prompt });
            setAnalysisResult(result);
        } catch (err) {
            setError(`AI Analysis Error: ${err.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    return (
        <div className="card">
            <div className="p-6">
                 <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold">Bursary AI Analyst</h2>
                    <div className="flex items-center text-xs text-gray-500">
                        <span className={`w-2 h-2 rounded-full mr-2 ${status === 'gemini' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        {status === 'gemini' ? 'Online' : 'Offline'}
                    </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">Ask natural language questions about your school's finances.</p>
                <div className="mt-4">
                    <textarea 
                        className="input-field w-full"
                        rows={3}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., What are our biggest expenses? Compare our income vs expenses."
                    />
                </div>
                <div className="mt-2 flex justify-end">
                    <button onClick={handleAnalysis} className="btn btn-primary" disabled={isAnalyzing}>
                        {isAnalyzing ? <SpinnerIcon className="w-5 h-5 animate-spin mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                        {isAnalyzing ? 'Analyzing...' : 'Ask AI'}
                    </button>
                </div>
                 {(analysisResult || error) && (
                    <div className="mt-6 border-t pt-4">
                        <h4 className="font-semibold">AI Response</h4>
                        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                        {analysisResult && <pre className="mt-2 text-sm whitespace-pre-wrap font-sans bg-gray-50 p-4 rounded-md">{analysisResult}</pre>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BursaryAIAnalyst;
