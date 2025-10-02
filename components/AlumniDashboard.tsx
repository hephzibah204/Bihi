
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { apiGetStudents } from '../services/api';
import { getSubdomain } from '../utils/subdomain';
import SearchIcon from './icons/SearchIcon';
import { Student } from '../types';

const PAGE_SIZE = 30;

const AlumniDashboard = () => {
    // FIX: The `alumni` state was not explicitly typed, preventing TypeScript from inferring that `graduationYear` would be a number. Adding the `Student[]` type allows the sort function's arithmetic operation to pass type checking.
    const [alumni, setAlumni] = useState<Student[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [loading, setLoading] = useState(true);

    const graduationYears = useMemo(() => {
        const years = alumni.map(a => a.graduationYear).filter(Boolean);
        return [...new Set(years)].sort((a, b) => b - a);
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
    
    if (loading) {
        return <div className="text-center p-8">Loading Alumni Directory...</div>
    }

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-2xl font-semibold">Alumni Directory</h2>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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

                 {(searchTerm || yearFilter) && (
                    <div className="mt-4 flex justify-between items-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Found {filteredAlumni.length} alumni matching your criteria.
                        </p>
                        <button onClick={handleClearFilters} className="btn btn-secondary text-sm">Clear Filters</button>
                    </div>
                )}
                
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
