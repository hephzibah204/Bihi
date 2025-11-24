import { handleCors } from '../../../_lib/cors';
import { requirePlatformRoles } from '../../../_lib/auth';

export async function onRequest(context) {
  const { request, env } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, 'GET, OPTIONS');
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const auth = await requirePlatformRoles(request, env, ['Teacher', 'School Admin', 'Super Admin']);
  if (!auth.ok) return auth.res;

  try {
    if (request.method === 'OPTIONS') {
      const res = new Response('', { status: 200 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    if (request.method !== 'GET') {
      const res = new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const token = request.headers.get('Authorization');
    const tenantId = auth.user?.user_metadata?.tenant_id;
    
    if (!tenantId) {
      const res = new Response(JSON.stringify({ error: 'Tenant information missing' }), { status: 401 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const headers = { 
      'Authorization': token, 
      'apikey': env.SUPABASE_ANON_KEY, 
      'Accept': 'application/json' 
    };

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'overview';

    let analyticsData = {};

    switch (type) {
      case 'overview':
        analyticsData = await getOverviewAnalytics(env, headers, tenantId);
        break;
      case 'item-stats':
        analyticsData = await getItemStatsAnalytics(env, headers, tenantId);
        break;
      case 'session-performance':
        analyticsData = await getSessionPerformanceAnalytics(env, headers, tenantId);
        break;
      case 'proctoring':
        analyticsData = await getProctoringAnalytics(env, headers, tenantId);
        break;
      default:
        const res = new Response(JSON.stringify({ error: 'Invalid analytics type' }), { status: 400 });
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
    }

    const res = new Response(JSON.stringify(analyticsData), { status: 200 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;

  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}

async function getOverviewAnalytics(env, headers, tenantId) {
  // Get total counts and basic metrics
  const [itemsCount, examsCount, sessionsCount, studentsCount] = await Promise.all([
    fetch(`${env.SUPABASE_URL}/rest/v1/cbt_items?select=id&tenant_id=eq.${tenantId}`, { headers })
      .then(r => r.ok ? r.json().then(data => data.length) : 0),
    fetch(`${env.SUPABASE_URL}/rest/v1/cbt_exams?select=id&tenant_id=eq.${tenantId}`, { headers })
      .then(r => r.ok ? r.json().then(data => data.length) : 0),
    fetch(`${env.SUPABASE_URL}/rest/v1/cbt_sessions?select=id&tenant_id=eq.${tenantId}`, { headers })
      .then(r => r.ok ? r.json().then(data => data.length) : 0),
    fetch(`${env.SUPABASE_URL}/rest/v1/cbt_sessions?select=user_id&tenant_id=eq.${tenantId}`, { headers })
      .then(r => r.ok ? r.json().then(data => new Set(data.map(s => s.user_id)).size) : 0)
  ]);

  // Get recent activity
  const recentSessions = await fetch(
    `${env.SUPABASE_URL}/rest/v1/cbt_sessions?select=status,created_at&tenant_id=eq.${tenantId}&order=created_at.desc&limit=10`,
    { headers }
  ).then(r => r.ok ? r.json() : []);

  // Get completion rates
  const submittedSessions = await fetch(
    `${env.SUPABASE_URL}/rest/v1/cbt_sessions?select=id&tenant_id=eq.${tenantId}&status=eq.submitted`,
    { headers }
  ).then(r => r.ok ? r.json().then(data => data.length) : 0);

  const completionRate = sessionsCount > 0 ? Math.round((submittedSessions / sessionsCount) * 100) : 0;

  return {
    overview: {
      total_items: itemsCount,
      total_exams: examsCount,
      total_sessions: sessionsCount,
      unique_students: studentsCount,
      completion_rate: completionRate
    },
    recent_activity: recentSessions.map(s => ({
      status: s.status,
      timestamp: s.created_at
    }))
  };
}

async function getItemStatsAnalytics(env, headers, tenantId) {
  // Get item difficulty distribution
  const difficultyStats = await fetch(
    `${env.SUPABASE_URL}/rest/v1/cbt_items?select=difficulty,type&tenant_id=eq.${tenantId}`,
    { headers }
  ).then(r => r.ok ? r.json() : []);

  const typeDistribution = {};
  const difficultyDistribution = {};

  difficultyStats.forEach(item => {
    // Type distribution
    typeDistribution[item.type] = (typeDistribution[item.type] || 0) + 1;
    
    // Difficulty distribution
    const difficultyLevel = item.difficulty || 'unknown';
    difficultyDistribution[difficultyLevel] = (difficultyDistribution[difficultyLevel] || 0) + 1;
  });

  // Get response statistics
  const responseStats = await fetch(
    `${env.SUPABASE_URL}/rest/v1/cbt_responses?select=item_id,auto_score,ai_score&limit=1000`,
    { headers }
  ).then(r => r.ok ? r.json() : []);

  const itemPerformance = {};
  responseStats.forEach(response => {
    const itemId = response.item_id;
    if (!itemPerformance[itemId]) {
      itemPerformance[itemId] = { attempts: 0, correct: 0 };
    }
    itemPerformance[itemId].attempts++;
    const score = response.auto_score || response.ai_score || 0;
    if (score > 0) itemPerformance[itemId].correct++;
  });

  // Calculate p-values (difficulty index)
  const pValues = {};
  Object.keys(itemPerformance).forEach(itemId => {
    const stats = itemPerformance[itemId];
    pValues[itemId] = stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0;
  });

  return {
    type_distribution: typeDistribution,
    difficulty_distribution: difficultyDistribution,
    item_performance: itemPerformance,
    p_values: pValues
  };
}

async function getSessionPerformanceAnalytics(env, headers, tenantId) {
  // Get average scores by exam
  const examScores = await fetch(
    `${env.SUPABASE_URL}/rest/v1/cbt_sessions?select=id,exam_id,status&tenant_id=eq.${tenantId}&status=eq.submitted`,
    { headers }
  ).then(r => r.ok ? r.json() : []);

  const examScoreMap = {};
  const examIds = examScores.map(s => s.id);
  
  if (examIds.length > 0) {
    const grades = await fetch(
      `${env.SUPABASE_URL}/rest/v1/cbt_grades?select=session_id,total_score&session_id=in.(${examIds.join(',')})`,
      { headers }
    ).then(r => r.ok ? r.json() : []);

    const gradeMap = new Map(grades.map(g => [g.session_id, g.total_score]));
    
    examScores.forEach(session => {
      const score = gradeMap.get(session.id);
      if (score !== undefined) {
        if (!examScoreMap[session.exam_id]) {
          examScoreMap[session.exam_id] = [];
        }
        examScoreMap[session.exam_id].push(score);
      }
    });
  }

  // Calculate averages
  const examAverages = {};
  Object.keys(examScoreMap).forEach(examId => {
    const scores = examScoreMap[examId];
    examAverages[examId] = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  });

  // Get time-based performance trends
  const recentSessions = await fetch(
    `${env.SUPABASE_URL}/rest/v1/cbt_sessions?select=id,created_at,status&tenant_id=eq.${tenantId}&order=created_at.desc&limit=30`,
    { headers }
  ).then(r => r.ok ? r.json() : []);

  const dailyActivity = {};
  recentSessions.forEach(session => {
    const date = new Date(session.created_at).toISOString().split('T')[0];
    if (!dailyActivity[date]) {
      dailyActivity[date] = { started: 0, completed: 0 };
    }
    dailyActivity[date].started++;
    if (session.status === 'submitted') {
      dailyActivity[date].completed++;
    }
  });

  return {
    exam_averages: examAverages,
    daily_activity: dailyActivity
  };
}

async function getProctoringAnalytics(env, headers, tenantId) {
  // Get proctoring event statistics
  const proctorEvents = await fetch(
    `${env.SUPABASE_URL}/rest/v1/cbt_proctor_events?select=event_type,risk_increment&limit=1000`,
    { headers }
  ).then(r => r.ok ? r.json() : []);

  const eventStats = {};
  let totalRiskScore = 0;

  proctorEvents.forEach(event => {
    eventStats[event.event_type] = (eventStats[event.event_type] || 0) + 1;
    totalRiskScore += event.risk_increment || 0;
  });

  // Get sessions with high risk scores
  const highRiskSessions = await fetch(
    `${env.SUPABASE_URL}/rest/v1/cbt_sessions?select=id,risk_score,status&risk_score=gte.50&order=risk_score.desc&limit=20`,
    { headers }
  ).then(r => r.ok ? r.json() : []);

  return {
    event_statistics: eventStats,
    total_risk_generated: totalRiskScore,
    high_risk_sessions: highRiskSessions.map(s => ({
      session_id: s.id,
      risk_score: s.risk_score,
      status: s.status
    }))
  };
}