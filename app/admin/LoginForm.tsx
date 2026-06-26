'use client';

import { useActionState } from 'react';
import { adminLogin, type LoginState } from '../actions';

const initial: LoginState = {};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(adminLogin, initial);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold text-white">
            Pins &amp; <span className="text-[#DC143C]">Needles</span>
          </h1>
          <p className="mt-1 text-sm text-[#555]">Admin Access</p>
        </div>

        <form
          action={formAction}
          className="rounded-2xl border border-[#1e1e1e] bg-[#111] p-8"
        >
          {state.error && (
            <div className="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {state.error}
            </div>
          )}

          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#888]">
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            autoFocus
            className="mb-5 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder:text-[#555] focus:border-[#DC143C] focus:outline-none focus:ring-1 focus:ring-[#DC143C]"
            placeholder="Enter admin password"
          />

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-[#DC143C] py-3 text-sm font-bold text-white transition hover:bg-[#b01030] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-[10px] text-[#333]">
          {/* Simple cookie-based auth — personal admin only */}
          Protected by ADMIN_PASSWORD environment variable
        </p>
      </div>
    </div>
  );
}
