import React, { useState, useEffect, useRef, useMemo } from 'react';
import { apiGetStudents, apiSendAlumniEmail } from '../services/api';
import { getSubdomain } from '../utils/subdomain';
import SearchIcon from './icons/SearchIcon';
import { Student } from '../types';
import Modal from './Modal';
import EnvelopeIcon from './icons/EnvelopeIcon';

const PAGE_SIZE = 30;

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
                const tenantId = getSubdomain(window.location.hostname);
                if (!tenantId) {
                    setLoading(false);
                    return;
                }
                // Fix: Pass an empty filter object as the first argument and the tenant ID as the second.
                const allStudents = await apiGetStudents({}, tenantId);
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
    }, [loaderRef, filteredAlumni.length]);

    // Reset visible count on search
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [filteredAlumni]);

    const visibleAlumni = filteredAlumni.slice(0, visibleCount);

    const handleClearFilters = () => {
        setSearchTerm('');
        setYearFilter('');
    };
    
    const handleSendEmail = async () => {
        if (!emailSubject || !emailBody) {
            setNotification({ message: 'Email subject and body are required.', type: 'error' });
            return;
        }

        setSendingEmail(true);
        setNotification({ message: '', type: '' });

        const recipients = filteredAlumni
            .map(a => a.parentEmail) // Assuming parentEmail is the contact for alumni
            .filter(email => email && email.includes('@'));

        if (recipients.length === 0) {
            setNotification({ message: 'No alumni with valid email addresses in the current selection.', type: 'error' });
            setSendingEmail(false);
            return;
        }

        try {
            await apiSendAlumniEmail(recipients, emailSubject, emailBody);
            setNotification({ message: 'Email sent successfully!', type: 'success' });
            setEmailModalOpen(false);
            setEmailSubject('');
            setEmailBody('');
        } catch (error) {
            setNotification({ message: `Failed to send email: ${error.message}`, type: 'error' });
        } finally {
            setSendingEmail(false);
        }
    };
    
    if (loading) {
        return <div className="text-center p-8">Loading Alumni Directory...</div>
    }

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-2xl font-semibold">Alumni Directory</h2>

                {notification.message && (
                    <div className={`my-4 p-3 text-sm rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {notification.message}
                    </div>
                )}

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                     <div className="md:col-span-2 relative">
                         <input 
                            type="text"
                            placeholder="Search by name..."
                            className="input-field pl-10"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                         <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                     </div>
                     <div>
                        <select className="input-field" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                            <option value="">Filter by Year</option>
                            {graduationYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                     </div>
                </div>

                 <div className="mt-4 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                        Showing {filteredAlumni.length} alumni.
                    </p>
                    <div className="flex items-center space-x-2">
                        {(searchTerm || yearFilter) && (
                            <button onClick={handleClearFilters} className="btn btn-secondary text-sm">Clear Filters</button>
                        )}
                        <button onClick={() => setEmailModalOpen(true)} className="btn btn-primary">
                            <EnvelopeIcon className="w-5 h-5 mr-2" />
                            Email Alumni
                        </button>
                    </div>
                </div>
                
                {filteredAlumni.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                            {visibleAlumni.map(alum => (
                                 <div key={alum.id} className="p-4 border rounded-lg flex items-center space-x-4">
                                    <img 
                                        src={alum.photo || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(alum.name)}`} 
                                        alt={alum.name} 
                                        className="h-16 w-16 rounded-full object-cover" 
                                    />
                                    <div>
                                        <p className="font-bold">{alum.name}</p>
                                        {alum.graduationYear && (
                                            <p className="text-sm text-gray-500">Class of {alum.graduationYear}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {visibleCount < filteredAlumni.length && (
                            <div ref={loaderRef} className="mt-6 text-center text-gray-500">
                                Loading more alumni...
                            </div>
                        )}
                    </>
                ) : (
                    <div className="mt-6 text-center text-gray-500">
                        <p>No alumni found matching your search.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isEmailModalOpen} onClose={() => setEmailModalOpen(false)} title="Send Email to Alumni">
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                        Your message will be sent to <strong>{filteredAlumni.filter(a => a.parentEmail).length} alumni</strong> with an email address based on your current filters.
                    </p>
                    <div>
                        <label className="label">Subject</label>
                        <input
                            type="text"
                            className="input-field"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            placeholder="Announcing our annual reunion"
                        />
                    </div>
                    <div>
                        <label className="label">Message</label>
                        <textarea
                            className="input-field"
                            rows={8}
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            placeholder="Dear Alumni..."
                        />
                    </div>
                    <div className="flex justify-end pt-2 space-x-2">
                        <button onClick={() => setEmailModalOpen(false)} className="btn btn-secondary">Cancel</button>
                        <button onClick={handleSendEmail} className="btn btn-primary" disabled={sendingEmail}>
                            {sendingEmail ? 'Sending...' : 'Send Email'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AlumniDashboard;