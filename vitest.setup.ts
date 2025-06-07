import '@testing-library/jest-dom'
import 'reflect-metadata'
import { vi } from 'vitest'
import React from 'react'

// Reactをグローバルに設定
global.React = React

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/test-path',
}))

// Mock NextAuth
vi.mock('next-auth', () => ({
  default: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))