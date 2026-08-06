import type { Metadata } from 'next';
import { isAdmin } from '../actions';
import { getBookings, getContent, getServices, getTeam, hasDatabase } from '../lib/db';
import AdminDashboard from './AdminDashboard';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Staff dashboard',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const content = await getContent();

  if (!(await isAdmin())) {
    return <LoginForm brandMark={content.brand_mark} brandTagline={content.brand_tagline} />;
  }

  const [bookings, services, team] = await Promise.all([
    getBookings(),
    getServices(),
    getTeam(),
  ]);

  return (
    <AdminDashboard
      content={content}
      bookings={bookings}
      services={services}
      team={team}
      storageWarning={!hasDatabase()}
    />
  );
}
