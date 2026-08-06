'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { adminLogin, type LoginState } from '../actions';
import Logo from '../_components/Logo';
import { field, primaryButton } from './ui';

export default function LoginForm({
  brandMark,
  brandTagline,
}: {
  brandMark: string;
  brandTagline: string;
}) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    adminLogin,
    {},
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <Logo mark={brandMark} tagline={brandTagline} className="text-[17px]" />

        <h1 className="mt-10 font-serif text-2xl font-light text-green-deep">
          Staff login
        </h1>
        <p className="mt-2 text-sm font-light text-ink-soft">
          Sign in to manage bookings and the website.
        </p>

        <form action={formAction} className="mt-8 space-y-4 text-left">
          <div>
            <label className="sr-only" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              placeholder="Password"
              className={field}
            />
          </div>

          {state.error ? (
            <p
              role="alert"
              className="border-l-2 border-gold bg-gold-wash/50 px-4 py-3 text-sm font-light text-green-deep"
            >
              {state.error}
            </p>
          ) : null}

          <button type="submit" disabled={pending} className={`${primaryButton} w-full`}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <Link
          href="/"
          className="mt-8 inline-block text-[11px] font-light uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-gold-deep"
        >
          ← Back to the website
        </Link>
      </div>
    </main>
  );
}
