import React, { useState, useEffect, useRef } from 'react';
import { apiGetStudentsForClasses, apiGetSubjects, updateStudents, apiGetStudents, apiGetScores, apiGetSchoolSettings } from '../services/api';
import { Student, Subject, Score } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { generateText } from '../services/geminiService';
import Tooltip from './Tooltip';

const PAGE_SIZE = 50;

type SuggestionStatus = 'Promote' | 'Consider' | 'Repeat';

interface AISuggestion {
    studentId: string;
    suggestion: SuggestionStatus;
    justification: string;
}


const Promotions = () => {
    const [classes, setClasses] = useState<string[]>([]);
    const [fromClass, setFromClass] = useState('');
    const [toClass, setToClass] = useState('');
    const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [promoting, setPromoting] = useState(false);
    const [notification, setNotification] = useState('');
    const [isOnline, setIsOnline] = useState(navigator.onLine);


    // New AI Feature State
    const [aiSuggestions, setAiSuggestions] = useState<Record<string, AISuggestion>>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState('');

    // State for virtualization/infinite scroll
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const loaderRef = useRef(null);

    // Network status listener
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const first = entries[0];
            if (first.isIntersecting) {
                setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, studentsInClass.length));
            }
        }, { threshold: 1 });

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [loaderRef, studentsInClass.length]);

    const visibleStudents = studentsInClass.slice(0, visibleCount);

    const fetchClasses = async () => {
        const allSubjects: Subject[] = await apiGetSubjects();
        const allClasses = [...new Set(allSubjects.flatMap(s => s.classes))].sort();
        setClasses(allClasses);
        if (allClasses.length > 1) {
            if (!fromClass) setFromClass(allClasses[0]);
            if (!toClass) setToClass(allClasses[1]);
        }
    };
    
    const fetchStudents = async () => {
        if (!fromClass) {
            setStudentsInClass([]);
            return;
        }
        setLoading(true);
        // Clear suggestions when class changes
        setAiSuggestions({});
        const students = await apiGetStudentsForClasses([fromClass]);
        setStudentsInClass(students.filter(s => s.status !== 'alumni'));
        setLoading(false);
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        fetchStudents();
        setVisibleCount(PAGE_SIZE); // Reset count when class changes
    }, [fromClass]);

    useEffect(() => {
        const handleStorageUpdate = (event: Event) => {
            const customEvent = event as CustomEvent;
            const key = customEvent.detail?.key;
            if (key === 'subjects') {
                fetchClasses();
            } else if (key === 'students') {
                fetchStudents();
            }
        };
        window.addEventListener('storage-update', handleStorageUpdate);
        return () => window.removeEventListener('storage-update', handleStorageUpdate);
    }, [fromClass]);
    
    const handleSelectStudent = (studentId: string) => {
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedStudents.size === studentsInClass.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(studentsInClass.map(s => s.id)));
        }
    };
    
    const handlePromote = async () => {
        if (selectedStudents.size === 0) {
            alert('Please select students to promote.');
            return;
        }
        
        setPromoting(true);
        setNotification('');

        const lastClass = classes[classes.length - 1];
        const isGraduating = fromClass === lastClass;
        
        if (isGraduating) {
            if (!window.confirm(`You are about to graduate ${selectedStudents.size} student(s) from the final class. This will mark them as alumni. Continue?`)) {
                setPromoting(false);
                return;
            }
        } else {
            if (fromClass === toClass) {
                alert('Cannot promote students to the same class.');
                setPromoting(false);
                return;
            }
        }

        try {
            await updateStudents(allStudents => {
                return allStudents.map(student => {
                    if (selectedStudents.has(student.id)) {
                        if (isGraduating) {
                            return { 
                                ...student, 
                                status: 'alumni', 
                                graduationYear: new Date().getFullYear(),
                                class: `Graduated (${new Date().getFullYear()})`
                            };
                        } else {
                            return { ...student, class: toClass };
                        }
                    }
                    return student;
                });
            });

            // Optimistic UI update
            setStudentsInClass(prevStudents => prevStudents.filter(s => !selectedStudents.has(s.id)));
            setSelectedStudents(new Set());

            const successMessage = isGraduating
                ? `${selectedStudents.size} student(s) graduated successfully!`
                : `${selectedStudents.size} student(s) promoted successfully to ${toClass}!`;

            setNotification(successMessage);
            setTimeout(() => setNotification(''), 5000);

        } catch (error) {
            console.error("Operation failed:", error);
            alert("An error occurred during the operation.");
        } finally {
            setPromoting(false);
        }
    };
    
    const handleAiSuggest = async () => {
        if (!fromClass || !isOnline) return;
        setIsAnalyzing(true);
        setAnalysisError('');
        setAiSuggestions({});

        try {
            const [scores, subjects, settings] = await Promise.all([
                apiGetScores(),
                apiGetSubjects(),
                apiGetSchoolSettings()
            ]);

            const passMark = settings?.gradingSystem?.find(g => g.remark.toLowerCase() === 'pass')?.from || 45;
            const coreSubjects = ['mathematics', 'english language'];

            const studentPerformanceData = studentsInClass.map(student => {
                const studentScores = scores.filter(s => s.studentId === student.id);
                const scoresSummary = studentScores.map(score => {
                    const subject = subjects.find(sub => sub.id === score.subjectId);
                    const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
                    return { subject: subject?.name || 'Unknown', total };
                });
                return { studentId: student.id, name: student.name, scores: scoresSummary };
            });

            const prompt = `
                You are an expert AI educational assistant for a Nigerian school. Your task is to analyze student performance for the entire session and recommend promotion status.

                School's Pass Mark: ${passMark}%. Core subjects are Mathematics and English Language.
                Class to Analyze: ${fromClass}

                Student Data:
                ${JSON.stringify(studentPerformanceData)}

                Based on this data, provide a promotion recommendation for each student.
                - "Promote": Strong overall average and clear passes in core subjects.
                - "Consider": Borderline average or failure in one core subject.
                - "Repeat": Low overall average and failure in multiple core subjects.

                Provide a brief, one-sentence justification for each decision. Your output MUST be a valid JSON array with this exact structure, with no extra text or markdown:
                [
                  { "studentId": "...", "suggestion": "Promote" | "Consider" | "Repeat", "justification": "..." }
                ]
            `;
            
            const responseText = await generateText(prompt);
            const suggestions: AISuggestion[] = JSON.parse(responseText.replace(/```json/g, "").replace(/```/g, ""));
            
            const suggestionsMap = suggestions.reduce((acc, s) => {
                acc[s.studentId] = s;
                return acc;
            }, {});

            setAiSuggestions(suggestionsMap);

        } catch (err) {
            console.error("AI Suggestion Error:", err);
            setAnalysisError("Failed to get AI suggestions. Please check your connection or try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSelectPromoted = () => {
        const promotedIds = Object.values(aiSuggestions)
            .filter(s => s.suggestion === 'Promote')
            .map(s => s.studentId);
        setSelectedStudents(new Set(promotedIds));
    };


    const isFinalClass = fromClass === classes[classes.length - 1];

    const SuggestionBadge = ({ suggestion }: { suggestion: SuggestionStatus }) => {
        const styles = {
            Promote: 'bg-green-100 text-green-800',
            Consider: 'bg-yellow-100 text-yellow-800',
            Repeat: 'bg-red-100 text-red-800'
        };
        return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[suggestion]}`}>{suggestion}</span>
    };

    return (
        <div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Promote students to the next class or graduate them from the final class.</p>

            {notification && <div className="my-4 p-3 text-sm text-green-700 bg-green-100 rounded-lg">{notification}</div>}
            {analysisError && <div className="my-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg">{analysisError}</div>}


            <div className="card mt-6">
                <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="label">Promote From</label>
                        <select className="input-field" value={fromClass} onChange={e => setFromClass(e.target.value)}>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Promote To</label>
                        <select className="input-field" value={toClass} onChange={e => setToClass(e.target.value)} disabled={isFinalClass}>
                             {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {isFinalClass && <p className="text-xs text-indigo-600 mt-1">Students in the final class will be graduated.</p>}
                    </div>
                    <Tooltip text="Requires an internet connection">
                        <div className="w-full"> {/* Wrapper div for tooltip on disabled element */}
                            <button onClick={handleAiSuggest} className="btn btn-secondary w-full" disabled={isAnalyzing || !fromClass || !isOnline}>
                                {isAnalyzing ? <SpinnerIcon className="w-5 h-5 animate-spin mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                                {isAnalyzing ? 'Analyzing...' : 'AI Suggestions'}
                            </button>
                        </div>
                    </Tooltip>
                    <button onClick={handlePromote} className="btn btn-primary" disabled={promoting}>
                        {promoting ? 'Processing...' : isFinalClass ? `Graduate ${selectedStudents.size}` : `Promote ${selectedStudents.size}`}
                    </button>
                </div>
            </div>

            <div className="table-container mt-6">
                 {Object.keys(aiSuggestions).length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 flex justify-between items-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300">AI analysis complete. Review the suggestions and make your selections.</p>
                        <button onClick={handleSelectPromoted} className="btn btn-secondary text-sm">Select All 'Promote'</button>
                    </div>
                 )}
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th w-12">
                                <input type="checkbox" className="rounded"
                                    checked={selectedStudents.size === studentsInClass.length && studentsInClass.length > 0}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="th">Student Name</th>
                            <th className="th">Admission No.</th>
                            <th className="th">AI Suggestion</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                        {loading ? (
                            <tr><td colSpan={4} className="td text-center">Loading students...</td></tr>
                        ) : studentsInClass.length === 0 ? (
                             <tr><td colSpan={4} className="td text-center">No students in this class.</td></tr>
                        ) : (
                            <>
                                {visibleStudents.map(student => {
                                    const suggestion = aiSuggestions[student.id];
                                    return (
                                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="td">
                                                <input type="checkbox" className="rounded"
                                                    checked={selectedStudents.has(student.id)}
                                                    onChange={() => handleSelectStudent(student.id)}
                                                />
                                            </td>
                                            <td className="td font-medium">{student.name}</td>
                                            <td className="td">{student.admissionNo}</td>
                                            <td className="td">
                                                {suggestion ? (
                                                    <div>
                                                        <SuggestionBadge suggestion={suggestion.suggestion} />
                                                        <p className="text-xs text-gray-500 mt-1">{suggestion.justification}</p>
                                                    </div>
                                                ) : isAnalyzing ? (
                                                    <span className="text-xs text-gray-400">Analyzing...</span>
                                                ) : null}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {visibleCount < studentsInClass.length && (
                                    <tr ref={loaderRef}>
                                        <td colSpan={4} className="text-center p-4 text-gray-500">
                                            Loading more...
                                        </td>
                                    </tr>
                                )}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Promotions;