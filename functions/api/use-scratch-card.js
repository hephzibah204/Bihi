// functions/api/use-scratch-card.js

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
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
    let isAllowed = false;
    if (origin && allowedOriginPatterns.some(p => p.test(origin))) {
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
        const { pin, schoolId } = await request.json();
        if (!pin || !schoolId) {
            return new Response(JSON.stringify({ error: 'PIN and School ID are required.' }), { status: 400 });
        }
        
        const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
        const adminHeaders = {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json'
        };

        // 1. Fetch the scratch card record for the specified tenant
        const getRes = await fetch(`${SUPABASE_URL}/rest/v1/scratch_cards?select=cards&tenant_id=eq.${schoolId}&limit=1`, {
            headers: adminHeaders,
        });

        if (!getRes.ok) throw new Error("Could not connect to scratch card service.");
        const data = await getRes.json();
        
        if (data.length === 0 || !data[0].cards) {
            throw new Error("Invalid school ID or no scratch cards found for this school.");
        }
        
        let allCards = data[0].cards;
        const cardIndex = allCards.findIndex(c => c.pin === pin);

        if (cardIndex === -1) {
            throw new Error("Invalid scratch card PIN.");
        }

        if (allCards[cardIndex].used) {
            throw new Error("This scratch card has already been used.");
        }

        // 2. Mark the card as used
        allCards[cardIndex].used = true;
        allCards[cardIndex].usedAt = new Date().toISOString();

        // 3. Save the updated card list back to the database
        const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/scratch_cards?tenant_id=eq.${schoolId}`, {
            method: 'PATCH',
            headers: adminHeaders,
            body: JSON.stringify({ cards: allCards })
        });

        if (!updateRes.ok) {
            throw new Error("Failed to update scratch card status.");
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
}

export async function onRequest(context) {
    const { request, env } = context;
    const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request);

    if (corsResponse) return corsResponse;
    if (!isAllowed) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    
    let response;
    if (request.method === 'POST') {
        response = await handlePost(request, env);
    } else {
        response = new Response('Method Not Allowed', { status: 405 });
    }

    Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
    return response;
}