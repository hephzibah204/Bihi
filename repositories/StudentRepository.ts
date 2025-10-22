// repositories/StudentRepository.ts
// Student repository with specialized methods

import { BaseRepository, QueryOptions } from './BaseRepository';
import { CACHE_CONFIGS, withCache } from '../utils/cache';
import { validateInput, studentSchema } from '../utils/validation';
import { withRetry } from '../utils/retry';
import { parseSupabaseError } from '../utils/errors';
import { Student } from '../types';

export class StudentRepository extends BaseRepository<Student> {
  constructor() {
    super({
      table: 'students',
      tenantField: 'tenantId',
      cacheConfig: CACHE_CONFIGS.ACADEMIC
    });
  }

  /**
   * Find students by class
   */
  async findByClass(classId: string, options: QueryOptions = {}, tenantId?: string): Promise<Student[]> {
    return this.findBy('class', classId, options, tenantId);
  }

  /**
   * Find students by parent
   */
  async findByParent(parentId: string, options: QueryOptions = {}, tenantId?: string): Promise<Student[]> {
    return this.findBy('parentId', parentId, options, tenantId);
  }

  /**
   * Find students with their enrollment status
   */
  async findByStatus(status: 'active' | 'inactive' | 'graduated' | 'transferred', options: QueryOptions = {}, tenantId?: string): Promise<Student[]> {
    return this.findBy('status', status, options, tenantId);
  }

  /**
   * Search students by name
   */
  async searchByName(query: string, options: QueryOptions = {}, tenantId?: string): Promise<Student[]> {
    const searchOptions = {
      ...options,
      filters: {
        ...options.filters,
        or: `firstName.ilike.%${query}%,lastName.ilike.%${query}%`
      }
    };

    return this.findAll(searchOptions, tenantId);
  }

  /**
   * Get students with their scores (join operation)
   */
  async findWithScores(studentIds?: string[], tenantId?: string): Promise<Student[]> {
    const cacheKey = this.getCacheKey('findWithScores', { studentIds, tenantId });
    
    return withCache(
      cacheKey,
      async () => {
        return withRetry(async () => {
          let query = this.getClient()
            .from(this.table)
            .select(`
              *,
              scores:scores(
                id,
                subject,
                score,
                maxScore,
                date,
                type
              )
            `);

          query = this.applyTenantFilter(query, tenantId);

          if (studentIds && studentIds.length > 0) {
            query = query.in('id', studentIds);
          }

          const { data, error } = await query;

          if (error) {
            throw parseSupabaseError(error, 'SELECT', this.table);
          }

          return data || [];
        });
      },
      this.cacheConfig
    );
  }

  /**
   * Get student statistics
   */
  async getStats(tenantId?: string) {
    const cacheKey = this.getCacheKey('getStats', { tenantId });
    
    return withCache(
      cacheKey,
      async () => {
        const [total, active, inactive, graduated] = await Promise.all([
          this.count({}, tenantId),
          this.count({ status: 'active' }, tenantId),
          this.count({ status: 'inactive' }, tenantId),
          this.count({ status: 'graduated' }, tenantId)
        ]);

        return {
          total,
          active,
          inactive,
          graduated,
          transferred: total - active - inactive - graduated
        };
      },
      { ...this.cacheConfig, ttl: 60000 } // Cache for 1 minute
    );
  }

  /**
   * Create student with validation
   */
  async create(studentData: Partial<Student>, tenantId?: string): Promise<Student> {
    // Validate student data
    const validatedData = validateInput(studentSchema, studentData);
    
    return super.create(validatedData, tenantId);
  }

  /**
   * Update student with validation
   */
  async update(id: string, studentData: Partial<Student>, tenantId?: string): Promise<Student> {
    // Validate partial student data
    const validatedData = validateInput(studentSchema.partial(), studentData);
    
    return super.update(id, validatedData, tenantId);
  }

  /**
   * Bulk import students
   */
  async bulkImport(students: Partial<Student>[], tenantId?: string): Promise<Student[]> {
    // Validate all students
    const validatedStudents = students.map(student => 
      validateInput(studentSchema, student)
    );

    return this.batchCreate(validatedStudents, tenantId);
  }

  /**
   * Get students due for graduation (based on enrollment date and school policy)
   */
  async findDueForGraduation(yearsToGraduation: number = 4, tenantId?: string): Promise<Student[]> {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - yearsToGraduation);

    const options: QueryOptions = {
      filters: {
        enrollmentDate: {
          operator: 'lt',
          value: cutoffDate.toISOString()
        },
        status: 'active'
      }
    };

    return this.findAll(options, tenantId);
  }

  /**
   * Find students by age range
   */
  async findByAgeRange(minAge: number, maxAge: number, tenantId?: string): Promise<Student[]> {
    const today = new Date();
    const maxBirthDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
    const minBirthDate = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate());

    const options: QueryOptions = {
      filters: {
        dateOfBirth: {
          operator: 'gte',
          value: minBirthDate.toISOString()
        },
        dateOfBirth2: {
          operator: 'lte',
          value: maxBirthDate.toISOString()
        }
      }
    };

    return this.findAll(options, tenantId);
  }
}

// Export singleton instance
export const studentRepository = new StudentRepository();