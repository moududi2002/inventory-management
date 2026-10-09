// apps/web/src/app/page.tsx

// Root page — always redirect to the dashboard.
// (AuthProvider will bounce unauthenticated users to /login.)

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}
