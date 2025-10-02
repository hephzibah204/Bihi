import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import { updateStudents } from '../services/api';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import { Student } from '../types';

type ImportStep = 'upload' | 'mapping' | 'review' | 'importing' | 'success';

const TARGET_FIELDS = [
  { key: 'name', label: 'Full Name' },
  { key: 'class', label: 'Class' },
  { key: 'admissionNo', label: 'Admission No.' },
  { key: 'gender', label: 'Gender' },
  { key: 'dob', label: 'Date of Birth (YYYY-MM-DD)' },
  { key: 'parentEmail', label: "Parent's Email" },
];

const ImportStudentsModal = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState<ImportStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');

    // State for mapping
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvData, setCsvData] = useState<string[][]>([]);
    const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});

    const handleReset = () => {
        setStep('upload');
        setFile(null);
        setError('');
        setCsvHeaders([]);
        setCsvData([]);
        setFieldMapping({});
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };
    
    const autoMapFields = (headers: string[]): Record<string, string> => {
        const mapping: Record<string, string> = {};
        const commonMappings: Record<string, string> = {
            'name': 'name',
            'student name': 'name',
            'full name': 'name',
            'class': 'class',
            'admissionno': 'admissionNo',
            'admission number': 'admissionNo',
            'admission_no': 'admissionNo',
            'gender': 'gender',
            'dob': 'dob',
            'date of birth': 'dob',
            'parentemail': 'parentEmail',
            "parent's email": 'parentEmail',
            'parent_email': 'parentEmail',
        };

        headers.forEach(header => {
            const normalizedHeader = header.toLowerCase().trim();
            if (commonMappings[normalizedHeader]) {
                mapping[header] = commonMappings[normalizedHeader];
            } else {
                mapping[header] = 'ignore';
            }
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
                setError('CSV file must have at least one header row and one data row.');
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
            const newStudents: Partial<Student>[] = csvData.map(row => {
                const student: Partial<Student> = {};
                csvHeaders.forEach((header, index) => {
                    const targetField = fieldMapping[header];
                    if (targetField !== 'ignore') {
                        student[targetField] = row[index];
                    }
                });
                
                // Add an ID only if there's at least one mapped field
                if (Object.keys(student).length > 0) {
                    student.id = `std_${Date.now()}_${Math.random()}`;
                }
                return student;
            }).filter(s => Object.keys(s).length > 1); // Ensure it's not just an empty object with an ID

            await updateStudents(existingStudents => [...(existingStudents || []), ...newStudents]);
            setStep('success');

        } catch (err) {
            console.error("Import error:", err);
            setError('Failed to import students. Please try again.');
            setStep('review'); // Go back to review step on error
        }
    };
    
    const previewData = useMemo(() => {
        if (csvData.length === 0) return [];
        return csvData.slice(0, 5).map(row => {
            const studentPreview: Record<string, string> = {};
            TARGET_FIELDS.forEach(field => {
                studentPreview[field.key] = ''; // Initialize all keys
            });

            csvHeaders.forEach((header, index) => {
                const targetFieldKey = fieldMapping[header];
                if (targetFieldKey && targetFieldKey !== 'ignore') {
                    studentPreview[targetFieldKey] = row[index];
                }
            });
            return studentPreview;
        });
    }, [csvData, csvHeaders, fieldMapping]);


    const renderUploadStep = () => (
        <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Upload a CSV file with student data. You'll be able to map the columns in the next step.
            </p>
            <div className="mt-4 flex justify-center items-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ArrowUpTrayIcon className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            {file ? file.name : <><span className="font-semibold">Click to upload</span> or drag and drop</>}
                        </p>
                    </div>
                    <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                </label>
            </div>
            <div className="flex justify-end pt-6">
                <button onClick={handleClose} className="btn btn-secondary">Cancel</button>
            </div>
        </>
    );
    
    const renderMappingStep = () => (
         <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Match the columns from your CSV file to the corresponding fields in the application.
            </p>
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {csvHeaders.map((header, index) => (
                    <div key={header} className="grid grid-cols-3 gap-4 items-center p-2 rounded-md bg-gray-50 dark:bg-gray-700">
                        <div>
                            <p className="text-xs text-gray-500">CSV Column</p>
                            <p className="font-semibold">{header}</p>
                            <p className="text-xs text-gray-400 truncate">e.g., "{csvData[0][index]}"</p>
                        </div>
                        <div className="col-span-2">
                            <label className="label text-xs">Map to Field</label>
                            <select 
                                className="input-field" 
                                value={fieldMapping[header] || 'ignore'}
                                onChange={(e) => handleMappingChange(header, e.target.value)}
                            >
                                <option value="ignore">-- Do not import --</option>
                                {TARGET_FIELDS.map(field => (
                                    <option key={field.key} value={field.key}>{field.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                ))}
            </div>
             <div className="flex justify-between pt-6">
                <button onClick={handleReset} className="btn btn-secondary">Back</button>
                <button onClick={() => setStep('review')} className="btn btn-primary">Next: Review Data</button>
            </div>
        </>
    );
    
     const renderReviewStep = () => (
        <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Review the first 5 rows to ensure your data is mapped correctly. If it looks good, confirm the import.
            </p>
            <div className="table-container max-h-96 overflow-y-auto">
                <table className="table">
                    <thead>
                        <tr>
                            {TARGET_FIELDS.map(field => <th key={field.key} className="th">{field.label}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {previewData.map((student, index) => (
                            <tr key={index}>
                                {TARGET_FIELDS.map(field => <td key={field.key} className="td text-xs">{student[field.key]}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="flex justify-between pt-6">
                <button onClick={() => setStep('mapping')} className="btn btn-secondary">Back</button>
                <button onClick={handleImport} className="btn btn-primary">Confirm & Import {csvData.length} Students</button>
            </div>
        </>
    );

    const renderImportingStep = () => (
        <div className="text-center p-8">
            <p>Importing {csvData.length} students...</p>
            {/* You could add a progress bar here for larger files */}
        </div>
    );

    const renderSuccessStep = () => (
         <div className="text-center p-8">
            <h3 className="text-xl font-semibold text-green-600">Import Successful!</h3>
            <p className="mt-2">{csvData.length} students have been added to your records.</p>
            <div className="mt-6">
                <button onClick={() => { onSuccess(); handleClose(); }} className="btn btn-primary">Done</button>
            </div>
        </div>
    );
    
    const renderContent = () => {
        switch (step) {
            case 'mapping': return renderMappingStep();
            case 'review': return renderReviewStep();
            case 'importing': return renderImportingStep();
            case 'success': return renderSuccessStep();
            case 'upload':
            default:
                return renderUploadStep();
        }
    };
    
    const title = {
        upload: "Import Students from CSV",
        mapping: "Map CSV Columns",
        review: "Review Data",
        importing: "Importing...",
        success: "Success!",
    }[step];


    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title}>
            <div className="p-6">
                 {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                 {renderContent()}
            </div>
        </Modal>
    );
};

export default ImportStudentsModal;