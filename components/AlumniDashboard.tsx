import React, { useState, useEffect, useRef, useMemo } from 'react';
// Fix: Correct import path
import { apiGetStudents, apiSendAlumniEmail } from '../services/api';
import { getSubdomain } from '../utils/subdomain';
import SearchIcon from './icons/SearchIcon';
// Fix: Correct import path
import { Student } from '../types';
import Modal from './Modal';
import EnvelopeIcon from './icons/EnvelopeIcon';
import SkeletonLoader from './skeletons/SkeletonLoader';
import SpinnerIcon from './icons/SpinnerIcon';

const PAGE_SIZE = 30;

const AlumniCardSkeleton = () => (
    <div className="p-4 border rounded-lg flex items-center space-x-4">
        <SkeletonLoader className="h-16 w-16 rounded-full" />
        <div>
            <SkeletonLoader className="h-5 w-32 mb-2" />
            <SkeletonLoader className="h-4 w-24" />
        </div>
    </div>
);

const AlumniDashboard = () => {
    const [alumni, setAlumni] = useState<Student[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ message: '', type: '' });

    // Email Modal State
    const [isEmailModalOpen, setEmailModalOpen] = useState(false);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);

    const graduationYears = useMemo(() => {
        const years = alumni.map(a => a.graduationYear).filter((year): year is number => year != null);
        return [...new Set(years)].sort((a: number, b: number) => b - a);
    }, [alumni]);

    const filteredAlumni = useMemo(() => {
        return alumni.filter(alum => {
            const nameMatch = alum.name.toLowerCase().includes(searchTerm.toLowerCase());
            const yearMatch = !yearFilter || alum.graduationYear?.toString() === yearFilter;
            return nameMatch && yearMatch;
        });
    }, [alumni, searchTerm, yearFilter]);


    // State for virtualization/infinite scroll
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const loaderRef = useRef(null);

    useEffect(() => {
        const fetchAlumni = async () => {
            try {
                // Fix: Corrected call to getSubdomain. It takes no arguments.
                const tenantId = getSubdomain();
                if (!tenantId) {
                    setLoading(false);
                    return;
                }
                // Fix: Corrected call to apiGetStudents to match its function signature.
                const allStudents = await apiGetStudents();
                const graduatedStudents = allStudents.filter(s => s.status === 'alumni');
                setAlumni(graduatedStudents);
            } catch (error) {
                console.error("Failed to load alumni data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAlumni();
    }, []);
    
    
    // Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const first = entries[0];
            if (first.isIntersecting) {
                setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredAlumni.length));
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
    }, [filteredAlumni.length]);

    const handleSendEmail = async () => {
        if (!emailSubject || !emailBody || filteredAlumni.length === 0) {
            setNotification({ message: 'Subject and body are required.', type: 'error' });
            return;
        }
        setSendingEmail(true);
        setNotification({ message: '', type: '' });
        try {
            const recipients = filteredAlumni.map(alum => alum.parentEmail).filter((email): email is string => !!email);
            if (recipients.length === 0) {
                throw new Error("No valid email addresses found for the selected alumni.");
            }
            
            const { success, message } = await apiSendAlumniEmail(recipients, emailSubject, emailBody);

            if (success) {
                setNotification({ message: `Email sent to ${recipients.length} alumni.`, type: 'success' });
                setEmailModalOpen(false);
                setEmailSubject('');
                setEmailBody('');
            } else {
                throw new Error(message || "Failed to send email.");
            }
        } catch (error) {
            setNotification({ message: error.message, type: 'error' });
        } finally {
            setSendingEmail(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <AlumniCardSkeleton key={i} />)}
            </div>
        );
    }

    return (
        <div>
            <div className="card mb-6">
                <div className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex-1 w-full md:w-auto">
                        <div className="relative">
                            <input type="text" placeholder="Search by name..." className="input-field pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="input-field w-full md:w-auto">
                            <option value="">All Graduation Years</option>
                            {graduationYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                        <button onClick={() => setEmailModalOpen(true)} className="btn btn-primary flex-shrink-0">
                            <EnvelopeIcon className="w-5 h-5 mr-2" />
                            Email Alumni ({filteredAlumni.length})
                        </button>
                    </div>
                </div>
            </div>

            {notification.message && (
                <div className={`p-3 rounded-md mb-4 text-sm ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {notification.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAlumni.slice(0, visibleCount).map(alum => (
                    <div key={alum.id} className="card p-4 flex items-center space-x-4">
                        <img src={alum.photo || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(alum.name)}`} alt={alum.name} className="h-16 w-16 rounded-full object-cover" />
                        <div>
                            <p className="font-bold">{alum.name}</p>
                            <p className="text-sm text-gray-500">Graduated {alum.graduationYear}</p>
                        </div>
                    </div>
                ))}
            </div>

            {visibleCount < filteredAlumni.length && (
                <div ref={loaderRef} className="text-center p-4">
                    <SpinnerIcon className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                </div>
            )}

            <Modal isOpen={isEmailModalOpen} onClose={() => setEmailModalOpen(false)} title={`Email Alumni (${filteredAlumni.length} selected)`}>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="label">Subject</label>
                        <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="input-field" />
                    </div>
                    <div>
                        <label className="label">Body</label>
                        <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} className="input-field" rows={8}></textarea>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleSendEmail} className="btn btn-primary" disabled={sendingEmail}>
                            {sendingEmail ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Send Email'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AlumniDashboard;