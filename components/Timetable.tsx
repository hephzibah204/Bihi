import React, { useState, useEffect } from 'react';
import { apiGetSubjects, apiGetTeachers } from '../services/api';
import Modal from './Modal';
import AITimetableGenerator from './AITimetableGenerator';
import PlusIcon from './icons/PlusIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import useSyncedLocalStorage from '../hooks/useSyncedLocalStorage';

// Types for better structure
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

const Timetable = () => {
    const [timetable, setTimetable] = useSyncedLocalStorage<TimetableData>('timetable', {});
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [subjectMap, setSubjectMap] = useState({});
    const [teacherMap, setTeacherMap] = useState({});
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isAIModalOpen, setAIModalOpen] = useState(false);
    const [currentSlot, setCurrentSlot] = useState({ day: '', time: '' });
    const [currentSelection, setCurrentSelection] = useState({ subjectId: '', teacherId: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subData, teaData] = await Promise.all([
                apiGetSubjects(),
                apiGetTeachers()
            ]);
            setSubjects(subData);
            setTeachers(teaData);

            const subMap = subData.reduce((acc, sub) => {
                acc[sub.id] = sub;
                return acc;
            }, {});
            const teaMap = teaData.reduce((acc, tea) => {
                acc[tea.id] = tea;
                return acc;
            }, {});
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
    }, []);

    useEffect(() => {
        const handleStorageUpdate = (event: Event) => {
            const customEvent = event as CustomEvent;
            const key = customEvent.detail?.key;
            if (['subjects', 'teachers'].includes(key)) {
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

    const handleSaveSlot = () => {
        const { day, time } = currentSlot;

        setTimetable(currentTimetable => {
            const newTimetable = { ...currentTimetable };
            if (!newTimetable[selectedClass]) newTimetable[selectedClass] = {};
            if (!newTimetable[selectedClass][day]) newTimetable[selectedClass][day] = {};
            
            if (!currentSelection.subjectId && !currentSelection.teacherId) {
                if (newTimetable[selectedClass][day][time]) {
                     delete newTimetable[selectedClass][day][time];
                }
            } else {
                 newTimetable[selectedClass][day][time] = currentSelection;
            }
            return newTimetable;
        });
        
        setEditModalOpen(false);
    };
    
    const handleApplyAIGeneratedTimetable = (generatedTimetable) => {
        setTimetable(() => generatedTimetable);
        setAIModalOpen(false);
    };

    const getSlotInfo = (day, time) => {
        const slot = timetable[selectedClass]?.[day]?.[time];
        if (!slot) return null;
        const subject = subjectMap[slot.subjectId];
        const teacher = teacherMap[slot.teacherId];
        return {
            subject: subject?.name || 'Unassigned',
            teacher: teacher?.name || 'Unassigned',
        };
    };

    if (loading) return <div className="card p-6 text-center">Loading Timetable...</div>;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Class Timetable</h1>
                <div className="flex items-center gap-4">
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="input-field"
                    >
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={() => setAIModalOpen(true)} className="btn btn-primary">
                        <BrainCircuitIcon className="h-5 w-5 mr-2" />
                        AI Generate
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th w-1/6">Time</th>
                            {DAYS.map(day => <th key={day} className="th text-center">{day}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                        {TIME_SLOTS.map(time => (
                            <tr key={time} className="divide-x divide-gray-200 dark:divide-gray-700">
                                <td className="td font-semibold">{time}</td>
                                {DAYS.map(day => {
                                    const slotInfo = getSlotInfo(day, time);
                                    return (
                                        <td key={day} className="td text-center align-top p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" onClick={() => handleSlotClick(day, time)}>
                                            {slotInfo ? (
                                                <div>
                                                    <p className="font-bold text-indigo-600 dark:text-indigo-400">{slotInfo.subject}</p>
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