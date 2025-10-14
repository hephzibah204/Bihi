import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiGetStudents, apiGetSubjects, apiGetSchoolSettings, apiUpsertRemark, apiGetRemarks } from '../services/api';
import { Student, Remark } from '../types';
import { debounce } from 'lodash';
import { useAI } from '../hooks/useAI';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { useTenant } from '../contexts/TenantContext';
import { generateClassNames } from '../utils/classManager';

const GeneralRemarks = () => {
    const [remarks, setRemarks] = useState<Remark[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [classFilter, setClassFilter] = useState('');
    const { settings: tenantSettings } = useTenant();
    const classNames = useMemo(() => generateClassNames(tenantSettings), [tenantSettings]);
    
    useEffect(() => {
        if(classNames.length > 0 && !classFilter) {
            setClassFilter(classNames[0]);
        }
    }, [classNames, classFilter]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [remarksData, studentsData, settingsData] = await Promise.all([
            apiGetRemarks(),
            apiGetStudents(),
            apiGetSchoolSettings()
        ]);
        setRemarks(remarksData);
        setStudents(studentsData);
        setSettings(settingsData);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const debouncedSave = useCallback(debounce((remarkData: Partial<Remark>) => {
        apiUpsertRemark(remarkData);
    }, 500), []);

    const handleCommentChange = (studentId: string, comment: string) => {
        const remarkData = {
            studentId,
            session: settings.session,
            term: settings.term,
            generalComment: comment
        };

        setRemarks(prev => {
            const index = prev.findIndex(r => r.studentId === studentId && r.session === settings.session && r.term === settings.term);
            if (index > -1) {
                const newRemarks = [...prev];
                newRemarks[index] = { ...newRemarks[index], generalComment: comment };
                return newRemarks;
            }
            return [...prev, remarkData as Remark];
        });

        debouncedSave(remarkData);
    };
    
    const filteredStudents = useMemo(() => {
        return students.filter(s => s.class === classFilter);
    }, [students, classFilter]);
    
    if (loading) return <div>Loading...</div>;

    return (
        <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">General Report Card Comments</h2>
                <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="input-field w-auto">
                    {classNames.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th">Student</th>
                            <th className="th w-2/3">Comment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map(student => {
                            const remark = remarks.find(r => r.studentId === student.id && r.session === settings.session && r.term === settings.term);
                            return (
                                <tr key={student.id}>
                                    <td className="td font-medium">{student.name}</td>
                                    <td className="td">
                                        <textarea
                                            value={remark?.generalComment || ''}
                                            onChange={(e) => handleCommentChange(student.id, e.target.value)}
                                            className="input-field"
                                            rows={2}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GeneralRemarks;