import React, { useState, useMemo, useEffect } from 'react';
import Modal from './Modal';
import { apiGetStudents, apiBatchUpsertScores } from '../services/api';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import { Score } from '../types';

type ImportStep = 'upload' | 'mapping' | 'review' | 'importing' | 'success';

const TARGET_FIELDS = [
  { key: 'admissionNo', label: 'Admission No.' },
  { key: 'ca1', label: 'CA 1 Score' },
  { key: 'ca2', label: 'CA 2 Score' },
  { key: 'exam', label: 'Exam Score' },
  { key: 'comment', label: 'Comment (Optional)' },
];

const BulkScoreImportModal = ({ isOpen, onClose, onSuccess, selectedClass, selectedSubjectId, settings }) => {
    const [step, setStep] = useState<ImportStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvData, setCsvData] = useState<string[][]>([]);
    const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
    const [studentMap, setStudentMap] = useState<Map<string, string>>(new Map());

    useEffect(() => {
        const fetchStudentsForClass = async () => {
            if (selectedClass) {
                const students = await apiGetStudents({ classFilter: selectedClass });
                const newMap = new Map(students.map(s => [s.admissionNo.toLowerCase(), s.id]));
                setStudentMap(newMap);
            }
        };
        fetchStudentsForClass();
    }, [selectedClass]);

    const handleReset = () => {
        setStep('upload'); setFile(null); setError(''); setCsvHeaders([]);
        setCsvData([]); setFieldMapping({});
    };

    const handleClose = () => { handleReset(); onClose(); };

    const autoMapFields = (headers: string[]): Record<string, string> => {
        const mapping: Record<string, string> = {};
        const commonMappings: Record<string, string> = {
            'admissionno': 'admissionNo', 'admission number': 'admissionNo', 'admission_no': 'admissionNo',
            'ca1': 'ca1', 'ca 1': 'ca1', 'c.a 1': 'ca1', 'test 1': 'ca1',
            'ca2': 'ca2', 'ca 2': 'ca2', 'c.a 2': 'ca2', 'test 2': 'ca2',
            'exam': 'exam', 'exam score': 'exam',
            'comment': 'comment', 'remark': 'comment',
        };

        headers.forEach(header => {
            const normalizedHeader = header.toLowerCase().trim();
            mapping[header] = commonMappings[normalizedHeader] || 'ignore';
        });
        return mapping;
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        setFile(selectedFile);
        setError('');

        const reader = new FileReader();
        reader.onload = (event) => {
            const csv = event.target?.result as string;
            const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) {
                setError('CSV must have a header row and at least one data row.');
                return;
            }
            const headers = lines[0].split(',').map(h => h.trim());
            const dataRows = lines.slice(1).map(line => line.split(',').map(d => d.trim()));
            setCsvHeaders(headers);
            setCsvData(dataRows);
            setFieldMapping(autoMapFields(headers));
            setStep('mapping');
        };
        reader.readAsText(selectedFile);
    };

    const handleMappingChange = (header: string, fieldKey: string) => {
        setFieldMapping(prev => ({ ...prev, [header]: fieldKey }));
    };

    const handleImport = async () => {
        setStep('importing');
        setError('');
        try {
            const scoresToUpsert = csvData.map(row => {
                const scoreData: Partial<Score> & { admissionNo?: string } = {};
                csvHeaders.forEach((header, index) => {
                    const targetField = fieldMapping[header];
                    if (targetField !== 'ignore') {
                        const value = row[index];
                        scoreData[targetField] = (targetField === 'ca1' || targetField === 'ca2' || targetField === 'exam') ? Number(value) : value;
                    }
                });
                
                const studentId = studentMap.get(scoreData.admissionNo?.toLowerCase() || '');
                if (!studentId) return null;

                return {
                    studentId,
                    subjectId: selectedSubjectId,
                    session: settings.session,
                    term: settings.term,
                    ca1: scoreData.ca1,
                    ca2: scoreData.ca2,
                    exam: scoreData.exam,
                    comment: scoreData.comment,
                };
            }).filter(Boolean);

            if (scoresToUpsert.length === 0) {
                setError("No valid student scores found in the file. Check admission numbers.");
                setStep('review');
                return;
            }
            
            await apiBatchUpsertScores(scoresToUpsert);
            setStep('success');

        } catch (err) {
            setError(`Import failed: ${err.message}`);
            setStep('review');
        }
    };

    const previewData = useMemo(() => {
        return csvData.slice(0, 5).map(row => {
            const scorePreview: Record<string, string> = {};
            csvHeaders.forEach((header, index) => {
                const targetFieldKey = fieldMapping[header];
                if (targetFieldKey && targetFieldKey !== 'ignore') {
                    scorePreview[targetFieldKey] = row[index];
                }
            });
            return scorePreview;
        });
    }, [csvData, csvHeaders, fieldMapping]);

    const renderContent = () => {
        switch (step) {
            case 'mapping': return (
                <>
                    <p className="text-sm text-gray-600 mb-4">Match columns from your file to score fields.</p>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {csvHeaders.map((header, index) => (
                            <div key={header} className="grid grid-cols-2 gap-4 items-center p-2 rounded-md bg-gray-50">
                                <p className="font-semibold">{header}</p>
                                <select className="input-field" value={fieldMapping[header] || 'ignore'} onChange={(e) => handleMappingChange(header, e.target.value)}>
                                    <option value="ignore">-- Ignore --</option>
                                    {TARGET_FIELDS.map(field => <option key={field.key} value={field.key}>{field.label}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between pt-6">
                        <button onClick={handleReset} className="btn btn-secondary">Back</button>
                        <button onClick={() => setStep('review')} className="btn btn-primary">Review Data</button>
                    </div>
                </>
            );
            case 'review': return (
                <>
                    <p className="text-sm text-gray-600 mb-4">Review the first 5 rows. Scores will be imported for <strong>{selectedClass}</strong>.</p>
                    <div className="table-container max-h-96 overflow-y-auto">
                        <table className="table">
                            <thead><tr>{TARGET_FIELDS.map(f => <th key={f.key} className="th">{f.label}</th>)}</tr></thead>
                            <tbody>
                                {previewData.map((score, index) => (
                                    <tr key={index}>
                                        {TARGET_FIELDS.map(field => <td key={field.key} className="td text-xs">{score[field.key]}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-between pt-6">
                        <button onClick={() => setStep('mapping')} className="btn btn-secondary">Back</button>
                        <button onClick={handleImport} className="btn btn-primary">Confirm & Import {csvData.length} Records</button>
                    </div>
                </>
            );
            case 'importing': return <div className="text-center p-8">Importing scores...</div>;
            case 'success': return (
                <div className="text-center p-8">
                    <h3 className="text-xl font-semibold text-green-600">Import Successful!</h3>
                    <p className="mt-2">{csvData.length} score records have been processed.</p>
                    <div className="mt-6">
                        <button onClick={() => { onSuccess(); handleClose(); }} className="btn btn-primary">Done</button>
                    </div>
                </div>
            );
            default: return (
                <>
                    <p className="text-sm text-gray-600 mb-4">Upload a CSV file with student scores. Required columns: admission number, ca1, ca2, exam.</p>
                    <div className="mt-4">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <ArrowUpTrayIcon className="w-8 h-8 mb-2 text-gray-500" />
                            <p className="text-sm text-gray-500">{file ? file.name : 'Click to upload'}</p>
                            <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                        </label>
                    </div>
                </>
            );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Import Scores from CSV">
            <div className="p-6">
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                {renderContent()}
            </div>
        </Modal>
    );
};

export default BulkScoreImportModal;
