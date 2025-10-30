// services/aiContextRegistry.ts
// Global registry for feature/KPI contexts so all AI calls can include rich app state

export type FeatureContext = Record<string, unknown>;

interface Entry {
  feature: string;
  data: FeatureContext;
  updatedAt: number;
  role?: string;
  tenantId?: string;
  userId?: string;
}

class AIContextRegistryImpl {
  private static _instance: AIContextRegistryImpl | null = null;
  private store: Map<string, Entry> = new Map();
  private persist = true;
  private baseStorageKey = '__ai_feature_contexts__';
  private currentStorageKey: string = '__ai_feature_contexts__';

  static get instance(): AIContextRegistryImpl {
    if (!this._instance) this._instance = new AIContextRegistryImpl();
    return this._instance;
  }

  private constructor() {
    this.ensureScope();
    this.hydrate();
  }

  private hydrate() {
    if (typeof window === 'undefined' || !this.persist) return;
    try {
      const raw = localStorage.getItem(this.currentStorageKey);
      if (!raw) return;
      const arr = JSON.parse(raw) as Entry[];
      arr.forEach((e) => this.store.set(e.feature, e));
    } catch {
      // ignore
    }
  }

  private save() {
    if (typeof window === 'undefined' || !this.persist) return;
    try {
      const arr = Array.from(this.store.values());
      localStorage.setItem(this.currentStorageKey, JSON.stringify(arr.slice(-100))); // cap
    } catch {
      // ignore
    }
  }

  // Resolve scope from environment (role/tenant/user) to segregate contexts by user role
  private resolveRole(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    try {
      const demoRole = localStorage.getItem('demoUserRole') || sessionStorage.getItem('demoUserRole');
      if (demoRole) return demoRole;
    } catch { /* ignore */ }
    return undefined;
  }

  private resolveTenantId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    try {
      const tid = localStorage.getItem('tenantId') || sessionStorage.getItem('tenantId');
      return tid || undefined;
    } catch { /* ignore */ }
    return undefined;
  }

  private resolveUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    try {
      const uid = localStorage.getItem('currentUserId') || sessionStorage.getItem('currentUserId');
      return uid || undefined;
    } catch { /* ignore */ }
    return undefined;
  }

  private buildStorageKey(role?: string, tenantId?: string): string {
    const rolePart = role ? `role:${role}` : 'role:unknown';
    const tenantPart = tenantId ? `tenant:${tenantId}` : 'tenant:unknown';
    return `${this.baseStorageKey}:${tenantPart}:${rolePart}`;
  }

  // Ensure we are operating under the correct scoped storage key; rehydrate if scope changed
  private ensureScope() {
    if (typeof window === 'undefined' || !this.persist) {
      this.currentStorageKey = this.baseStorageKey;
      return;
    }
    const role = this.resolveRole();
    const tenantId = this.resolveTenantId();
    const nextKey = this.buildStorageKey(role, tenantId);
    if (nextKey !== this.currentStorageKey) {
      this.currentStorageKey = nextKey;
      // Switch in-memory store to the new scope
      this.store.clear();
      this.hydrate();
    }
  }

  update(feature: string, data: FeatureContext) {
    this.ensureScope();
    const entry: Entry = {
      feature,
      data,
      updatedAt: Date.now(),
      role: this.resolveRole(),
      tenantId: this.resolveTenantId(),
      userId: this.resolveUserId()
    };
    this.store.set(feature, entry);
    this.save();
  }

  remove(feature: string) {
    this.ensureScope();
    this.store.delete(feature);
    this.save();
  }

  clear() {
    this.ensureScope();
    this.store.clear();
    this.save();
  }

  snapshot(): Record<string, FeatureContext & { _updatedAt: number }> {
    this.ensureScope();
    const out: Record<string, FeatureContext & { _updatedAt: number }> = {};
    for (const [k, v] of this.store) out[k] = { ...v.data, _updatedAt: v.updatedAt } as any;
    return out;
  }
}

export const AIContextRegistry = AIContextRegistryImpl.instance;
export const registerFeatureContext = (feature: string, data: FeatureContext) => AIContextRegistry.update(feature, data);
export const removeFeatureContext = (feature: string) => AIContextRegistry.remove(feature);
export const getContextSnapshot = () => AIContextRegistry.snapshot();
