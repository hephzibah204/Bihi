// functions/api/invite-parent.js

function getCorsHeaders(request) {
    const origin = request.headers.get('Origin') || '';

    // Define allowed origin patterns. This is more robust and explicit.
    const allowedOriginPatterns = [
        // Local development
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/,
        
        // Production domains
        /^https:\/\/reportsheet\.com\.ng$/,      // Root domain
        /^https:\/\/.+\.reportsheet\.com\.ng$/,    // Subdomains e.g., www. or demo.

        // Preview/Staging domains
        /^https:\/\/reportsheet\.pages\.dev$/,   // Root preview domain
        /^https:\/\/.+\.pages\.dev$/,             // Any other pages.dev URL (covers branches)

        // External services
        /\.aistudio\.google\.com$/,
    ];

    let isOriginAllowed = false;
    for (const pattern of allowedOriginPatterns) {
        if (pattern.test(origin)) {
            isOriginAllowed = true;
            break;
        }
    }
    
    return {
        'Access-Control-Allow-Origin': isOriginAllowed ? origin : '',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Demo-Mode',
    };
}

async function getAdminAuthToken(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return null;
    }
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY }
    });
    if (authResponse.ok) {
        // In a real app, you might also query your DB to ensure this user has an 'Admin' role for their tenant.
        return await authResponse.json();
    }
    return null;
}

export async function onRequestPost({ request, env }) {
    const corsHeaders = { ...getCorsHeaders(request), 'Content-Type': 'application/json' };

    if (!corsHeaders['Access-Control-Allow-Origin']) {
        return new Response(JSON.stringify({ error: 'Forbidden: Invalid Origin' }), { status: 403, headers: corsHeaders });
    }

    try {
        // 1. Authenticate the admin making the request
        const adminUser = await getAdminAuthToken(request, env);
        if (!adminUser) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required.' }), { status: 401, headers: corsHeaders });
        }

        const { studentId } = await request.json();
        if (!studentId) {
            return new Response(JSON.stringify({ error: 'Student ID is required.' }), { status: 400, headers: corsHeaders });
        }

        const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return new Response(JSON.stringify({ error: 'Server is not configured for user invitations.' }), { status: 500, headers: corsHeaders });
        }

        const adminHeaders = {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json'
        };
        
        // Use the admin user's tenant_id for scoping the data fetch.
        const tenantId = adminUser.user_metadata?.tenant_id;
        if (!tenantId) {
             return new Response(JSON.stringify({ error: 'Unauthorized: Admin has no tenant assigned.' }), { status: 401, headers: corsHeaders });
        }

        // 2. Fetch the student to get parent email and ID, scoped to the admin's tenant
        const studentRes = await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${studentId}&tenant_id=eq.${tenantId}&select=parentEmail,parentId,parents(id,email)`, { headers: adminHeaders });
        if (!studentRes.ok) throw new Error(`Failed to fetch student data (status: ${studentRes.status}).`);
        const students = await studentRes.json();
        const student = students[0];
        
        if (!student || !student.parentEmail) {
            return new Response(JSON.stringify({ error: 'Student not found or has no parent email.' }), { status: 404, headers: corsHeaders });
        }

        const parentId = student.parentId || student.parents?.id;
        if (!parentId) {
             return new Response(JSON.stringify({ error: 'Parent profile not found for this student.' }), { status: 404, headers: corsHeaders });
        }

        // 3. Invite the parent using Supabase Admin Auth API
        const inviteRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/invite`, {
            method: 'POST',
            headers: adminHeaders,
            body: JSON.stringify({
                email: student.parentEmail,
                data: {
                    parent_id: parentId, // This metadata links the auth user to the parent profile
                    tenant_id: tenantId, // Also store tenant_id in metadata for RLS
                }
            })
        });
        
        const inviteData = await inviteRes.json();

        if (!inviteRes.ok) {
            // Handle case where user already exists
            if (inviteData.msg && inviteData.msg.includes("already registered")) {
                return new Response(JSON.stringify({ message: "This parent has already registered an account." }), { status: 200, headers: corsHeaders });
            }
            throw new Error(inviteData.msg || 'Failed to send invitation.');
        }

        // 4. Update the parent's record with the new auth_id
        const { id: authId } = inviteData;
        await fetch(`${SUPABASE_URL}/rest/v1/parents?id=eq.${parentId}`, {
            method: 'PATCH',
            headers: adminHeaders,
            body: JSON.stringify({ auth_id: authId })
        });
        
        // Don't need to check the response of the PATCH, the invite is the critical part.

        return new Response(JSON.stringify({ message: 'Invitation sent successfully!' }), { status: 200, headers: corsHeaders });

    } catch (err) {
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: err.message }), { status: 500, headers: corsHeaders });
    }
}

export async function onRequestOptions({ request }) {
    return new Response(null, { headers: getCorsHeaders(request) });
}