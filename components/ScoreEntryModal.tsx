import React from 'react';
import Modal from './Modal';
import { Student, Score, SchoolSettings } from '../types';

interface ScoreEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (studentId: string, field: 'ca1' | 'ca2' | 'exam' | 'comment', value: string | number) => void;
    onNavigate: (direction: 'next' | 'prev') => void;
    student: Student;
    score: Partial<Score>;
    settings: Partial<SchoolSettings>;
    isFirst: boolean;
    isLast: boolean;
}

const ScoreEntryModal: React.FC<ScoreEntryModalProps> = ({ isOpen, onClose, onSave, onNavigate, student, score, settings, isFirst, isLast }) => {
    if (!student) return null;

    const maxCa1 = settings?.maxCa1 ?? 20;
    const maxCa2 = settings?.maxCa2 ?? 20;
    const maxExam = settings?.maxExam ?? 60;
    const total = (score?.ca1 || 0) + (score?.ca2 || 0) + (score?.exam || 0);

    const handleInputChange = (field: 'ca1' | 'ca2' | 'exam', value: string) => {
        onSave(student.id, field, value);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={student.name}>
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="label text-center">CA 1 ({maxCa1})</label>
                        <input type="number" min="0" max={maxCa1} value={score.ca1 ?? ''} onChange={e => handleInputChange('ca1', e.target.value)} className="input-field text-center p-2 text-lg" />
                    </div>
                    <div>
                        <label className="label text-center">CA 2 ({maxCa2})</label>
                        <input type="number" min="0" max={maxCa2} value={score.ca2 ?? ''} onChange={e => handleInputChange('ca2', e.target.value)} className="input-field text-center p-2 text-lg" />
                    </div>
                    <div>
                        <label className="label text-center">Exam ({maxExam})</label>
                        <input type="number" min="0" max={maxExam} value={score.exam ?? ''} onChange={e => handleInputChange('exam', e.target.value)} className="input-field text-center p-2 text-lg" />
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-500">Total Score</p>
                    <p className="text-4xl font-bold">{total}</p>
                </div>
                <div>
                    <label className="label">Comment (Optional)</label>
                    <textarea value={score.comment ?? ''} onChange={e => onSave(student.id, 'comment', e.target.value)} className="input-field" rows={3}></textarea>
                </div>
            </div>
            <div className="p-4 border-t flex justify-between items-center">
                <button onClick={() => onNavigate('prev')} disabled={isFirst} className="btn btn-secondary">Previous</button>
                <button onClick={onClose} className="btn btn-secondary">Done</button>
                <button onClick={() => onNavigate('next')} disabled={isLast} className="btn btn-primary">Next</button>
            </div>
        </Modal>
    );
};

export default ScoreEntryModal;
