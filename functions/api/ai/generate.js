// functions/api/ai/generate.js

const allowedOriginPatterns = [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
    /^https:\/\/reportsheet\.com\.ng$/,
    /^https:\/\/.+\.reportsheet\.com\.ng$/,
    /^https:\/\/reportsheet\.pages\.dev$/,
    /^https:\/\/.+\.pages\.dev$/,
    /^https:\/\/([a-z0-9-]+\.)?aistudio\.google\.com$/,
    /^https:\/\/.+\.googleusercontent\.com$/,
    /^https:\/\/.+\.web\.app$/,
    /^https:\/\/.*\.google\.internal$/,
];

function handleCors(request) {
    const origin = request.headers.get("Origin");
    const headers = {
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Demo-Mode",
    };
    let isAllowed = false;

    if (origin && allowedOriginPatterns.some((p) => p.test(origin))) {
        headers["Access-Control-Allow-Origin"] = origin;
        isAllowed = true;
    }

    if (request.method === "OPTIONS") {
        return { response: new Response(null, { headers }), corsHeaders: headers, isAllowed };
    }

    return { response: null, corsHeaders: headers, isAllowed };
}

async function handlePost(request, env) {
     try {
        let isAuthenticated = false;
        let userContext = null;
        const authHeader = request.headers.get('Authorization');
        const isDemoMode = request.headers.get('X-Demo-Mode') === 'true';

        // ---------------- Permission helpers ----------------
        const getRole = (user) => {
            const meta = (user && (user.user_metadata || user.app_metadata)) || {};
            return meta.platform_role || meta.role || user?.role || 'User';
        };
        const getAllowedScopesForRole = (role) => {
            switch (role) {
                case 'Super Admin': return new Set(['admin', 'finance', 'teaching', 'parent', 'student']);
                case 'Admin': return new Set(['admin', 'finance']);
                case 'Bursar': return new Set(['finance']);
                case 'Teacher': return new Set(['teaching']);
                case 'Parent': return new Set(['parent']);
                case 'Student': return new Set(['student']);
                default: return new Set(['student']);
            }
        };
        const inferScopeFromKey = (key='') => {
            const k = String(key).toLowerCase();
            if (/(fee|finance|invoice|payment|bursar|outstanding|debt|arrear)/.test(k)) return 'finance';
            if (/(teacher|class|subject|grading|assignment|lesson|timetable)/.test(k)) return 'teaching';
            if (/(parent|ward|child)/.test(k)) return 'parent';
            if (/(student)/.test(k)) return 'student';
            return 'admin';
        };
        const sanitizeFeatureContexts = (featureContexts, allowed) => {
            if (!featureContexts || typeof featureContexts !== 'object') return undefined;
            const out = {};
            for (const [k, v] of Object.entries(featureContexts)) {
                const scope = inferScopeFromKey(k);
                if (allowed.has(scope)) out[k] = v;
            }
            return Object.keys(out).length ? out : undefined;
        };
        const sanitizeContext = (ctx, allowed) => {
            if (!ctx) return undefined;
            try {
                const isStr = typeof ctx === 'string';
                const obj = isStr ? JSON.parse(ctx) : ctx;
                const sanitized = { ...obj };
                // Remove dashboardContext unless admin scope
                if (!allowed.has('admin')) delete sanitized.dashboardContext;
                // Remove performanceContext if finance inside and no finance scope
                if (!allowed.has('finance') && typeof sanitized.performanceContext === 'string' && /(fee|invoice|payment|outstanding|arrear|debt)/i.test(sanitized.performanceContext)) {
                    delete sanitized.performanceContext;
                }
                // Feature contexts embedded
                if (sanitized.featureContexts) {
                    sanitized.featureContexts = sanitizeFeatureContexts(sanitized.featureContexts, allowed);
                    if (!sanitized.featureContexts) delete sanitized.featureContexts;
                }
                return sanitized;
            } catch {
                return allowed.has('admin') ? ctx : undefined;
            }
        };
        const promptAllowed = (prompt, allowed) => {
            const p = String(prompt || '').toLowerCase();
            // Block finance queries if finance not allowed
            if (!allowed.has('finance') && /(fee|invoice|payment|outstanding|balance|arrear|tuition|debtor|revenue)/.test(p)) return false;
            // Block admin-wide analytics if admin not allowed
            if (!allowed.has('admin') && /(school[-\s]?wide|overall|all\s+students|analytics|reports|platform)/.test(p)) return false;
            return true;
        }; 

        if (isDemoMode) {
            isAuthenticated = true;
        } else if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;
            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                return new Response(JSON.stringify({ error: 'Server not configured for auth.' }), { status: 500 });
            }
            const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
                headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY }
            });
            if (authResponse.ok) {
                isAuthenticated = true;
                userContext = await authResponse.json();
            }
        }

        if (!isAuthenticated) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const body = await request.json();
        const { prompt, tenantId, conversationId, context, conversationHistory, userProfile, responseMimeType, expectedSchema } = body;
        if (!prompt) return new Response(JSON.stringify({ error: "Prompt is required." }), { status: 400 });
        // Default to plain text output; HTML is instructed in prompt
        const effectiveMime = responseMimeType || 'text/plain';

        // ----- Compute permissions and sanitize inputs -----
        const role = getRole(userContext);
        const allowedScopes = getAllowedScopesForRole(role);
        if (!promptAllowed(prompt, allowedScopes)) {
            return new Response(
                JSON.stringify({ error: 'Permission denied', detail: `Your role (${role}) is not permitted to access this information.` }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Resolve API key with school-specific override support
        let apiKey = env.API_KEY; // Default sitewide key
        
        // If we have a tenant ID and user context, check for school-specific Gemini API key
        if (tenantId && userContext && !isDemoMode) {
            try {
                const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;
                const schoolSettingsResponse = await fetch(`${SUPABASE_URL}/rest/v1/settings?tenant_id=eq.${tenantId}&select=integrations`, {
                    headers: { 
                        'Authorization': `Bearer ${authHeader.split(' ')[1]}`, 
                        'apikey': SUPABASE_ANON_KEY,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (schoolSettingsResponse.ok) {
                    const schoolSettings = await schoolSettingsResponse.json();
                    if (schoolSettings && schoolSettings.length > 0 && schoolSettings[0].integrations?.gemini_api_key) {
                        apiKey = schoolSettings[0].integrations.gemini_api_key;
                        console.log('Using school-specific Gemini API key for tenant:', tenantId);
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch school-specific API key, falling back to sitewide key:', error.message);
            }
        }
        
        if (!apiKey) return new Response(JSON.stringify({ error: "API_KEY is missing on server." }), { status: 500 });

// Build system prompt with user context and memory
        let systemPrompt = (
            'You are DossierAI, the intelligent assistant built into Dossier.ng, an AI-powered platform for Nigerian schools that integrates report management, analytics, communication, and payments.\n\n' +
            'Operate as an insider of Dossier.ng with awareness of the user\u2019s role, school data, tenant, and KPIs supplied in context.\n' +
            'Core Responsibilities:\n' +
            '- Personalized Insight: Tailor answers to the specific school/tenant using provided KPIs and context. Never invent numbers; only use values present in context. If a KPI is missing, indicate it and suggest fetching or refreshing the dashboard.\n' +
            '- Operational Awareness: You understand Dossier.ng modules (Dashboards: analytics, attendance, performance, fees, behavior, progress reports; Roles: Admin, Teacher, Parent, Student, Accountant, Proprietor; KPIs: total students, active classes, fees collected, outstanding balances, performance averages, attendance rate, term progress).\n' +
            '- Action Guidance: When asked to perform actions, guide the user through the correct in-app workflow (menu paths) rather than executing actions.\n' +
            '- Data Ethics: Never hallucinate or fabricate metrics. Clearly indicate when data is unavailable.\n' +
            '- Tone: Professional, empathetic, and encouraging. Speak as part of the Dossier.ng team.'
        );
        if (userProfile?.userRole) systemPrompt += `\nUser role: ${userProfile.userRole}`;
        if (tenantId) systemPrompt += `\nTenant: ${tenantId}`;
        const sanitizedCtx = sanitizeContext(context, allowedScopes);
        if (sanitizedCtx) systemPrompt += `\nContext: ${typeof sanitizedCtx === 'string' ? sanitizedCtx : JSON.stringify(sanitizedCtx)}`;

        // Try to fetch user memory (best-effort)
        let memoryLines = [];
        try {
            if (userContext?.id && env.SUPABASE_URL && env.SUPABASE_ANON_KEY && authHeader) {
                const memResp = await fetch(`${env.SUPABASE_URL}/rest/v1/ai_user_memory?select=key,value,updated_at&user_id=eq.${userContext.id}${tenantId ? `&tenant_id=eq.${tenantId}` : ''}&order=updated_at.desc&limit=20`, {
                    headers: {
                        'Authorization': authHeader,
                        'apikey': env.SUPABASE_ANON_KEY
                    }
                });
                if (memResp.ok) {
                    const mem = await memResp.json();
                    memoryLines = (mem || [])
                      .filter(m => allowedScopes.has(inferScopeFromKey(m.key)))
                      .map(m => `- ${m.key}: ${typeof m.value === 'string' ? m.value : JSON.stringify(m.value)}`);
                }
            }
        } catch (_) { /* ignore memory errors */ }
        if (memoryLines.length) {
            systemPrompt += `\nKnown user facts:\n${memoryLines.join('\n')}`;
        }

        // Global behavioral rules
        systemPrompt += `\n\nBehavioral Rules:\n- Do NOT include generic disclaimers like "As an AI, I don't have access...".\n- Use only the provided context and memory; if a specific datum is missing, write: "Not available in current context" and suggest exactly one next data point to fetch.\n- When the user is a Teacher/Admin and metrics are present, summarize with concrete numbers, 3–5 concise insights, and short calls to action.`;

        // Global formatting standards
        if (effectiveMime === 'application/json') {
            systemPrompt += `\n\nOutput Format:\n- Return strictly valid JSON only (no Markdown or comments).\n- Do not include any text before or after the JSON.\n${expectedSchema ? `- The JSON MUST conform to this schema: ${typeof expectedSchema === 'string' ? expectedSchema : JSON.stringify(expectedSchema)}` : ''}`;
        } else {
            systemPrompt += `\n\nOutput Format:\n- Return well-structured HTML only (no Markdown).\n- Use semantic tags: <h1> title, <h2>/<h3> sections, <p>, <ul>/<ol>, <table>, <thead>/<tbody>/<tr>/<th>/<td>.\n- Bold key labels using <strong>.\n- For lesson notes include sections: Title, Objectives, Materials, Prerequisites, Lesson Outline, Activities, Assessment, Homework/Extension, References.\n- Keep sentences concise; avoid emojis and slang; no pidgin.\n- Ensure valid, balanced HTML.`;
        }

        // Build contents with optional history
        const contents = [];
        contents.push({ role: 'user', parts: [{ text: systemPrompt }] });

        // Prefer server-side conversation history if conversationId provided
        let historyAdded = false;
        try {
            if (conversationId && env.SUPABASE_URL && env.SUPABASE_ANON_KEY && authHeader) {
                const histResp = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/get_conversation_messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': authHeader,
                        'apikey': env.SUPABASE_ANON_KEY,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({ p_conversation_id: conversationId })
                });
                if (histResp.ok) {
                    const msgs = await histResp.json();
                    const recent = (msgs || []).slice(-20);
                    for (const m of recent) {
                        contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] });
                    }
                    historyAdded = recent.length > 0;
                }
            }
        } catch (_) { /* ignore history errors */ }

        if (!historyAdded && Array.isArray(conversationHistory)) {
            for (const m of conversationHistory.slice(-20)) {
                contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] });
            }
        }

        contents.push({ role: 'user', parts: [{ text: prompt }] });

        const aiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    contents,
                    generationConfig: effectiveMime ? { response_mime_type: effectiveMime } : undefined
                }),
            }
        );

        if (!aiRes.ok) {
            const errText = await aiRes.text();
            let errorMessage = `AI service responded with status: ${aiRes.status}`;
            try {
                const errorJson = JSON.parse(errText);
                errorMessage = errorJson.error?.message || errText;
            } catch(e) {
                errorMessage = errText;
            }
            return new Response(JSON.stringify({ error: errorMessage }), { status: aiRes.status });
        }
        
        // Return the streaming response directly
        return new Response(aiRes.body, {
            status: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal Server Error", details: err.message }), { status: 500 });
    }
}

export async function onRequest(context) {
    const { request, env } = context;
    const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request);

    if (corsResponse) {
        return corsResponse; // Handle preflight OPTIONS request
    }

    if (!isAllowed) {
        return new Response(JSON.stringify({ error: "Forbidden: Invalid Origin" }), { status: 403 });
    }

    let response;
    if (request.method === 'POST') {
        response = await handlePost(request, env);
    } else {
        response = new Response('Method Not Allowed', { status: 405 });
    }

    // Apply CORS headers to the actual response
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    return response;
}