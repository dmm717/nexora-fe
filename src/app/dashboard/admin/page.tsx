import { redirect } from 'next/navigation';

export default function AdminIndexPage() {
  // Backend doesn't have a dashboard API yet, so we redirect the base admin route 
  // to the first functional admin page: Users Management.
  redirect('/dashboard/admin/users');
}
