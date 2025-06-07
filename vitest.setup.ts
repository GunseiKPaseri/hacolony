import "@testing-library/jest-dom";
import "reflect-metadata";
import { vi } from "vitest";
import React from "react";

// Reactをグローバルに設定
global.React = React;

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/test-path",
}));

// Mock NextAuth
vi.mock("next-auth", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    default: vi.fn().mockReturnValue({
      handlers: {
        GET: vi.fn(),
        POST: vi.fn(),
      },
    }),
  };
});

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: null,
    status: "unauthenticated",
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock getServerSession for API routes
vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

// Mock authOptions
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: {},
}));
