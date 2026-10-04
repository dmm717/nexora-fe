import { redirect } from 'next/navigation';
import { INTERVIEW_START_PATH } from '@/config/navigation';

export default function InterviewSetupPage() {
  redirect(INTERVIEW_START_PATH);
}
