import { describe, it, expect } from 'vitest'
import { registerSchema, createTaskSchema } from '@/lib/validators'

describe('Validators', () => {
  describe('registerSchema', () => {
    it('should validate a correct registration payload', () => {
      const validData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }
      
      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should fail when passwords do not match', () => {
      const invalidData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
        confirmPassword: 'Password124!',
      }
      
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.confirmPassword?.[0]).toBe("Passwords don't match")
      }
    })

    it('should fail with a weak password', () => {
      const invalidData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'weak',
        confirmPassword: 'weak',
      }
      
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('createTaskSchema', () => {
    it('should validate a correct task payload', () => {
      const validData = {
        title: 'New Feature',
        description: 'Implement the new feature',
        workspaceId: 'workspace_123',
        status: 'todo',
        priority: 'high',
      }
      
      const result = createTaskSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should apply default values', () => {
      const partialData = {
        title: 'Another Task',
        workspaceId: 'workspace_123',
      }
      
      const result = createTaskSchema.safeParse(partialData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('todo')
        expect(result.data.priority).toBe('medium')
      }
    })

    it('should fail without required fields', () => {
      const invalidData = {
        description: 'Missing title and workspaceId',
      }
      
      const result = createTaskSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
