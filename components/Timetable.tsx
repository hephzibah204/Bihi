import React, { useState, useEffect, useMemo } from 'react';
import { apiGetSubjects, apiGetTeachers, apiGetTimetableData, apiSaveTimetableData, apiSaveSchoolSettings } from '../services/api';
import Modal from './Modal';
import AITimetableGenerator from './AITimetableGenerator';
import PlusIcon from './icons/PlusIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import { Subject, Teacher } from '../types';
import ShieldExclamationIcon from './icons/ShieldExclamationIcon';
import { logger } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';
import { computeTimetablePlan } from '../utils/timetable';

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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = ['8:00 - 9:00', '9:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '1:00 - 2:00'];


const MasterTimetableView: React.FC<{ timetable: TimetableData; subjects: Subject[]; teachers: Teacher[]; days: string[]; timeSlots: string[]; slotMeta: Record<string, { label: string; type: 'period' | 'break'; index?: number }>; }> = ({ timetable, subjects, teachers, days, timeSlots, slotMeta }) => {
    const subjectMap = useMemo<Map<string, string>>(() => new Map<string, string>(subjects.map((s: Subject) => [s.id, s.name])), [subjects]);
    const teacherMap = useMemo<Map<string, string>>(() => new Map<string, string>(teachers.map((t: Teacher) => [t.id, t.name])), [teachers]);

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
                        {days.map(day => <th key={day} className="th text-center">{day}</th>)}
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {timeSlots.map(time => (
                        <tr key={time} className="divide-x divide-gray-200">
                            <td className="td font-semibold">{time}</td>
                            {days.map(day => {
                                const key = `${day}-${time}`;
                                const periods = periodsBySlot[key] || [];
                                const meta = slotMeta[time];
                                const isBreak = meta?.type === 'break';
                                return (
                                    <td key={day} className="td align-top p-1 space-y-1">
                                        {isBreak ? (
                                            <div className="text-xs text-gray-600 bg-amber-50 border border-amber-200 rounded p-1 text-center">Break</div>
                                        ) : (
                                        periods.map((period, index) => {
                                            const clashInfo = clashes[key]?.[period.teacherId];
                                            const isClashing = !!clashInfo;
                                            const clashTitle = isClashing ? `Clash: ${teacherMap.get(period.teacherId)} is assigned to ${clashInfo.join(' & ')} at the same time.` : '';

                                            return (
                                                <div 
                                                    key={index}
                                                    title={clashTitle}
                                                    className={`p-1.5 rounded-md text-xs ${isClashing ? 'border border-red-400 bg-red-100' : 'bg-indigo-50 border border-indigo-200'}`}
                                                >
                                                    <p className="font-bold text-gray-700">{period.className}</p>
                                                    <p>{subjectMap.get(period.subjectId) || 'N/A'}</p>
                                                    <p className="text-gray-500 flex items-center">
                                                        {teacherMap.get(period.teacherId) || 'N/A'}
                                                        {isClashing && <ShieldExclamationIcon className="w-4 h-4 ml-1 text-red-600 flex-shrink-0" />}
                                                    </p>
                                                </div>
                                            );
                                        }))}
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
    const { role, settings } = useAuth();
    const plan = computeTimetablePlan(settings || undefined);
    const DAYS_LOCAL = plan.days;
    const TIME_SLOTS_LOCAL = plan.timeSlots;
    const PERIOD_SLOTS_LOCAL = plan.periodSlots;
    const SLOT_META = (plan as any).slotMeta;
    const FRIDAY_MAX = (plan as any).config?.fridayMaxTeachingPeriods ?? 6;
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
            logger.error("Failed to load timetable data", { error: error as unknown });
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
        const meta = SLOT_META?.[time];
        const isBreak = meta?.type === 'break';
        const isFridayOverflow = day === 'Friday' && meta?.type === 'period' && (meta.index || 0) > FRIDAY_MAX;
        if (isBreak || isFridayOverflow) return;
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
                {role === 'Admin' && (
                  <div className="w-full md:w-auto bg-white border rounded-lg p-3 flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="label">Period (mins)</label>
                      <input id="tt-period" type="number" min="20" max="120" defaultValue={(settings as any)?.timetable?.periodMinutes ?? 40} className="input-field w-28" />
                    </div>
                    <div>
                      <label className="label">Start Time</label>
                      <input id="tt-start" type="time" defaultValue={(settings as any)?.timetable?.startTime ?? '08:00'} className="input-field w-36" />
                    </div>
                    <div>
                      <label className="label">Max Periods</label>
                      <input id="tt-max" type="number" min="1" max="12" defaultValue={(settings as any)?.timetable?.maxTeachingPeriods ?? 8} className="input-field w-28" />
                    </div>
                    <div>
                      <label className="label">Friday Max</label>
                      <input id="tt-fri" type="number" min="1" max="12" defaultValue={(settings as any)?.timetable?.fridayMaxTeachingPeriods ?? 6} className="input-field w-28" />
                    </div>
                    <div>
                      <label className="label">Breaks</label>
                      <select id="tt-bcount" className="input-field w-28" defaultValue={(settings as any)?.timetable?.breakCount ?? 1}>
                        <option value="0">None</option>
                        <option value="1">One</option>
                        <option value="2">Two</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Break 1 After</label>
                      <input id="tt-b1after" type="number" min="1" max="10" defaultValue={(settings as any)?.timetable?.firstBreakAfter ?? 3} className="input-field w-28" />
                    </div>
                    <div>
                      <label className="label">Break 1 (mins)</label>
                      <input id="tt-b1mins" type="number" min="5" max="60" defaultValue={(settings as any)?.timetable?.firstBreakMinutes ?? 15} className="input-field w-28" />
                    </div>
                    <div>
                      <label className="label">Break 2 After</label>
                      <input id="tt-b2after" type="number" min="1" max="10" defaultValue={(settings as any)?.timetable?.secondBreakAfter ?? 6} className="input-field w-28" />
                    </div>
                    <div>
                      <label className="label">Break 2 (mins)</label>
                      <input id="tt-b2mins" type="number" min="5" max="60" defaultValue={(settings as any)?.timetable?.secondBreakMinutes ?? 15} className="input-field w-28" />
                    </div>
                    <div className="ml-auto">
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          const next = {
                            ...(settings || {}),
                            timetable: {
                              ...((settings as any)?.timetable || {}),
                              startTime: (document.getElementById('tt-start') as HTMLInputElement)?.value || '08:00',
                              periodMinutes: Number((document.getElementById('tt-period') as HTMLInputElement)?.value || 40),
                              maxTeachingPeriods: Number((document.getElementById('tt-max') as HTMLInputElement)?.value || 8),
                              fridayMaxTeachingPeriods: Number((document.getElementById('tt-fri') as HTMLInputElement)?.value || 6),
                              breakCount: Number((document.getElementById('tt-bcount') as HTMLSelectElement)?.value || 1) as 0|1|2,
                              firstBreakAfter: Number((document.getElementById('tt-b1after') as HTMLInputElement)?.value || 3),
                              firstBreakMinutes: Number((document.getElementById('tt-b1mins') as HTMLInputElement)?.value || 15),
                              secondBreakAfter: Number((document.getElementById('tt-b2after') as HTMLInputElement)?.value || 6),
                              secondBreakMinutes: Number((document.getElementById('tt-b2mins') as HTMLInputElement)?.value || 15),
                            }
                          } as any;
                          await apiSaveSchoolSettings(next);
                          window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Timetable settings saved' } }));
                          setTimeout(() => window.location.reload(), 400);
                        }}
                      >Save</button>
                    </div>
                  </div>
                )}
                <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg" role="tablist" aria-label="Timetable view mode">
                    <button 
                        onClick={() => setViewMode('class')}
                        className={`px-4 py-1.5 rounded-md font-semibold text-sm transition-colors ${viewMode === 'class' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                        role="tab"
                        aria-selected={viewMode === 'class'}
                    >
                        Class View
                    </button>
                    <button 
                        onClick={() => setViewMode('master')}
                        className={`px-4 py-1.5 rounded-md font-semibold text-sm transition-colors ${viewMode === 'master' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                        role="tab"
                        aria-selected={viewMode === 'master'}
                    >
                        Master View
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    {viewMode === 'class' && (
                        <>
                            <label htmlFor="class-select" className="sr-only">Select class</label>
                            <select id="class-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="input-field">
                                {classes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </>
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
                                {DAYS_LOCAL.map(day => <th key={day} className="th text-center">{day}</th>)}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {TIME_SLOTS_LOCAL.map(time => (
                                <tr key={time} className="divide-x divide-gray-200">
                                    <td className="td font-semibold">{time}</td>
                                    {DAYS_LOCAL.map(day => {
                                        const slotInfo = getSlotInfo(day, time);
                                        return (
                                            <td 
                                                key={day} 
                                                className={`td text-center align-top p-2 ${SLOT_META?.[time]?.type === 'break' || (day === 'Friday' && (SLOT_META?.[time]?.index || 0) > FRIDAY_MAX) ? 'bg-gray-50 text-gray-400' : 'hover:bg-indigo-50 cursor-pointer'}`} 
                                                onClick={() => handleSlotClick(day, time)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSlotClick(day, time); }}
                                                aria-label={`Edit ${day} ${time} slot`}
                                            >
                                                {SLOT_META?.[time]?.type === 'break' ? (
                                                    <div className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded p-2">Break</div>
                                                ) : (day === 'Friday' && (SLOT_META?.[time]?.index || 0) > FRIDAY_MAX) ? (
                                                    <span className="text-gray-600">Closed</span>
                                                ) : slotInfo ? (
                                                    <div className="bg-indigo-50 border border-indigo-200 rounded p-2">
                                                        <p className="font-semibold text-indigo-700">{slotInfo.subject}</p>
                                                        <p className="text-sm text-gray-600">{slotInfo.teacher}</p>
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
                <MasterTimetableView timetable={timetable} subjects={subjects} teachers={teachers} days={DAYS_LOCAL} timeSlots={TIME_SLOTS_LOCAL} slotMeta={SLOT_META} />
            )}

            <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Slot - ${currentSlot.day} ${currentSlot.time}`}>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="label" htmlFor="subject-select">Subject</label>
                        <select
                            id="subject-select"
                            className="input-field"
                            value={currentSelection.subjectId}
                            onChange={(e) => setCurrentSelection(prev => ({ ...prev, subjectId: e.target.value }))}
                        >
                            <option value="">-- Select Subject --</option>
                            {subjects.filter(s => s.classes.includes(selectedClass)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label" htmlFor="teacher-select">Teacher</label>
                        <select
                            id="teacher-select"
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
                timeSlots={PERIOD_SLOTS_LOCAL}
                days={DAYS_LOCAL}
            />
        </div>
    );
};

export default Timetable;
