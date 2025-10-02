import React, { useState } from 'react';
import Modal from './Modal';
import { updateStudents } from '../services/api';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';

const ImportStudentsModal = ({ isOpen, onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
    };

    const handleImport = async () => {
        if (!file) {
            setError('Please select a CSV file to import.');
            return;
        }
        setImporting(true);
        setError('');

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const csv = event.target.result;
                // Fix: Ensure the file content is a string before splitting.
                if (typeof csv !== 'string') {
                    setError('Could not read the file content as text.');
                    setImporting(false);
                    return;
                }
                const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
                const headers = lines[0].split(',').map(h => h.trim());
                
                const newStudents = lines.slice(1).map(line => {
                    const data = line.split(',').map(d => d.trim());
                    // FIX: Cast the initial object in reduce to Record<string, any> to allow adding properties dynamically.
                    const student = headers.reduce((obj, nextKey, index) => {
                        obj[nextKey] = data[index];
                        return obj;
                    }, {} as Record<string, any>);
                    student.id = `std_${Date.now()}_${Math.random()}`; // Generate unique ID
                    return student;
                });
                
                await updateStudents(existingStudents => [...existingStudents, ...newStudents]);
                
                onSuccess();

            } catch (err) {
                console.error("CSV Parsing or saving error:", err);
                setError('Failed to import students. Please check the file format.');
            } finally {
                setImporting(false);
            }
        };
        reader.readAsText(file);
    };
    
    const csvContent = "name,class,admissionNo,gender,dob\nJohn Doe,JSS 1,RS-101,Male,2010-01-15\nJane Smith,JSS 1,RS-102,Female,2010-02-20";
    const csvSampleUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import Students from CSV">
            <div className="p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Upload a CSV file with headers: <code>name,class,admissionNo,gender,dob</code>.
                    <a href={csvSampleUri} download="student_import_sample.csv" className="text-indigo-600 ml-2 underline">Download sample CSV</a>
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

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                <div className="flex justify-end pt-6">
                    <button onClick={onClose} className="btn btn-secondary mr-2">Cancel</button>
                    <button onClick={handleImport} className="btn btn-primary" disabled={importing || !file}>
                        {importing ? 'Importing...' : 'Import Students'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ImportStudentsModal;