import React, { useState, useEffect, useRef } from 'react';
import { apiGetStudents } from '../services/api';
import { getSubdomain } from '../utils/subdomain';

const PAGE_SIZE = 30;

const AlumniDashboard = () => {
    const [alumni, setAlumni] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

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
                const allStudents = await apiGetStudents(tenantId);
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
    
    const filteredAlumni = alumni.filter(alum =>
        alum.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (alum.graduationYear && alum.graduationYear.toString().includes(searchTerm))
    );
    
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
    }, [searchTerm]);

    const visibleAlumni = filteredAlumni.slice(0, visibleCount);
    
    if (loading) {
        return <div className="text-center p-8">Loading Alumni Directory...</div>
    }

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-2xl font-semibold">Alumni Directory</h2>
                <div className="mt-4">
                    <input 
                        type="text"
                        placeholder="Search by name or graduation year..."
                        className="input-field"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {filteredAlumni.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                            {visibleAlumni.map(alum => (
                                 <div key={alum.id} className="p-4 border dark:border-gray-700 rounded-lg flex items-center space-x-4">
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
        </div>
    );
};

export default AlumniDashboard;