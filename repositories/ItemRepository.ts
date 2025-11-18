import { BaseRepository } from './BaseRepository';
import type { CBTItem } from '../types/cbt';

export class ItemRepository extends BaseRepository<CBTItem> {
  constructor() {
    super({ table: 'cbt_items', idField: 'id', tenantField: 'tenant_id' });
  }
}