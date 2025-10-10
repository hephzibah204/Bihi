import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { apiGetSchoolSettings, apiGetStudents, apiGetScratchCards, apiGetParents } from '../services/api';
import BriefcaseIcon from './icons/BriefcaseIcon';
import UsersIcon from './icons/UsersIcon';
// Fix: Corrected the import path for constants to be a relative path.
import { USER_ROLES } from '../utils/constants';
import { UserRole } from '../types';
import SelectChildModal from './SelectChildModal';

const PortalLogin = ({ onStudentLoginSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [schoolSettings, setSchoolSettings] = useState(null);
    const [activeTab, setActiveTab] = useState('student');

    // Staff login state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Student/Parent login state
    const [admissionNo, setAdmissionNo] = useState('');
    const [pin, setPin] = useState('');
    const [loginAs, setLoginAs] = useState<UserRole>(USER_ROLES.STUDENT);
    const [parentEmail, setParentEmail] = useState('');
    const [parentPassword, setParentPassword] = useState('');
    const [childrenToSelect, setChildrenToSelect] = useState([]);
    const [showPinLogin, setShowPinLogin] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await apiGetSchoolSettings();
                setSchoolSettings(settings);
            } catch (err) {
                console.error("Failed to load school settings for login page", err);
            }
        };
        fetchSettings();
    }, []);

    const handleStaffLogin = async (e) => {
        e.preventDefault();
        if (!supabase) {
            setError("Authentication service is not available.");
            return;
        }
        setError('');
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        setLoading(false);
    };
    
    const handleStudentParentLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const [allStudents, allScratchCards] = await Promise.all([
                apiGetStudents(),
                apiGetScratchCards()
            ]);
            
            const student = allStudents.find(s => s.admissionNo.toLowerCase() === admissionNo.toLowerCase().trim());
            const cardExists = allScratchCards.some(c => c.pin === pin.trim());

            if (student && cardExists) {
                sessionStorage.removeItem('isDemoMode'); // Clear demo flag on real login
                const sessionData = { role: loginAs, userId: student.id, studentName: student.name };
                sessionStorage.setItem('activeUser', JSON.stringify(sessionData));
                if(onStudentLoginSuccess) onStudentLoginSuccess(sessionData);
            } else {
                setError("Invalid admission number or PIN. Please check and try again.");
            }
        } catch (err) {
            setError("An error occurred while trying to log in. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleParentEmailLogin = async (e) => {
        e.preventDefault();
        if (!supabase) { setError("Auth service is not available."); return; }
        setError('');
        setLoading(true);

        const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
            email: parentEmail,
            password: parentPassword,
        });

        if (signInError) {
            setError(signInError.message);
            setLoading(false);
            return;
        }

        if (sessionData.user) {
            try {
                const allParents = await apiGetParents();
                const parent = allParents.find(p => p.email.toLowerCase() === sessionData.user.email.toLowerCase());
                
                if (!parent) {
                    setError("Parent profile not found for this account.");
                    await supabase.auth.signOut();
                    setLoading(false);
                    return;
                }

                const allStudents = await apiGetStudents();
                const children = allStudents.filter(s => s.parentId === parent.id);

                if (children.length === 0) {
                    setError("No students are linked to this parent account.");
                    await supabase.auth.signOut();
                } else if (children.length === 1) {
                    const sessionData = { role: USER_ROLES.PARENT, userId: children[0].id, studentName: children[0].name };
                    sessionStorage.setItem('activeUser', JSON.stringify(sessionData));
                    if(onStudentLoginSuccess) onStudentLoginSuccess(sessionData);
                } else {
                    setChildrenToSelect(children);
                }
            } catch (err) {
                setError("An error occurred after login. Please try again.");
                await supabase.auth.signOut();
            }
        }
        setLoading(false);
    };

    const handleSelectChild = (child) => {
        const sessionData = { role: USER_ROLES.PARENT, userId: child.id, studentName: child.name };
        sessionStorage.setItem('activeUser', JSON.stringify(sessionData));
        if (onStudentLoginSuccess) onStudentLoginSuccess(sessionData);
        setChildrenToSelect([]);
    };

    const schoolName = schoolSettings?.schoolName || 'School Portal';
    const schoolLogo = schoolSettings?.schoolLogo;

    const TabButton = ({ tabName, label, icon }) => {
        const isActive = activeTab === tabName;
        return (
            <button
                onClick={() => setActiveTab(tabName)}
                className={`flex-1 p-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                    isActive
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
                {icon}
                {label}
            </button>
        );
    };

    return (
        <>
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                    <div className="text-center">
                        {schoolLogo && <img src={schoolLogo} alt={`${schoolName} Logo`} className="w-20 h-20 mx-auto mb-4 rounded-full" />}
                        <h1 className="text-3xl font-bold text-gray-800">
                            Welcome to {schoolName}
                        </h1>
                        <p className="mt-2 text-gray-600">Please sign in to your portal.</p>
                    </div>

                    <div className="border-b border-gray-200">
                        <div className="flex -mb-px">
                            <TabButton tabName="student" label="Student/Parent" icon={<UsersIcon className="w-5 h-5"/>} />
                            <TabButton tabName="staff" label="Staff" icon={<BriefcaseIcon className="w-5 h-5"/>} />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                            {error}
                        </div>
                    )}

                    {activeTab === 'staff' ? (
                        <form className="space-y-6" onSubmit={handleStaffLogin}>
                            <div>
                                <label htmlFor="email" className="label">Email address</label>
                                <input id="email" type="email" autoComplete="email" required className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                            </div>
                            <div>
                                <label htmlFor="password" className="label">Password</label>
                                <input id="password" type="password" autoComplete="current-password" required className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                            </div>
                            <div>
                                <button type="submit" disabled={loading} className="w-full btn btn-primary">
                                    {loading ? 'Signing in...' : 'Sign In as Staff'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            {showPinLogin ? (
                                <form className="space-y-6" onSubmit={handleStudentParentLogin}>
                                    <div>
                                        <label htmlFor="admissionNo" className="label">Student's Admission Number</label>
                                        <input id="admissionNo" type="text" required className="input-field" value={admissionNo} onChange={(e) => setAdmissionNo(e.target.value)} placeholder="e.g., RS-001" />
                                    </div>
                                    <div>
                                        <label htmlFor="pin" className="label">Result Checker PIN</label>
                                        <input id="pin" type="password" required className="input-field" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="12-digit PIN" />
                                    </div>
                                    <div>
                                        <label className="label">I am a...</label>
                                        <div className="flex gap-4 mt-2">
                                            <label className="flex items-center"><input type="radio" name="role" value={USER_ROLES.STUDENT} checked={loginAs === USER_ROLES.STUDENT} onChange={() => setLoginAs(USER_ROLES.STUDENT)} className="form-radio h-4 w-4 text-indigo-600"/><span className="ml-2 text-sm text-gray-700">{USER_ROLES.STUDENT}</span></label>
                                            <label className="flex items-center"><input type="radio" name="role" value={USER_ROLES.PARENT} checked={loginAs === USER_ROLES.PARENT} onChange={() => setLoginAs(USER_ROLES.PARENT)} className="form-radio h-4 w-4 text-indigo-600"/><span className="ml-2 text-sm text-gray-700">{USER_ROLES.PARENT}</span></label>
                                        </div>
                                    </div>
                                    <div><button type="submit" disabled={loading} className="w-full btn btn-primary">{loading ? 'Signing in...' : 'Sign In'}</button></div>
                                    <p className="text-center text-sm"><button type="button" onClick={() => setShowPinLogin(false)} className="font-medium text-indigo-600 hover:text-indigo-500">&larr; Log in with Email and Password</button></p>
                                </form>
                            ) : (
                                <form className="space-y-6" onSubmit={handleParentEmailLogin}>
                                    <div>
                                        <label htmlFor="parentEmail" className="label">Parent's Email Address</label>
                                        <input id="parentEmail" type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)} autoComplete="email" required className="input-field" placeholder="parent@example.com" />
                                    </div>
                                    <div>
                                        <label htmlFor="parentPassword" className="label">Password</label>
                                        <input id="parentPassword" type="password" value={parentPassword} onChange={e => setParentPassword(e.target.value)} autoComplete="current-password" required className="input-field" placeholder="••••••••" />
                                    </div>
                                    <div><button type="submit" disabled={loading} className="w-full btn btn-primary">{loading ? 'Signing in...' : 'Sign In as Parent'}</button></div>
                                    <p className="text-center text-sm"><button type="button" onClick={() => setShowPinLogin(true)} className="font-medium text-indigo-600 hover:text-indigo-500">Or, log in with Admission No. & PIN &rarr;</button></p>
                                </form>
                            )}
                        </>
                    )}
                    <p className="text-center text-sm text-gray-500">
                        Not your school?{' '}
                        <a href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Find your portal
                        </a>
                    </p>
                </div>
            </div>
            <SelectChildModal 
                isOpen={childrenToSelect.length > 0}
                onClose={() => setChildrenToSelect([])}
                childrenList={childrenToSelect}
                onSelectChild={handleSelectChild}
            />
        </>
    );
};

export default PortalLogin;
