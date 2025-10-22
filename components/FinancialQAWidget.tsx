import React, { useEffect, useState } from 'react';
import { useAI } from '../hooks/useAI';
import { apiGetInvoices, apiGetPayments, apiGetExpenses, apiGetPayrollRuns, apiGetIncome } from '../services/api';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import SkeletonLoader from './SkeletonLoader';

const FinancialQAWidget: React.FC = () => {
  const { generateResponse, status } = useAI();
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loadingContext, setLoadingContext] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [context, setContext] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingContext(true);
      try {
        const [invoices, payments, expenses, payrollRuns, incomes] = await Promise.all([
          apiGetInvoices(),
          apiGetPayments(),
          apiGetExpenses(),
          apiGetPayrollRuns(),
          apiGetIncome(),
        ]);

        const ctx = {
          invoices: (invoices || []).map(i => ({ id: i.id, studentId: i.studentId, class: i.class, session: i.session, term: i.term, issueDate: i.issueDate, dueDate: i.dueDate, totalAmount: i.totalAmount, amountPaid: i.amountPaid, status: i.status })),
          payments: (payments || []).map(p => ({ invoiceId: p.invoiceId, studentId: p.studentId, amount: p.amount, paymentDate: p.paymentDate, method: p.method })),
          expenses: (expenses || []).map(e => ({ date: e.date, category: e.category, amount: e.amount })),
          payroll: (payrollRuns || []).map(pr => ({ runDate: pr.runDate, totalNet: pr.totalNet })),
          income: (incomes || []).map((inc: any) => ({ date: inc.date, category: inc.category, amount: inc.amount })),
        };
        setContext(ctx);
      } catch (e) {
        setError('Failed to load financial context for AI analysis.');
      } finally {
        setLoadingContext(false);
      }
    };
    load();
  }, []);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setIsAnalyzing(true);
    setError('');
    setAnswer('');
    try {
      const prompt = `
        You are a helpful school financial analyst. Answer the user's question using the provided JSON context.

        Rules:
        - Be concise and precise.
        - If listing or comparing, use a simple bullet list.
        - Consider sessions and terms when discussing trends, and clearly note filters.

        CONTEXT JSON:
        ${JSON.stringify(context)}

        USER QUESTION:
        "${query}"
      `;

      const res = await generateResponse({ prompt });
      setAnswer(res);
    } catch (e: any) {
      setError(`AI Error: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="card mt-6">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">Financial Q&A</h3>
            <p className="text-sm text-gray-500">Ask questions about income, expenses, and collections.</p>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <span className={`w-2 h-2 rounded-full mr-2 ${status === 'gemini' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            {status === 'gemini' ? 'Online' : 'Offline'}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input-field flex-1"
            placeholder="e.g., Compare collections vs expenses this term; biggest cost drivers?"
            disabled={loadingContext}
          />
          <button className="btn btn-primary" onClick={handleAsk} disabled={isAnalyzing || loadingContext}>
            {isAnalyzing ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
            <span className="ml-2">{isAnalyzing ? 'Analyzing...' : 'Ask'}</span>
          </button>
        </div>

        {loadingContext && (
          <div className="mt-3">
            <SkeletonLoader className="h-4 w-64 mb-2" />
            <SkeletonLoader className="h-4 w-40" />
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {answer && (
          <div className="mt-4 border-t pt-4">
            <pre className="text-sm whitespace-pre-wrap font-sans bg-gray-50 p-4 rounded-md">{answer}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialQAWidget;