import React, { useState, useEffect, PropsWithChildren } from 'react';
import { apiGetSchoolSettings, apiSaveSchoolSettings, apiUploadSchoolLogo } from '../services/api';
import { SchoolSettings, ReportCardSkill, ClassLevel, ClassSection } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import FeatureControlSettings from './FeatureControlSettings';
import IntegrationSettings from './IntegrationSettings';
import ManualBankSettings from './ManualBankSettings';
import { CONTROLLABLE_FEATURES } from '../utils/constants';
import { Geofence } from '../types';

const TabButton = ({ view, active, onClick, children }: PropsWithChildren<{ view: string, active: boolean, onClick: (view: string) => void }>) => (
    <button
        onClick={() => onClick(view)}
        className={`px-4 py-2 font-semibold text-sm transition-colors ${active ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
    >
        {children}
    </button>
);

const GeneralSettings = ({ settings, onSettingsChange }) => {
    const [uploading, setUploading] = useState(false);
    const handleLogoFile = async (file?: File) => {
        if (!file) return;
        setUploading(true);
        try {
            const url = await apiUploadSchoolLogo(file);
            onSettingsChange({ schoolLogo: url });
            window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Logo uploaded successfully.' } }));
        } catch (e: any) {
            window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: `Logo upload failed: ${e?.message || 'Unknown error'}` } }));
        } finally {
            setUploading(false);
        }
    };
    return (
        <div className="space-y-4">
            <div><label className="label" htmlFor="schoolName">School Name</label><input id="schoolName" type="text" value={settings.schoolName || ''} onChange={e => onSettingsChange({ schoolName: e.target.value })} className="input-field" /></div>
            <div><label className="label" htmlFor="schoolAddress">School Address</label><input id="schoolAddress" type="text" value={settings.schoolAddress || ''} onChange={e => onSettingsChange({ schoolAddress: e.target.value })} className="input-field" /></div>
            <div>
                <label className="label" htmlFor="schoolLogoUpload">School Logo</label>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg border flex items-center justify-center bg-gray-50 overflow-hidden">
                        {settings.schoolLogo ? <img src={settings.schoolLogo} alt="Logo" className="w-full h-full object-contain" /> : <span className="text-xs text-gray-400">No logo</span>}
                    </div>
                    <div className="space-y-2">
                        <input id="schoolLogoUpload" type="file" accept="image/*" onChange={e => handleLogoFile(e.target.files?.[0])} />
                        <div className="text-xs text-gray-500">Supported: PNG, JPG, SVG. For hosted logos, you can still paste a URL below.</div>
                        <input id="schoolLogoUrl" aria-label="School logo URL" type="text" value={settings.schoolLogo || ''} onChange={e => onSettingsChange({ schoolLogo: e.target.value })} className="input-field" placeholder="Or paste logo URL" />
                        {settings.schoolLogo && (
                            <button type="button" className="btn btn-outline btn-sm" onClick={() => onSettingsChange({ schoolLogo: '' })}>Remove Logo</button>
                        )}
                    </div>
                </div>
                {uploading && <div className="text-xs text-indigo-600 mt-1">Uploading...</div>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="label" htmlFor="currentSession">Current Session</label><input id="currentSession" type="text" value={settings.session || ''} onChange={e => onSettingsChange({ session: e.target.value })} className="input-field" placeholder="e.g., 2023/2024" /></div>
                <div><label className="label" htmlFor="currentTerm">Current Term</label><select id="currentTerm" value={settings.term || ''} onChange={e => onSettingsChange({ term: e.target.value })} className="input-field"><option>First Term</option><option>Second Term</option><option>Third Term</option></select></div>
            </div>
        </div>
    );
};

const GradingSettings = ({ settings, onSettingsChange }) => {
    const handleChange = (index: number, field: string, value: any) => {
        const newGrading = [...(settings.gradingSystem || [])];
        newGrading[index] = { ...newGrading[index], [field]: value };
        onSettingsChange({ gradingSystem: newGrading });
    };

    const addGrade = () => {
        onSettingsChange({ gradingSystem: [...(settings.gradingSystem || []), { grade: '', from: 0, to: 0, remark: '' }] });
    };

    const removeGrade = (index: number) => {
        onSettingsChange({ gradingSystem: (settings.gradingSystem || []).filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <div><label className="label" htmlFor="maxCa1">Max CA 1 Score</label><input id="maxCa1" type="number" value={settings.maxCa1 || 0} onChange={e => onSettingsChange({ maxCa1: Number(e.target.value) })} className="input-field"/></div>
                <div><label className="label" htmlFor="maxCa2">Max CA 2 Score</label><input id="maxCa2" type="number" value={settings.maxCa2 || 0} onChange={e => onSettingsChange({ maxCa2: Number(e.target.value) })} className="input-field"/></div>
                <div><label className="label" htmlFor="maxExam">Max Exam Score</label><input id="maxExam" type="number" value={settings.maxExam || 0} onChange={e => onSettingsChange({ maxExam: Number(e.target.value) })} className="input-field"/></div>
            </div>
            <div className="space-y-2">
                {settings.gradingSystem?.map((grade, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-center">
                        <input type="text" placeholder="Grade" value={grade.grade} onChange={e => handleChange(index, 'grade', e.target.value)} className="input-field"/>
                        <input type="number" placeholder="From" value={grade.from} onChange={e => handleChange(index, 'from', Number(e.target.value))} className="input-field"/>
                        <input type="number" placeholder="To" value={grade.to} onChange={e => handleChange(index, 'to', Number(e.target.value))} className="input-field"/>
                        <input type="text" placeholder="Remark" value={grade.remark} onChange={e => handleChange(index, 'remark', e.target.value)} className="input-field"/>
                        <button onClick={() => removeGrade(index)} className="icon-button text-red-500"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                ))}
            </div>
            <button onClick={addGrade} className="btn btn-secondary"><PlusIcon className="w-4 h-4 mr-2"/>Add Grade</button>
        </div>
    );
};

const ReportCardSettingsTab = ({ settings, onSettingsChange }) => {
    const handleSkillChange = (type: 'affectiveSkills' | 'psychomotorSkills', index: number, value: string) => {
        const reportCardSettings = settings.reportCardSettings || { principalName: '', affectiveSkills: [], psychomotorSkills: [] };
        const newSkills = [...(reportCardSettings[type] || [])];
        newSkills[index] = { ...newSkills[index], label: value };
        onSettingsChange({ reportCardSettings: { ...reportCardSettings, [type]: newSkills } });
    };

    const addSkill = (type: 'affectiveSkills' | 'psychomotorSkills') => {
        const reportCardSettings = settings.reportCardSettings || { principalName: '', affectiveSkills: [], psychomotorSkills: [] };
        const newSkill: ReportCardSkill = { id: `skill_${Date.now()}`, label: '' };
        onSettingsChange({ reportCardSettings: { ...reportCardSettings, [type]: [...(reportCardSettings[type] || []), newSkill] } });
    };

    const removeSkill = (type: 'affectiveSkills' | 'psychomotorSkills', index: number) => {
        const reportCardSettings = settings.reportCardSettings || { principalName: '', affectiveSkills: [], psychomotorSkills: [] };
        onSettingsChange({ reportCardSettings: { ...reportCardSettings, [type]: (reportCardSettings[type] || []).filter((_, i) => i !== index) } });
    };
    
    const reportCardSettings = settings.reportCardSettings || { principalName: '', schoolMotto: '', affectiveSkills: [], psychomotorSkills: [] };
    const classicOptions = reportCardSettings.classicOptions || {};
    const classicTheme = reportCardSettings.classicTheme || {};

    return (
        <div className="space-y-4">
            <div><label className="label" htmlFor="principalName">Principal's Name</label><input id="principalName" type="text" value={reportCardSettings.principalName || ''} onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, principalName: e.target.value } })} className="input-field" /></div>
            <div><label className="label" htmlFor="schoolMotto">School Motto</label><input id="schoolMotto" type="text" value={reportCardSettings.schoolMotto || ''} onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, schoolMotto: e.target.value } })} className="input-field" /></div>
            <div><label className="label" htmlFor="nextTermBeginsDate">Next Term Begins</label><input id="nextTermBeginsDate" type="text" placeholder="e.g., Sept 16, 2024" value={reportCardSettings.nextTermBeginsDate || ''} onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, nextTermBeginsDate: e.target.value } })} className="input-field" /></div>
            <div>
              <label className="label" htmlFor="primaryTemplate">Primary Report Card Template</label>
              <select
                id="primaryTemplate"
                className="input-field"
                value={reportCardSettings.primaryTemplate || 'primary_default'}
                onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, primaryTemplate: e.target.value } })}
              >
                <option value="primary_default">Default (Primary)</option>
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="minimalist">Minimalist</option>
              </select>
            </div>

            {/* Classic Template Options */}
            <div className="p-4 border rounded-md">
              <h4 className="font-semibold mb-2">Classic Template Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={classicOptions.showLogo ?? true} onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, classicOptions: { ...classicOptions, showLogo: e.target.checked } } })} />
                  <span>Show School Logo</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={classicOptions.showStudentPhoto ?? true} onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, classicOptions: { ...classicOptions, showStudentPhoto: e.target.checked } } })} />
                  <span>Show Student Photograph</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={classicOptions.showAttendance ?? true} onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, classicOptions: { ...classicOptions, showAttendance: e.target.checked } } })} />
                  <span>Show Attendance Summary</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={classicOptions.showAffective ?? true} onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, classicOptions: { ...classicOptions, showAffective: e.target.checked } } })} />
                  <span>Show Affective Skills</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={classicOptions.showPsychomotor ?? true} onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, classicOptions: { ...classicOptions, showPsychomotor: e.target.checked } } })} />
                  <span>Show Psychomotor Skills</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={classicOptions.showGradeScale ?? true} onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, classicOptions: { ...classicOptions, showGradeScale: e.target.checked } } })} />
                  <span>Show Grade Scale</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={classicOptions.showPerformance ?? true} onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, classicOptions: { ...classicOptions, showPerformance: e.target.checked } } })} />
                  <span>Show Performance Summary</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={classicOptions.showGradeAnalysis ?? true} onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, classicOptions: { ...classicOptions, showGradeAnalysis: e.target.checked } } })} />
                  <span>Show Grade Analysis</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={classicOptions.showRatingIndices ?? true} onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, classicOptions: { ...classicOptions, showRatingIndices: e.target.checked } } })} />
                  <span>Show Rating Indices</span>
                </label>
                <div>
                  <label className="label" htmlFor="summariesLocation">Summaries Location</label>
                  <select id="summariesLocation" className="input-field" value={classicOptions.summariesLocation || 'below_subjects'} onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, classicOptions: { ...classicOptions, summariesLocation: e.target.value } } })}>
                    <option value="above_subjects">Above Subjects</option>
                    <option value="below_subjects">Below Subjects</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="label" htmlFor="classicHeaderColor">Header Color</label>
                  <input id="classicHeaderColor" type="text" className="input-field" placeholder="#4f81bd" value={classicTheme.headerColor || ''} onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, classicTheme: { ...classicTheme, headerColor: e.target.value } } })} />
                </div>
                <div>
                  <label className="label" htmlFor="classicBandColor">Band Color</label>
                  <input id="classicBandColor" type="text" className="input-field" placeholder="#d9e1f2" value={classicTheme.bandColor || ''} onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, classicTheme: { ...classicTheme, bandColor: e.target.value } } })} />
                </div>
                <div>
                  <label className="label" htmlFor="classicHeaderTitle">Header Title</label>
                  <input id="classicHeaderTitle" type="text" className="input-field" placeholder="Term Report Title" value={reportCardSettings.classicHeaderTitle || ''} onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, classicHeaderTitle: e.target.value } })} />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold">Affective Skills</h4>
                    {reportCardSettings.affectiveSkills.map((skill, index) => (
                        <div key={skill.id} className="flex items-center gap-2 mt-2">
                            <input type="text" aria-label={`Affective skill ${index + 1}`} value={skill.label} onChange={e => handleSkillChange('affectiveSkills', index, e.target.value)} className="input-field" />
                            <button onClick={() => removeSkill('affectiveSkills', index)}><TrashIcon className="w-4 h-4 text-red-500"/></button>
                        </div>
                    ))}
                    <button onClick={() => addSkill('affectiveSkills')} className="btn btn-secondary text-sm mt-2"><PlusIcon className="w-4 h-4 mr-1"/>Add</button>
                </div>
                 <div>
                    <h4 className="font-semibold">Psychomotor Skills</h4>
                    {reportCardSettings.psychomotorSkills.map((skill, index) => (
                        <div key={skill.id} className="flex items-center gap-2 mt-2">
                            <input type="text" aria-label={`Psychomotor skill ${index + 1}`} value={skill.label} onChange={e => handleSkillChange('psychomotorSkills', index, e.target.value)} className="input-field" />
                            <button onClick={() => removeSkill('psychomotorSkills', index)}><TrashIcon className="w-4 h-4 text-red-500"/></button>
                        </div>
                    ))}
                    <button onClick={() => addSkill('psychomotorSkills')} className="btn btn-secondary text-sm mt-2"><PlusIcon className="w-4 h-4 mr-1"/>Add</button>
                </div>
            </div>
        </div>
    );
};

const GeofencingSettings = ({ settings, onSettingsChange }: { settings: any, onSettingsChange: (changed: any) => void }) => {
    const geofences: Geofence[] = settings.premisesGeofences || [];
    const rules = settings.geofenceRules || {};

    const addGeofence = () => {
        const newFence: Geofence = { type: 'circle', name: '', center: { lat: 0, lng: 0 }, radius_m: 50 } as any;
        onSettingsChange({ premisesGeofences: [...geofences, newFence] });
    };

    const updateFence = (index: number, field: string, value: any) => {
        const next = [...geofences];
        next[index] = { ...next[index], [field]: value };
        onSettingsChange({ premisesGeofences: next });
    };

    const updateFenceCenter = (index: number, coord: 'lat' | 'lng', value: number) => {
        const next = [...geofences];
        const center = next[index].center || { lat: 0, lng: 0 };
        next[index] = { ...next[index], center: { ...center, [coord]: value } };
        onSettingsChange({ premisesGeofences: next });
    };

    const setFenceCenterFromCurrent = (index: number) => {
        if (!('geolocation' in navigator)) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            updateFenceCenter(index, 'lat', pos.coords.latitude);
            updateFenceCenter(index, 'lng', pos.coords.longitude);
        });
    };

    const updateFenceType = (index: number, type: 'circle' | 'polygon') => {
        const next = [...geofences];
        if (type === 'circle') {
            next[index] = { type, name: next[index].name || '', center: next[index].center || { lat: 0, lng: 0 }, radius_m: next[index].radius_m ?? 50 } as any;
        } else {
            next[index] = { type, name: next[index].name || '', polygon: next[index].polygon || [{ lat: 0, lng: 0 }, { lat: 0.001, lng: 0 }, { lat: 0, lng: 0.001 }] } as any;
        }
        onSettingsChange({ premisesGeofences: next });
    };

    const addPolygonPoint = (index: number) => {
        const next = [...geofences];
        const pts = next[index].polygon || [];
        next[index] = { ...next[index], polygon: [...pts, { lat: 0, lng: 0 }] } as any;
        onSettingsChange({ premisesGeofences: next });
    };

    const addPolygonPointFromCurrent = (index: number) => {
        if (!('geolocation' in navigator)) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            const next = [...geofences];
            const pts = next[index].polygon || [];
            next[index] = { ...next[index], polygon: [...pts, { lat: pos.coords.latitude, lng: pos.coords.longitude }] } as any;
            onSettingsChange({ premisesGeofences: next });
        });
    };

    const addGeofenceFromCurrent = (radius_m: number) => {
        if (!('geolocation' in navigator)) return;
        navigator.geolocation.getCurrentPosition((pos) => {
            const newFence: Geofence = { type: 'circle', name: 'Primary Location', center: { lat: pos.coords.latitude, lng: pos.coords.longitude }, radius_m } as any;
            onSettingsChange({ premisesGeofences: [...geofences, newFence] });
        });
    };

    const updatePolygonPoint = (index: number, pointIndex: number, coord: 'lat' | 'lng', value: number) => {
        const next = [...geofences];
        const pts = [...(next[index].polygon || [])];
        const p = { ...(pts[pointIndex] || { lat: 0, lng: 0 }), [coord]: value } as any;
        pts[pointIndex] = p;
        next[index] = { ...next[index], polygon: pts } as any;
        onSettingsChange({ premisesGeofences: next });
    };

    const removePolygonPoint = (index: number, pointIndex: number) => {
        const next = [...geofences];
        const pts = (next[index].polygon || []).filter((_, i) => i !== pointIndex);
        next[index] = { ...next[index], polygon: pts } as any;
        onSettingsChange({ premisesGeofences: next });
    };

    const removeFence = (index: number) => {
        const next = geofences.filter((_, i) => i !== index);
        onSettingsChange({ premisesGeofences: next });
    };

    return (
        <div className="space-y-6">
            <div className="p-4 border rounded-md">
                <h4 className="font-semibold mb-2">Premises Geofences</h4>
                <p className="text-xs text-gray-500 mb-4">Define one or more circular geofences around your school premises. Validation currently supports circle type.</p>
                <div className="flex items-center gap-3 mb-3">
                    <input id="new-radius" type="number" className="input-field w-40" placeholder="Radius (m)" defaultValue={100} />
                    <button type="button" className="btn btn-secondary" onClick={() => {
                        const el = document.getElementById('new-radius') as HTMLInputElement;
                        const r = Number(el?.value || 100);
                        addGeofenceFromCurrent(isNaN(r) ? 100 : r);
                    }}>Add From My Location</button>
                </div>
                <div className="space-y-3">
                    {geofences.map((g, idx) => (
                        <div key={idx} className="space-y-3 border rounded-md p-3">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                                <div>
                                    <label className="label" htmlFor={`gf-name-${idx}`}>Name</label>
                                    <input id={`gf-name-${idx}`} type="text" value={g.name || ''} onChange={e => updateFence(idx, 'name', e.target.value)} className="input-field" />
                                </div>
                                <div>
                                    <label className="label" htmlFor={`gf-type-${idx}`}>Type</label>
                                    <select id={`gf-type-${idx}`} className="input-field" value={g.type} onChange={e => updateFenceType(idx, e.target.value as any)}>
                                        <option value="circle">Circle</option>
                                        <option value="polygon">Polygon</option>
                                    </select>
                                </div>
                                <div className="flex items-center md:justify-end">
                                    <button onClick={() => removeFence(idx)} className="icon-button text-red-500" title="Remove geofence"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                            {g.type === 'circle' ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="label" htmlFor={`gf-lat-${idx}`}>Center Lat</label>
                                        <input id={`gf-lat-${idx}`} type="number" value={g.center?.lat ?? 0} onChange={e => updateFenceCenter(idx, 'lat', Number(e.target.value))} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="label" htmlFor={`gf-lng-${idx}`}>Center Lng</label>
                                        <input id={`gf-lng-${idx}`} type="number" value={g.center?.lng ?? 0} onChange={e => updateFenceCenter(idx, 'lng', Number(e.target.value))} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="label" htmlFor={`gf-radius-${idx}`}>Radius (m)</label>
                                        <input id={`gf-radius-${idx}`} type="number" value={g.radius_m ?? 0} onChange={e => updateFence(idx, 'radius_m', Number(e.target.value))} className="input-field" />
                                    </div>
                                    <div className="md:col-span-3">
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFenceCenterFromCurrent(idx)}>Use My Location</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <h5 className="font-medium text-sm">Polygon Points</h5>
                                        <div className="flex gap-2">
                                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => addPolygonPoint(idx)}><PlusIcon className="w-3 h-3 mr-1"/>Add Point</button>
                                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => addPolygonPointFromCurrent(idx)}>Add Point From My Location</button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {(g.polygon || []).map((pt, pIdx) => (
                                            <div key={pIdx} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                                                <input type="number" className="input-field" value={pt.lat ?? 0} onChange={e => updatePolygonPoint(idx, pIdx, 'lat', Number(e.target.value))} aria-label={`point ${pIdx+1} lat`} />
                                                <input type="number" className="input-field" value={pt.lng ?? 0} onChange={e => updatePolygonPoint(idx, pIdx, 'lng', Number(e.target.value))} aria-label={`point ${pIdx+1} lng`} />
                                                <button type="button" className="icon-button text-red-500" onClick={() => removePolygonPoint(idx, pIdx)} title="Remove point"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addGeofence} className="btn btn-secondary mt-3"><PlusIcon className="w-4 h-4 mr-2"/>Add Geofence</button>
            </div>

            <div className="p-4 border rounded-md">
                <h4 className="font-semibold mb-2">Geofence Rules</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="label" htmlFor="geoMode">Operation Mode</label>
                        <select id="geoMode" className="input-field" value={rules.mode || 'manual'} onChange={e => onSettingsChange({ geofenceRules: { ...rules, mode: e.target.value } })}>
                            <option value="disabled">Disabled</option>
                            <option value="manual">Manual</option>
                            <option value="automatic">Automatic</option>
                        </select>
                    </div>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={rules.geofenceRequired ?? false} onChange={e => onSettingsChange({ geofenceRules: { ...rules, geofenceRequired: e.target.checked } })} />
                        <span>Require geofence for teacher sign-in</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={rules.allowManualMarking ?? true} onChange={e => onSettingsChange({ geofenceRules: { ...rules, allowManualMarking: e.target.checked } })} />
                        <span>Allow manual sign-in</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={rules.autoSignInEnabled ?? false} onChange={e => onSettingsChange({ geofenceRules: { ...rules, autoSignInEnabled: e.target.checked } })} />
                        <span>Auto sign-in when inside premises</span>
                    </label>
                    <div>
                        <label className="label" htmlFor="autoSignInGraceMinutes">Auto Sign-in Grace (minutes)</label>
                        <input id="autoSignInGraceMinutes" type="number" value={rules.autoSignInGraceMinutes ?? 5} onChange={e => onSettingsChange({ geofenceRules: { ...rules, autoSignInGraceMinutes: Number(e.target.value) } })} className="input-field" />
                    </div>
                    <div>
                        <label className="label" htmlFor="minAccuracy">Minimum Accuracy (m)</label>
                        <input id="minAccuracy" type="number" value={rules.minAccuracy_m ?? 70} onChange={e => onSettingsChange({ geofenceRules: { ...rules, minAccuracy_m: Number(e.target.value) } })} className="input-field" />
                    </div>
                    <div>
                        <label className="label" htmlFor="graceRadius">Grace Radius (m)</label>
                        <input id="graceRadius" type="number" value={rules.graceRadius_m ?? 0} onChange={e => onSettingsChange({ geofenceRules: { ...rules, graceRadius_m: Number(e.target.value) } })} className="input-field" />
                    </div>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={rules.requireTwoCaptures ?? false} onChange={e => onSettingsChange({ geofenceRules: { ...rules, requireTwoCaptures: e.target.checked } })} />
                        <span>Require two consecutive valid captures to confirm</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={rules.autoSignoutEnabled ?? false} onChange={e => onSettingsChange({ geofenceRules: { ...rules, autoSignoutEnabled: e.target.checked } })} />
                        <span>Auto signout when outside premises</span>
                    </label>
                    <div>
                        <label className="label" htmlFor="signoutGraceMinutes">Signout Grace (minutes)</label>
                        <input id="signoutGraceMinutes" type="number" value={rules.signoutGraceMinutes ?? 10} onChange={e => onSettingsChange({ geofenceRules: { ...rules, signoutGraceMinutes: Number(e.target.value) } })} className="input-field" />
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Accuracy gate rejects readings above the threshold. Grace radius adds tolerance outside the perimeter.</p>
            </div>
        </div>
    );
};

const ClassSettings = ({ settings, onSettingsChange }) => {
    const structure = settings.schoolStructure || { levels: [], sections: [] };

    const handleLevelChange = (index, value) => {
        const newLevels = [...structure.levels];
        newLevels[index].name = value;
        onSettingsChange({ schoolStructure: { ...structure, levels: newLevels } });
    };

    const handleSectionChange = (index, value) => {
        const newSections = [...(structure.sections || [])];
        newSections[index].name = value;
        onSettingsChange({ schoolStructure: { ...structure, sections: newSections } });
    };

    const addSection = () => {
        const newSection: ClassSection = { id: `sec_${Date.now()}`, name: '' };
        const next = [...(structure.sections || []), newSection];
        onSettingsChange({ schoolStructure: { ...structure, sections: next } });
    };

    const removeSection = (index: number) => {
        const next = (structure.sections || []).filter((_, i) => i !== index);
        onSettingsChange({ schoolStructure: { ...structure, sections: next } });
    };

    const addLevel = () => {
        const newLevel: ClassLevel = { id: `level_${Date.now()}`, name: '', classes: [] };
        onSettingsChange({ schoolStructure: { ...structure, levels: [...structure.levels, newLevel] } });
    };

    const removeLevel = (index) => {
        onSettingsChange({ schoolStructure: { ...structure, levels: structure.levels.filter((_, i) => i !== index) } });
    };
    
    const addClassToLevel = (levelIndex) => {
        const newLevels = [...structure.levels];
        const newClass = { id: `class_${Date.now()}`, name: '' };
        newLevels[levelIndex].classes.push(newClass);
        onSettingsChange({ schoolStructure: { ...structure, levels: newLevels } });
    };
    
     const handleClassNameChange = (levelIndex, classIndex, value) => {
        const newLevels = [...structure.levels];
        newLevels[levelIndex].classes[classIndex].name = value;
        onSettingsChange({ schoolStructure: { ...structure, levels: newLevels } });
    };
    
    const removeClassFromLevel = (levelIndex, classIndex) => {
        const newLevels = [...structure.levels];
        newLevels[levelIndex].classes.splice(classIndex, 1);
        onSettingsChange({ schoolStructure: { ...structure, levels: newLevels } });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-semibold">Class Levels</h4>
                <p className="text-xs text-gray-500 mb-2">e.g., Nursery, Primary, JSS</p>
                <div className="space-y-4">
                    {structure.levels.map((level, levelIndex) => (
                        <div key={level.id} className="p-3 border rounded-md">
                            <div className="flex items-center gap-2">
                                <input type="text" value={level.name} onChange={e => handleLevelChange(levelIndex, e.target.value)} className="input-field font-semibold" placeholder="Level Name"/>
                                <button onClick={() => removeLevel(levelIndex)} className="icon-button text-red-500"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                            <div className="pl-4 mt-2 space-y-2">
                                {level.classes.map((cls, classIndex) => (
                                    <div key={cls.id} className="flex items-center gap-2">
                                        <input type="text" value={cls.name} onChange={e => handleClassNameChange(levelIndex, classIndex, e.target.value)} className="input-field text-sm" placeholder="Class Name (e.g., 1, 2)"/>
                                        <button onClick={() => removeClassFromLevel(levelIndex, classIndex)} className="icon-button text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                ))}
                                <button onClick={() => addClassToLevel(levelIndex)} className="btn btn-secondary btn-sm text-xs"><PlusIcon className="w-3 h-3 mr-1"/> Add Class</button>
                            </div>
                        </div>
                    ))}
                </div>
                 <button onClick={addLevel} className="btn btn-secondary mt-4"><PlusIcon className="w-4 h-4 mr-2"/> Add Level</button>
            </div>
            <div>
                <h4 className="font-semibold">Class Sections / Arms</h4>
                <p className="text-xs text-gray-500 mb-2">e.g., A, B, Gold, Blue</p>
                <div className="space-y-2">
                    {(structure.sections || []).map((section, index) => (
                        <div key={section.id} className="flex items-center gap-2">
                            <input type="text" value={section.name} onChange={e => handleSectionChange(index, e.target.value)} className="input-field" placeholder="Section Name"/>
                            <button onClick={() => removeSection(index)} className="icon-button text-red-500" title="Remove section"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    ))}
                </div>
                <button onClick={addSection} className="btn btn-secondary mt-3"><PlusIcon className="w-4 h-4 mr-2"/> Add Section</button>
            </div>
        </div>
    );
};


// School Settings Component - Fixed duplicate declaration issue
const SchoolSettingsComponent = () => {
    const [settings, setSettings] = useState<Partial<SchoolSettings> | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        apiGetSchoolSettings().then(data => {
            const base = data || {};
            const existingFeatures = base.features || {};
            const normalizedFeatures = { ...existingFeatures } as Record<string, boolean>;
            // Ensure all controllable features default to enabled when not yet configured
            CONTROLLABLE_FEATURES.forEach(f => {
                if (normalizedFeatures[f.key] === undefined) {
                    normalizedFeatures[f.key] = true;
                }
            });
            setSettings({ ...base, features: normalizedFeatures });
            setLoading(false);
        });
    }, []);

    const handleSettingsChange = (changed: Partial<SchoolSettings>) => {
        setSettings(prev => ({ ...prev, ...changed }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiSaveSchoolSettings(settings as SchoolSettings);
            window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: 'settings' } }));
            window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Settings saved successfully!' } }));
        } catch (error) {
            window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: 'Error saving settings.' } }));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="card p-6">Loading settings...</div>;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general': return settings ? <GeneralSettings settings={settings} onSettingsChange={handleSettingsChange} /> : null;
            case 'classes': return settings ? <ClassSettings settings={settings} onSettingsChange={handleSettingsChange} /> : null;
            case 'grading': return settings ? <GradingSettings settings={settings} onSettingsChange={handleSettingsChange} /> : null;
            case 'report-card': return settings ? <ReportCardSettingsTab settings={settings} onSettingsChange={handleSettingsChange} /> : null;
            case 'geofencing': return settings ? <GeofencingSettings settings={settings} onSettingsChange={handleSettingsChange} /> : null;
            case 'features': return settings ? <FeatureControlSettings settings={settings} onSettingsChange={handleSettingsChange} /> : null;
            case 'integrations': return settings ? <IntegrationSettings settings={settings} onSettingsChange={handleSettingsChange} /> : null;
            case 'payments': return settings ? <ManualBankSettings settings={settings} onSettingsChange={handleSettingsChange} /> : null;
            default: return null;
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">School Settings</h1>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                    {saving ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Save Settings'}
                </button>
            </div>
            
            <div className="card">
                <div className="p-6">
                    <div className="border-b flex flex-wrap">
                        <TabButton view="general" active={activeTab === 'general'} onClick={setActiveTab}>General</TabButton>
                        <TabButton view="classes" active={activeTab === 'classes'} onClick={setActiveTab}>Classes</TabButton>
                        <TabButton view="grading" active={activeTab === 'grading'} onClick={setActiveTab}>Grading</TabButton>
                        <TabButton view="report-card" active={activeTab === 'report-card'} onClick={setActiveTab}>Report Card</TabButton>
                        <TabButton view="geofencing" active={activeTab === 'geofencing'} onClick={setActiveTab}>Geofencing</TabButton>
                        <TabButton view="features" active={activeTab === 'features'} onClick={setActiveTab}>Features</TabButton>
                        <TabButton view="integrations" active={activeTab === 'integrations'} onClick={setActiveTab}>Integrations</TabButton>
                        <TabButton view="payments" active={activeTab === 'payments'} onClick={setActiveTab}>Payments</TabButton>
                    </div>
                    <div className="mt-6">{renderTabContent()}</div>
                </div>
            </div>
        </div>
    );
};

export default SchoolSettingsComponent;
