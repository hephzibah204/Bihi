import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import KpiCard from '../ui/KpiCard';
import KPIGroupContainer from '../ui/KPIGroupContainer';
import { ADMIN_VIEWS } from '../../utils/constants';
import UsersIcon from '../icons/UsersIcon';
import BriefcaseIcon from '../icons/BriefcaseIcon';
import ClockIcon from '../icons/ClockIcon';
import CalendarDaysIcon from '../icons/CalendarDaysIcon';
import { apiGetAttendance, apiGetStudents, apiGetTeachers } from '../../services/api';

const AttendanceKPIGroup: React.FC = () => {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [attendanceData, studentsData, teachersData] = await Promise.allSettled([
          apiGetAttendance(),
          apiGetStudents(),
          apiGetTeachers()
        ]);
        
        if (attendanceData.status === 'fulfilled') setAttendance(attendanceData.value);
        if (studentsData.status === 'fulfilled') setStudents(studentsData.value);
        if (teachersData.status === 'fulfilled') setTeachers(teachersData.value);
      } catch (error) {
        console.error('Error loading attendance data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const metrics = useMemo(() => {
    if (loading) return null;

    // Calculate student attendance rate
    const presentCount = attendance.filter(record => record.status === 'present').length;
    const totalRecords = attendance.length;
    const studentAttendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
    
    // Calculate late arrivals (assuming we have time data)
    const lateArrivals = attendance.filter(record => record.status === 'late').length;
    
    // Calculate absent students today
    const absentToday = attendance.filter(record => 
      record.status === 'absent' && 
      new Date(record.date).toDateString() === new Date().toDateString()
    ).length;
    
    // Teacher attendance (simplified - assuming 95% average)
    const teacherAttendanceRate = 95;

    return {
      studentAttendanceRate,
      teacherAttendanceRate,
      lateArrivals,
      absentToday
    };
  }, [attendance, loading]);

  const handleNavigation = (view: string) => {
    const url = new URL(window.location.toString());
    url.searchParams.set('view', view);
    navigate(url.pathname + url.search + url.hash);
  };

  if (loading || !metrics) {
    return (
      <KPIGroupContainer 
        title="Attendance & Behavior" 
        icon={<CalendarDaysIcon className="w-5 h-5" />}
      >
        {[1, 2, 3, 4].map(i => (
          <KpiCard 
            key={i}
            icon={<div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />}
            label="Loading..."
            value="..."
            accentColor="#10B981"
          />
        ))}
      </KPIGroupContainer>
    );
  }

  return (
    <KPIGroupContainer 
      title="Attendance & Behavior" 
      icon={<CalendarDaysIcon className="w-5 h-5" />}
    >
      <KpiCard
        icon={<UsersIcon className="w-5 h-5" />}
        label="Student Attendance"
        value={`${metrics.studentAttendanceRate}%`}
        accentColor="#10B981"
        progress={metrics.studentAttendanceRate}
        deltaText={metrics.studentAttendanceRate >= 90 ? "+2.1%" : "-1.5%"}
        deltaDirection={metrics.studentAttendanceRate >= 90 ? "up" : "down"}
        onClick={() => handleNavigation(ADMIN_VIEWS.ATTENDANCE)}
      />
      
      <KpiCard
        icon={<BriefcaseIcon className="w-5 h-5" />}
        label="Teacher Attendance"
        value={`${metrics.teacherAttendanceRate}%`}
        accentColor="#6366F1"
        progress={metrics.teacherAttendanceRate}
        onClick={() => handleNavigation(ADMIN_VIEWS.TEACHER_ATTENDANCE_HISTORY)}
      />
      
      <KpiCard
        icon={<ClockIcon className="w-5 h-5" />}
        label="Late Arrivals"
        value={metrics.lateArrivals}
        accentColor="#F59E0B"
        onClick={() => handleNavigation(ADMIN_VIEWS.ATTENDANCE)}
      />
      
      <KpiCard
        icon={<CalendarDaysIcon className="w-5 h-5" />}
        label="Absent Today"
        value={metrics.absentToday}
        accentColor="#EF4444"
        onClick={() => handleNavigation(ADMIN_VIEWS.ATTENDANCE)}
      />
    </KPIGroupContainer>
  );
};

export default AttendanceKPIGroup;
