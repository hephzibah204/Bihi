import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3001;
const createdTenants = new Set();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Local API server is running' });
});

// Register endpoint - mimics the Cloudflare Worker register.js functionality
app.post('/api/register', async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      schoolName,
      phone,
      address,
      plan,
      emailRedirectTo
    } = req.body;

    console.log('Registration attempt:', { email, schoolName, plan });

    // Check if required environment variables are set
    console.log('Environment variables:', {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING'
    });
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Supabase credentials not configured'
      });
    }

    // Simulate successful registration for demo purposes
    // In a real implementation, you would make actual Supabase API calls here
    const tenantId = req.body?.subdomain || (email ? email.split('@')[0] : `tenant_${Date.now()}`);
    createdTenants.add(tenantId);
    const mockResponse = {
      success: true,
      tenantId,
      tenantCreated: true,
      teacherProfileCreated: true,
      userCreated: true,
      redirectUrl: emailRedirectTo || '/portal'
    };

    console.log('Registration successful:', mockResponse);
    res.status(200).json(mockResponse);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

// Tenant existence check
app.get('/api/tenant-exists', (req, res) => {
  const tenant = req.query.tenant || req.query.id;
  const exists = tenant ? createdTenants.has(String(tenant)) : false;
  res.status(200).json({ exists, tenantId: tenant || '' });
});

app.listen(PORT, () => {
  console.log(`Local API server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/api/health`);
  console.log(`  GET  http://localhost:${PORT}/api/tenant-exists?tenant=<id>`);
  console.log(`  POST http://localhost:${PORT}/api/register`);
});