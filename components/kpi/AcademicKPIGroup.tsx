import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import KpiCard from '../ui/KpiCard';
import KPIGroupContainer from '../ui/KPIGroupContainer';
import { ADMIN_VIEWS } from '../../utils/constants';
import AcademicCapIcon from '../icons/AcademicCapIcon';
import UsersGroupIcon from '../icons/UsersGroupIcon';
import ChartBarIcon from '../icons/ChartBarIcon';
import TrophyIcon from '../icons/TrophyIcon';
import { apiGetStudents, apiGetScores } from '../../services/api';

const AcademicKPIGroup: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentsData, scoresData] = await Promise.allSettled([
          apiGetStudents(),
          apiGetScores()
        ]);
        
        if (studentsData.status === 'fulfilled') setStudents(studentsData.value);
        if (scoresData.status === 'fulfilled') setScores(scoresData.value);
      } catch (error) {
        console.error('Error loading academic data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const metrics = useMemo(() => {
    if (loading) return null;

    const totalStudents = students.length;
    
    // Calculate pass rate from scores
    const passRate = scores.length > 0 
      ? Math.round((scores.filter(score => score.total >= 50).length / scores.length) * 100)
      : 0;
    
    // High-risk students (those with average < 40%)
    const highRiskCount = scores.filter(score => score.total < 40).length;
    
    // Top performing students (those with average >= 80%)
    const topPerformingCount = scores.filter(score => score.total >= 80).length;

    return {
      totalStudents,
      passRate,
      highRiskCount,
      topPerformingCount
    };
  }, [students, scores, loading]);

  const handleNavigation = (view: string) => {
    const url = new URL(window.location.toString());
    url.searchParams.set('view', view);
    navigate(url.pathname + url.search + url.hash);
  };

  if (loading || !metrics) {
    return (
      <KPIGroupContainer 
        title="Academic Performance" 
        icon={<AcademicCapIcon className="w-5 h-5" />}
      >
        {[1, 2, 3, 4].map(i => (
          <KpiCard 
            key={i}
            icon={<div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />}
            label="Loading..."
            value="..."
            accentColor="#6366F1"
          />
        ))}
      </KPIGroupContainer>
    );
  }

  return (
    <KPIGroupContainer 
      title="Academic Performance" 
      icon={<AcademicCapIcon className="w-5 h-5" />}
    >
      <KpiCard
        icon={<UsersGroupIcon className="w-5 h-5" />}
        label="Total Students"
        value={metrics.totalStudents.toLocaleString()}
        accentColor="#6366F1"
        onClick={() => handleNavigation(ADMIN_VIEWS.STUDENTS)}
      />
      
      <KpiCard
        icon={<AcademicCapIcon className="w-5 h-5" />}
        label="Average Pass Rate"
        value={`${metrics.passRate}%`}
        accentColor="#10B981"
        progress={metrics.passRate}
      />
      
      <KpiCard
        icon={<ChartBarIcon className="w-5 h-5" />}
        label="High-Risk Students"
        value={metrics.highRiskCount}
        accentColor="#F59E0B"
        onClick={() => handleNavigation(ADMIN_VIEWS.STUDENTS)}
      />
      
      <KpiCard
        icon={<TrophyIcon className="w-5 h-5" />}
        label="Top Performers"
        value={metrics.topPerformingCount}
        accentColor="#8B5CF6"
        onClick={() => handleNavigation(ADMIN_VIEWS.LEADERBOARD_STUDENTS)}
      />
    </KPIGroupContainer>
  );
};

export default AcademicKPIGroup;
