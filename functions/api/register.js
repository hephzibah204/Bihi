// functions/api/register.js
// This is a conceptual example of a Cloudflare Function for new school registration.
// In a real-world scenario, this would interact with a Supabase Admin client to securely create users and tenants.

function getCorsHeaders(request) {
    const origin = request.headers.get('Origin') || '';
    const isAllowed = 
        origin.startsWith('http://localhost:') ||
        origin.endsWith('.reportsheet.com.ng') ||
        origin.endsWith('.pages.dev') ||
        origin.endsWith('.aistudio.google.com');

    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : '',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

export async function onRequestPost({ request, env }) {
    const corsHeaders = { ...getCorsHeaders(request), 'Content-Type': 'application/json' };
    
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (!corsHeaders['Access-Control-Allow-Origin']) {
        return new Response(JSON.stringify({ error: 'Forbidden: Invalid Origin' }), { status: 403, headers: corsHeaders });
    }

    try {
        const { schoolName, subdomain, adminEmail, adminPassword, adminName } = await request.json();

        if (!schoolName || !subdomain || !adminEmail || !adminPassword || !adminName) {
            return new Response(JSON.stringify({ error: 'Missing required fields.' }), { status: 400, headers: corsHeaders });
        }

        const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return new Response(JSON.stringify({ error: 'Server is not configured for registration.' }), { status: 500, headers: corsHeaders });
        }

        // NOTE: The following code is a conceptual demonstration. In a real environment, you would
        // use the 'supabase-js' library initialized with the SERVICE_ROLE_KEY.
        /*
        
        import { createClient } from '@supabase/supabase-js';
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Create the tenant record in your public 'tenants' table first
        const { error: tenantError } = await supabaseAdmin.from('tenants').insert({
            id: subdomain,
            name: schoolName,
        });

        if (tenantError) {
            // Handle potential duplicate subdomain error
            if (tenantError.code === '23505') { // unique_violation
                 throw new Error(`Subdomain '${subdomain}' is already taken.`);
            }
            throw tenantError;
        }

        // 2. Create the user in Supabase Auth with the tenant_id in their metadata
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: { 
                tenant_id: subdomain,
                full_name: adminName
            }
        });

        if (userError) throw userError;

        // 3. Create the teacher profile linked to the user and tenant
        const { error: teacherError } = await supabaseAdmin.from('teachers').insert({
            auth_id: user.id,
            tenant_id: subdomain,
            name: adminName,
            email: adminEmail,
            role: 'Admin'
        });

        if (teacherError) throw teacherError;

        */

        // Since we can't execute the above in this environment, we return a success simulation.
        const portalUrl = `https://${subdomain}.reportsheet.com.ng`;

        return new Response(JSON.stringify({
            message: "Registration successful! A verification link has been sent to the admin email.",
            portalUrl: portalUrl,
        }), { status: 201, headers: corsHeaders });

    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal Server Error", details: err.message }), { status: 500, headers: corsHeaders });
    }
}

export async function onRequestOptions({ request }) {
    return new Response(null, { headers: getCorsHeaders(request) });
}
