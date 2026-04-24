import { RequireAuth } from '@/components/auth/RequireAuth';

export default function NewPinLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
