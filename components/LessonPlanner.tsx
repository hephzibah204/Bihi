
import React, { useState, useEffect, useMemo } from 'react';
import { useAI } from '../hooks/useAI';
import { apiGetSubjects, apiGetTeachers } from '../services/api';
import { Subject, Teacher } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import { useTenant } from '../contexts/TenantContext';
import { generateClassNames } from '../utils/classManager';
import { supabase } from '../services/supabaseClient';

const LessonPlanner = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [currentUser, setCurrentUser] = useState<Teacher | null>(null);
    const { settings } = useTenant();
    
    // Form State
    const [selectedSubject, setSelectedSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [classLevel, setClassLevel] = useState('');
    const [outputType, setOutputType] = useState('plan'); // plan, note, combined
    const [curriculum, setCurriculum] = useState('NERDC');
    const [otherCurriculum, setOtherCurriculum] = useState('');
    const [uploadedScheme, setUploadedScheme] = useState('');
    const [customPrompt, setCustomPrompt] = useState('');
    const [period, setPeriod] = useState('');
    const [duration, setDuration] = useState('');

    // AI & UI State
    const [generatedPlan, setGeneratedPlan] = useState('');
    const { generateResponse, status } = useAI();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [subjectsData, teachersData] = await Promise.all([apiGetSubjects(), apiGetTeachers()]);
                setSubjects(subjectsData);
                setTeachers(teachersData);

                if (supabase) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const me = teachersData.find(t => t.email.toLowerCase() === user.email.toLowerCase());
                        setCurrentUser(me || null);
                    }
                }
            } catch (err) {
                setError("Failed to load initial data.");
            }
        };
        fetchData();
    }, []);
    
    const classNames = useMemo(() => generateClassNames(settings), [settings]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setUploadedScheme(event.target?.result as string);
            };
            reader.readAsText(file);
        }
    };

    const handleGenerate = async () => {
        if (!topic || !selectedSubject || !classLevel) {
            setError('Please provide a subject, topic, and class level.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedPlan('');
        
        const subjectName = subjects.find(s => s.id === selectedSubject)?.name || '';
        const teacherName = currentUser?.name || 'The Teacher';
        const schoolName = settings?.schoolName || 'The School';

        try {
            const prompt = `
                You are an expert Nigerian educator creating a 21st-century compliant lesson document.

                **CONTEXT:**
                - School: ${schoolName}
                - Teacher: ${teacherName}
                - Subject: "${subjectName}"
                - Topic: "${topic}"
                - Class Level: "${classLevel}"
                - Period: ${period || 'N/A'}
                - Duration: ${duration || 'N/A'} minutes
                - Curriculum: ${curriculum === 'Other' ? otherCurriculum : curriculum}. If you cannot find this specific curriculum, default to NERDC.
                - Output Type: Generate a "${outputType}" document.
                - Custom Instructions: ${customPrompt || 'None'}
                - Teacher's Uploaded Scheme of Work (Prioritize this if available): 
                  """
                  ${uploadedScheme || 'None provided.'}
                  """

                **YOUR TASK:**
                Generate the required document(s) based on the "Output Type". Format the response as a single, well-structured HTML string. Use <h2> for main sections (like "Lesson Plan", "Lesson Note") and <h3> for sub-sections. Use <strong>, <ul>, and <li> for emphasis and lists.

                - If "Output Type" is "plan":
                  Generate only a teacher-facing Lesson Plan with these sections: Instructional Objectives, Instructional Materials, Lesson Procedure (Intro, Presentation, Activities, Conclusion), Evaluation, and Assignment. Ensure it incorporates 21st-century skills like critical thinking and collaboration.

                - If "Output Type" is "note":
                  Generate only a student-facing Lesson Note. This should be the detailed content the teacher would write on the board for students to copy. It should be clear, well-explained, and directly cover the topic.

                - If "Output Type" is "combined":
                  Generate both the Lesson Plan and the Lesson Note as two distinct sections within the same document, starting with the Lesson Plan.
            `;
            const result = await generateResponse({ prompt });
            setGeneratedPlan(result);
        } catch (err) {
            setError(`Failed to generate lesson plan: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const downloadAsWord = () => {
        if (!generatedPlan) return;
        const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Lesson Plan</title></head><body>`;
        const footer = "</body></html>";
        const sourceHTML = header + generatedPlan + footer;

        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = `${topic.replace(/\s+/g, '_')}_Lesson_Plan.doc`;
        fileDownload.click();
        document.body.removeChild(fileDownload);
    };

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-center">
                        <BookOpenIcon className="w-6 h-6 mr-3 text-green-500" />
                        <h2 className="text-xl font-semibold">AI Lesson Planner</h2>
                    </div>
                     <div className="flex items-center text-xs text-gray-500">
                         <span className={`w-2 h-2 rounded-full mr-2 ${status === 'gemini' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                         {status === 'gemini' ? 'Online' : 'Offline'}
                    </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">Instantly generate a structured lesson plan or note for any topic.</p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="label">Subject</label><select className="input-field" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}><option value="">-- Select --</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    <div><label className="label">Class Level</label><select className="input-field" value={classLevel} onChange={(e) => setClassLevel(e.target.value)}><option value="">-- Select --</option>{classNames.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div><label className="label">Topic</label><input type="text" className="input-field" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Photosynthesis"/></div>
                    <div><label className="label">Output Type</label><select className="input-field" value={outputType} onChange={e => setOutputType(e.target.value)}><option value="plan">Lesson Plan</option><option value="note">Lesson Note</option><option value="combined">Lesson Plan & Note</option></select></div>
                    <div><label className="label">Period</label><input type="text" className="input-field" value={period} onChange={e => setPeriod(e.target.value)} placeholder="e.g., 1st & 2nd"/></div>
                    <div><label className="label">Duration (minutes)</label><input type="text" className="input-field" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g., 80"/></div>
                </div>
                <div className="mt-4"><button onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-indigo-600">{showAdvanced ? 'Hide' : 'Show'} Advanced Options</button></div>
                {showAdvanced && (
                    <div className="mt-2 p-4 border rounded-md bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="label">Curriculum</label><select className="input-field" value={curriculum} onChange={e => setCurriculum(e.target.value)}><option>NERDC</option><option>British</option><option>Lagos State Scheme</option><option>Ogun State Scheme</option><option>NAPPS Scheme</option><option>Other</option></select></div>
                        {curriculum === 'Other' && <div><label className="label">Specify Curriculum</label><input type="text" className="input-field" value={otherCurriculum} onChange={e => setOtherCurriculum(e.target.value)} /></div>}
                        <div><label className="label">Upload Scheme of Work (.txt)</label><input type="file" className="input-field" accept=".txt" onChange={handleFileChange} /></div>
                        <div className="md:col-span-2"><label className="label">Custom Instructions</label><textarea className="input-field" value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} rows={2} placeholder="e.g., 'Focus on practical examples for rural students'"></textarea></div>
                    </div>
                )}
                 <button onClick={handleGenerate} className="btn btn-primary mt-4" disabled={isLoading || !topic}>
                    {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                    <span className="ml-2">{isLoading ? 'Generating...' : 'Generate'}</span>
                </button>
                 
                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

                {generatedPlan && (
                    <div className="mt-4 border-t pt-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold">Generated Document for "{topic}":</h4>
                            <button onClick={downloadAsWord} className="btn btn-secondary"><ArrowDownTrayIcon className="w-5 h-5 mr-2"/> Download as Word</button>
                        </div>
                        <div className="mt-2 p-4 bg-gray-50 rounded-md max-h-[60vh] overflow-y-auto prose-content" dangerouslySetInnerHTML={{ __html: generatedPlan }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonPlanner;
