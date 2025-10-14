import React, { useState, useEffect, useMemo } from 'react';
import { apiGetSubjects, apiGetTeachers, apiGetTimetableData, apiSaveTimetableData } from '../services/api';
import Modal from './Modal';
import AITimetableGenerator from './AITimetableGenerator';
import PlusIcon from './icons/PlusIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import { Subject, Teacher } from '../types';
import ShieldExclamationIcon from './icons/ShieldExclamationIcon';

interface TimetableSlot {
    subjectId: string;
    teacherId: string;
}

interface TimetableData {
    [className: string]: {
        [day: string]: {
            [time: string]: TimetableSlot;
        };
    };
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = ['8:00 - 9:00', '9:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '1:00 - 2:00'];


const MasterTimetableView = ({ timetable, subjects, teachers }) => {
    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.name])), [teachers]);

    const { periodsBySlot, clashes } = useMemo(() => {
        interface PeriodInfo {
            className: string;
            subjectId: string;
            teacherId: string;
        }
        const periods: Record<string, PeriodInfo[]> = {};
        const clashes: Record<string, Record<string, string[]>> = {};
        
        Object.entries(timetable).forEach(([className, classSchedule]) => {
            Object.entries(classSchedule).forEach(([day, daySchedule]) => {
                Object.entries(daySchedule).forEach(([time, slot]) => {
                    const key = `${day}-${time}`;
                    if (!periods[key]) periods[key] = [];
                    if (slot && typeof slot === 'object') {
                        periods[key].push({ className, ...(slot as TimetableSlot) });
                    }
                });
            });
        });

        Object.entries(periods).forEach(([key, slotsInPeriod]) => {
            const teacherUsage: Record<string, string[]> = {};
            slotsInPeriod.forEach(slot => {
                if (!teacherUsage[slot.teacherId]) teacherUsage[slot.teacherId] = [];
                teacherUsage[slot.teacherId].push(slot.className);
            });
            Object.entries(teacherUsage).forEach(([teacherId, classNames]) => {
                if (classNames.length > 1) {
                    if (!clashes[key]) clashes[key] = {};
                    clashes[key][teacherId] = classNames;
                }
            });
        });
        
        return { periodsBySlot: periods, clashes };
    }, [timetable]);

    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        <th className="th w-1/6">Time</th>
                        {DAYS.map(day => <th key={day} className="th text-center">{day}</th>)}
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {TIME_SLOTS.map(time => (
                        <tr key={time} className="divide-x divide-gray-200">
                            <td className="td font-semibold">{time}</td>
                            {DAYS.map(day => {
                                const key = `${day}-${time}`;
                                const periods = periodsBySlot[key] || [];
                                return (
                                    <td key={day} className="td align-top p-1 space-y-1">
                                        {periods.map((period, index) => {
                                            const clashInfo = clashes[key]?.[period.teacherId];
                                            const isClashing = !!clashInfo;
                                            const clashTitle = isClashing ? `Clash: ${teacherMap.get(period.teacherId)} is assigned to ${clashInfo.join(' & ')} at the same time.` : '';

                                            return (
                                                <div 
                                                    key={index}
                                                    title={clashTitle}
                                                    className={`p-1.5 rounded-md text-xs ${isClashing ? 'border border-red-500 bg-red-50' : 'bg-gray-50'}`}
                                                >
                                                    <p className="font-bold text-gray-700">{period.className}</p>
                                                    <p>{subjectMap.get(period.subjectId) || 'N/A'}</p>
                                                    <p className="text-gray-500 flex items-center">
                                                        {teacherMap.get(period.teacherId) || 'N/A'}
                                                        {isClashing && <ShieldExclamationIcon className="w-4 h-4 ml-1 text-red-600 flex-shrink-0" />}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const Timetable = () => {
    const [timetable, setTimetable] = useState<TimetableData>({});
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjectMap, setSubjectMap] = useState({});
    const [teacherMap, setTeacherMap] = useState({});
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isAIModalOpen, setAIModalOpen] = useState(false);
    const [currentSlot, setCurrentSlot] = useState({ day: '', time: '' });
    const [currentSelection, setCurrentSelection] = useState({ subjectId: '', teacherId: '' });
    const [viewMode, setViewMode] = useState<'class' | 'master'>('class');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subData, teaData, ttData]: [Subject[], Teacher[], TimetableData] = await Promise.all([
                apiGetSubjects(),
                apiGetTeachers(),
                apiGetTimetableData()
            ]);
            setSubjects(subData);
            setTeachers(teaData);
            setTimetable(ttData);

            const subMap = subData.reduce((acc, sub) => ({ ...acc, [sub.id]: sub }), {});
            const teaMap = teaData.reduce((acc, tea) => ({ ...acc, [tea.id]: tea }), {});
            setSubjectMap(subMap);
            setTeacherMap(teaMap);

            const allClasses = [...new Set(subData.flatMap(s => s.classes))].sort();
            setClasses(allClasses);
            if (allClasses.length > 0 && !selectedClass) {
                setSelectedClass(allClasses[0]);
            }
        } catch (error) {
            console.error("Failed to load timetable data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const handleStorageUpdate = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (['subjects', 'teachers', 'timetable'].includes(customEvent.detail?.key)) {
                fetchData();
            }
        };
        window.addEventListener('storage-update', handleStorageUpdate);
        return () => window.removeEventListener('storage-update', handleStorageUpdate);
    }, []);

    const handleSlotClick = (day, time) => {
        setCurrentSlot({ day, time });
        const existing = timetable[selectedClass]?.[day]?.[time] || { subjectId: '', teacherId: '' };
        setCurrentSelection(existing);
        setEditModalOpen(true);
    };

    const handleSaveSlot = async () => {
        const { day, time } = currentSlot;
        const newTimetable = { ...timetable };
        if (!newTimetable[selectedClass]) newTimetable[selectedClass] = {};
        if (!newTimetable[selectedClass][day]) newTimetable[selectedClass][day] = {};

        if (!currentSelection.subjectId && !currentSelection.teacherId) {
            delete newTimetable[selectedClass][day][time];
        } else {
            newTimetable[selectedClass][day][time] = currentSelection;
        }
        
        await apiSaveTimetableData(newTimetable);
        setTimetable(newTimetable);
        setEditModalOpen(false);
    };
    
    const handleApplyAIGeneratedTimetable = async (generatedTimetable: TimetableData) => {
        await apiSaveTimetableData(generatedTimetable);
        setTimetable(generatedTimetable);
        setAIModalOpen(false);
    };

    const getSlotInfo = (day, time) => {
        const slot = timetable[selectedClass]?.[day]?.[time];
        if (!slot) return null;
        return {
            subject: subjectMap[slot.subjectId]?.name || 'Unassigned',
            teacher: teacherMap[slot.teacherId]?.name || 'Unassigned',
        };
    };

    if (loading) return <div className="card p-6 text-center">Loading Timetable...</div>;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('class')}
                        className={`px-4 py-1.5 rounded-md font-semibold text-sm transition-colors ${viewMode === 'class' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                    >
                        Class View
                    </button>
                    <button 
                        onClick={() => setViewMode('master')}
                        className={`px-4 py-1.5 rounded-md font-semibold text-sm transition-colors ${viewMode === 'master' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                    >
                        Master View
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    {viewMode === 'class' && (
                        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="input-field">
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    )}
                    <button onClick={() => setAIModalOpen(true)} className="btn btn-primary">
                        <BrainCircuitIcon className="h-5 w-5 mr-2" />
                        AI Generate
                    </button>
                </div>
            </div>

            {viewMode === 'class' ? (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="th w-1/6">Time</th>
                                {DAYS.map(day => <th key={day} className="th text-center">{day}</th>)}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {TIME_SLOTS.map(time => (
                                <tr key={time} className="divide-x divide-gray-200">
                                    <td className="td font-semibold">{time}</td>
                                    {DAYS.map(day => {
                                        const slotInfo = getSlotInfo(day, time);
                                        return (
                                            <td key={day} className="td text-center align-top p-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleSlotClick(day, time)}>
                                                {slotInfo ? (
                                                    <div>
                                                        <p className="font-bold text-indigo-600">{slotInfo.subject}</p>
                                                        <p className="text-sm text-gray-500">{slotInfo.teacher}</p>
                                                    </div>
                                                ) : (
                                                    <PlusIcon className="w-6 h-6 text-gray-300 mx-auto" />
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <MasterTimetableView timetable={timetable} subjects={subjects} teachers={teachers} />
            )}

            <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Slot - ${currentSlot.day} ${currentSlot.time}`}>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="label">Subject</label>
                        <select
                            className="input-field"
                            value={currentSelection.subjectId}
                            onChange={(e) => setCurrentSelection(prev => ({ ...prev, subjectId: e.target.value }))}
                        >
                            <option value="">-- Select Subject --</option>
                            {subjects.filter(s => s.classes.includes(selectedClass)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Teacher</label>
                        <select
                            className="input-field"
                            value={currentSelection.teacherId}
                            onChange={(e) => setCurrentSelection(prev => ({ ...prev, teacherId: e.target.value }))}
                        >
                             <option value="">-- Select Teacher --</option>
                             {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={handleSaveSlot} className="btn btn-primary">Save Slot</button>
                    </div>
                </div>
            </Modal>
            
            <AITimetableGenerator 
                isOpen={isAIModalOpen}
                onClose={() => setAIModalOpen(false)}
                onApply={handleApplyAIGeneratedTimetable}
                subjects={subjects}
                teachers={teachers}
                classes={classes}
                timeSlots={TIME_SLOTS}
                days={DAYS}
            />
        </div>
    );
};

export default Timetable;
