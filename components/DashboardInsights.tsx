import React, { useState, useEffect } from 'react';
import { apiGetStudents, apiGetScores, apiGetAttendance, apiGetBehavioralRecords } from '../services/api';
import { generateText } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import ArrowTrendingUpIcon from './icons/ArrowTrendingUpIcon';
import ShieldExclamationIcon from './icons/ShieldExclamationIcon';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import UsersIcon from './icons/UsersIcon';

type InsightCategory = 'Academic' | 'Attendance' | 'Behavioral' | 'Enrollment';

interface Insight {
    category: InsightCategory;
    icon: 'trending' | 'alert' | 'positive' | 'growth';
    text: string;
}

const INSIGHTS_CACHE_KEY = 'dashboard_insights_cache';

const DashboardInsights = () => {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasGenerated, setHasGenerated] = useState(false);

    useEffect(() => {
        // Check for cached insights from today
        const cached = localStorage.getItem(INSIGHTS_CACHE_KEY);
        if (cached) {
            try {
                const { date, data } = JSON.parse(cached);
                const today = new Date().toISOString().split('T')[0];
                if (date === today) {
                    setInsights(data);
                    setHasGenerated(true);
                }
            } catch (e) {
                localStorage.removeItem(INSIGHTS_CACHE_KEY);
            }
        }
    }, []);

    const handleGenerateInsights = async () => {
        setLoading(true);
        setError('');

        try {
            const [students, scores, attendance, behavioral] = await Promise.all([
                apiGetStudents(),
                apiGetScores(),
                apiGetAttendance(),
                apiGetBehavioralRecords()
            ]);
            
            // --- Data Summarization for Prompt ---
            const today = new Date().toISOString().split('T')[0];
            const todaysAttendance = attendance.find(a => a.date === today)?.statuses || {};
            const absentCount = Object.values(todaysAttendance).filter(s => s === 'absent').length;
            const recentBehavioral = behavioral.slice(0, 5); // last 5 records
            const recentScores = scores.slice(-20); // last 20 scores entered

            const dataSummary = `
                - Total students: ${students.length}
                - Today's attendance summary: ${absentCount} students marked absent.
                - Recent behavioral remarks: ${recentBehavioral.length > 0 ? recentBehavioral.map(r => `${r.type}: ${r.remark}`).join('; ') : 'None.'}
                - Recent scores entered: ${recentScores.length > 0 ? `${recentScores.length} new scores logged.` : 'None.'}
            `;
            
            const prompt = `
                You are a data analyst AI for a school administrator. Analyze the following daily summary and provide 3-4 concise, actionable insights for the school dashboard.

                Today's Data Summary:
                ${dataSummary}

                Your task is to identify key trends, alerts, or positive news. For each insight, provide a category, an icon type, and a short descriptive text.

                Categories: "Academic", "Attendance", "Behavioral", "Enrollment".
                Icon types: "trending" (for academic trends), "alert" (for issues), "positive" (for good news), "growth" (for enrollment changes).

                Your output MUST be a valid JSON array of objects, with no extra text or markdown. Each object should have this exact structure:
                { "category": "...", "icon": "...", "text": "..." }

                Example output:
                [
                    { "category": "Attendance", "icon": "alert", "text": "${absentCount} students were absent today. Consider following up with their parents." },
                    { "category": "Academic", "icon": "trending", "text": "Multiple low scores were entered for JSS 1 Maths, suggesting a need for review." }
                ]

                Generate the insights now based on the summary provided.
            `;
            
            const responseText = await generateText(prompt);
            const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
            const generatedInsights: Insight[] = JSON.parse(jsonString);

            setInsights(generatedInsights);
            setHasGenerated(true);
            
            // Cache the result
            const cachePayload = { date: new Date().toISOString().split('T')[0], data: generatedInsights };
            localStorage.setItem(INSIGHTS_CACHE_KEY, JSON.stringify(cachePayload));

        } catch (err) {
            console.error("AI Insight generation failed:", err);
            setError("Could not generate insights. The AI service may be unavailable or returned an unexpected format.");
        } finally {
            setLoading(false);
        }
    };
    
    const InsightIcon = ({ icon }: { icon: Insight['icon'] }) => {
        const iconMap = {
            trending: <ArrowTrendingUpIcon className="w-6 h-6 text-blue-500" />,
            alert: <ShieldExclamationIcon className="w-6 h-6 text-yellow-500" />,
            positive: <CheckBadgeIcon className="w-6 h-6 text-green-500" />,
            growth: <UsersIcon className="w-6 h-6 text-indigo-500" />,
        };
        return iconMap[icon] || null;
    };

    return (
        <div className="card mt-6">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold flex items-center">
                        <SparklesIcon className="w-6 h-6 mr-2 text-indigo-500" />
                        AI Daily Briefing
                    </h3>
                    <button onClick={handleGenerateInsights} className="btn btn-secondary text-sm" disabled={loading}>
                        {loading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : (hasGenerated ? 'Refresh' : 'Generate')}
                    </button>
                </div>
                
                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
                
                <div className="mt-4">
                    {loading ? (
                        <div className="text-center p-4">
                            <SpinnerIcon className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                            <p className="mt-2 text-sm text-gray-500">Analyzing school data...</p>
                        </div>
                    ) : insights.length > 0 ? (
                        <ul className="space-y-4">
                            {insights.map((insight, index) => (
                                <li key={index} className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 pt-1">
                                        <InsightIcon icon={insight.icon} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{insight.category}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{insight.text}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : !hasGenerated && !loading ? (
                        <p className="text-sm text-gray-500 text-center py-4">Click "Generate" to get your daily AI-powered summary.</p>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default DashboardInsights;