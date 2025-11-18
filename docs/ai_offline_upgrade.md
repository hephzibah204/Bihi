Title: Offline AI Upgrade Summary

Scope: Replaced basic fallback with a production-ready offline AI layer. Added local model engine with automatic selection, tool calling, and a Supabase-backed RAG pipeline. Implemented unified orchestrator with seamless failover, role-aware prompting, conversation memory, and multi-tenant isolation.

Key Changes:
- Offline engine wrapper with model auto-selection and local inference integration
- RAG service using Supabase with semantic fallback
- Tool router and tools for finance, academics, and admin
- AI gateway orchestrator with SSE streaming and failover logic
- Router updates to route sensitive finance and tool-driven queries offline
- Migration for ai_documents and match_documents RPC

Behavior:
- Owner: strategic insights, debt breakdowns, trends, staff summaries
- Bursar: discipline, recovery recommendations, reminders
- Teacher: lesson plans, comments, weak student insights
- Parent: simple English, child-focused advice, no internal admin data

Testing Hooks:
- Local engine invocation, tool calls, RAG retrieval, failover triggers

Notes:
- Ollama is used when available; otherwise enhanced templates provide output