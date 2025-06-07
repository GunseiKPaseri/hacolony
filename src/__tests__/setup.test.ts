import { describe, it, expect, vi } from 'vitest'

describe('Test Environment Setup', () => {
  it('should run basic test', () => {
    expect(true).toBe(true)
  })

  it('should have access to globals', () => {
    expect(vi).toBeDefined()
    expect(describe).toBeDefined()
    expect(it).toBeDefined()
    expect(expect).toBeDefined()
  })
})