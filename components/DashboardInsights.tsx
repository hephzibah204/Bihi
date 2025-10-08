import React, { useState, useEffect } from 'react';
import { apiGetStudents, apiGetScores } from '../services/api';
import ArrowTrendingUpIcon from './icons/ArrowTrendingUpIcon';

const DashboardInsights = () => {
    const [totalStudents, setTotalStudents] = useState(0);
    const [averagePerformance, setAveragePerformance] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const [students, scores] = await Promise.all([
                    apiGetStudents(),
                    apiGetScores()
                ]);

                setTotalStudents(students.length);

                if (scores.length > 0) {
                    const totalScoreSum = scores.reduce((sum, score) => {
                        return sum + (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
                    }, 0);
                    const average = totalScoreSum / scores.length;
                    setAveragePerformance(Math.round(average));
                }
            } catch (error) {
                console.error("Failed to load dashboard insights:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
    }, []);

    if (loading) {
        return <div className="card mt-6 p-6">Loading insights...</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
             <div className="card p-6">
                <h4 className="font-semibold text-gray-500">Total Students</h4>
                <p className="text-3xl font-bold mt-2">{totalStudents}</p>
            </div>
             <div className="card p-6">
                <h4 className="font-semibold text-gray-500">Overall Average</h4>
                 <p className="text-3xl font-bold mt-2 flex items-center">
                    {averagePerformance}%
                    <ArrowTrendingUpIcon className="w-6 h-6 ml-2 text-green-500" />
                </p>
            </div>
             <div className="card p-6">
                <h4 className="font-semibold text-gray-500">Next Feature</h4>
                <p className="text-lg mt-2">More insights coming soon!</p>
            </div>
        </div>
    );
};

export default DashboardInsights;