// API route authentication & authorization helper
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  badge?: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const user = session.user as Record<string, unknown>;
  return {
    id: user.id as string,
    email: user.email as string,
    name: user.name as string,
    role: user.role as string,
    badge: user.badge as string | undefined,
  };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) throw new Error('Authentication required');
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== 'admin') throw new Error('Admin access required');
  return user;
}

export async function requireRole(...roles: string[]): Promise<AuthUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) throw new Error(`Access denied. Required role: ${roles.join(' or ')}`);
  return user;
}
