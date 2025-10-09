import React, { useState, useEffect, useMemo } from 'react';
import { apiGetSharedLessonPlans, apiUpvoteLessonPlan, apiGetSubjects } from '../services/api';
import { SharedLessonPlan, Subject } from '../types';
import Modal from './Modal';
import SpinnerIcon from './icons/SpinnerIcon';
import HandThumbUpIcon from './icons/HandThumbUpIcon';
import { formatDate } from '../utils/dateHelpers';
import SearchIcon from './icons/SearchIcon';

const ResourceHub = () => {
    const [plans, setPlans] = useState<SharedLessonPlan[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<SharedLessonPlan | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [plansData, subjectsData] = await Promise.all([
                    apiGetSharedLessonPlans(),
                    apiGetSubjects()
                ]);
                setPlans(plansData);
                setSubjects(subjectsData);
            } catch (error) {
                console.error("Failed to load resource hub:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleUpvote = async (planId: string) => {
        // Optimistic update
        setPlans(prev => prev.map(p => p.id === planId ? { ...p, upvotes: (p.upvotes || 0) + 1 } : p));
        try {
            await apiUpvoteLessonPlan(planId);
        } catch (error) {
            // Revert on error
            setPlans(prev => prev.map(p => p.id === planId ? { ...p, upvotes: p.upvotes - 1 } : p));
            alert("Failed to upvote. Please try again.");
        }
    };
    
    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

    const filteredPlans = useMemo(() => {
        return plans.filter(plan => {
            const searchTermMatch = plan.topic.toLowerCase().includes(searchTerm.toLowerCase());
            const subjectMatch = subjectFilter === 'all' || plan.subjectId === subjectFilter;
            return searchTermMatch && subjectMatch;
        });
    }, [plans, searchTerm, subjectFilter]);

    if (loading) {
        return <div className="card p-6 text-center"><SpinnerIcon className="w-8 h-8 animate-spin mx-auto"/> Loading resources...</div>;
    }

    return (
        <div>
            <div className="card mb-6">
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by topic..."
                            className="input-field pl-10"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                        <select className="input-field" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
                            <option value="all">All Subjects</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlans.map(plan => (
                    <div key={plan.id} className="card flex flex-col">
                        <div className="p-6 flex-grow">
                            <h3 className="font-bold text-lg">{plan.topic}</h3>
                            <div className="text-sm text-gray-500 mt-1">
                                <span>{subjectMap.get(plan.subjectId) || 'Unknown Subject'}</span> &middot; <span>{plan.class}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                Shared by {plan.sharedByTeacherName} on {formatDate(plan.createdAt)}
                            </p>
                        </div>
                        <div className="border-t p-4 flex justify-between items-center">
                            <button onClick={() => handleUpvote(plan.id)} className="flex items-center space-x-2 text-gray-500 hover:text-indigo-600">
                                <HandThumbUpIcon className="w-5 h-5" />
                                <span className="font-semibold">{plan.upvotes || 0}</span>
                            </button>
                            <button onClick={() => setSelectedPlan(plan)} className="btn btn-secondary text-sm">View Plan</button>
                        </div>
                    </div>
                ))}
                {filteredPlans.length === 0 && <p className="col-span-full text-center text-gray-500">No resources found matching your criteria.</p>}
            </div>

            {selectedPlan && (
                <Modal isOpen={!!selectedPlan} onClose={() => setSelectedPlan(null)} title={selectedPlan.topic} size="lg">
                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-sans text-sm">{selectedPlan.content}</pre>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ResourceHub;