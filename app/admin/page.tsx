import { cookies } from 'next/headers';
import { getSubmissions, type Submission } from '../lib/db';
import LoginForm from './LoginForm';
import AdminDashboard from './AdminDashboard';

// Admin page — protected by simple cookie auth.
// Cookie is set by the adminLogin Server Action in app/actions.ts.

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get('admin_auth')?.value === 'true';

  if (!isAuthed) {
    return <LoginForm />;
  }

  let submissions: Submission[] = [];
  let dbError: string | null = null;

  try {
    submissions = await getSubmissions();
  } catch (err) {
    console.error('Failed to load submissions:', err);
    dbError =
      'Could not connect to the database. Make sure POSTGRES_URL (and related) environment variables are configured in Vercel.';
  }

  if (dbError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
        <div className="max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="mb-2 text-lg font-bold text-red-400">Database Error</p>
          <p className="text-sm text-[#aaa]">{dbError}</p>
        </div>
      </div>
    );
  }

  return <AdminDashboard submissions={submissions} />;
}
