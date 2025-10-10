import React, { useState, useEffect, useRef, useMemo } from 'react';
// Fix: Correct import path
import { apiGetStudents, apiSendAlumniEmail } from '../services/api';
import { getSubdomain } from '../utils/subdomain';
import SearchIcon from './icons/SearchIcon';
// Fix: Correct import path
import { Student } from '../types';
import Modal from './Modal';
import EnvelopeIcon from './icons/EnvelopeIcon';
import SkeletonLoader from './SkeletonLoader';

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
                observer.unobserve(