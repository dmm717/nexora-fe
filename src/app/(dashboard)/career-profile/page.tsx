import { redirect } from 'next/navigation';

export default async function CareerProfilePage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { section } = await searchParams;
  redirect(section === 'goals' ? '/career-goals' : '/profile');
}
