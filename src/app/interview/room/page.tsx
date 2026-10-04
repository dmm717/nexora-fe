import { redirect } from 'next/navigation';

export default function InterviewRoomPage() {
  // The retired demo had no session ID. The live hub offers real session continuation.
  redirect('/interviews');
}
