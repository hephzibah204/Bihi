import { BaseRepository } from './BaseRepository';
import type { CBTExam } from '../types/cbt';

export class ExamRepository extends BaseRepository<CBTExam> {
  constructor() {
    super({ table: 'cbt_exams', idField: 'id', tenantField: 'tenant_id' });
  }
}

