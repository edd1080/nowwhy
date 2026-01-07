import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Zap, Activity, FolderKanban, Settings } from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get first letter for avatar
  const avatarLetter = user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Nav Links */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link
                href="/live"
                className="flex items-center gap-2 group"
              >
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                  <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-semibold text-slate-900 tracking-tight">
                  NowWhy
                </span>
              </Link>

              {/* Nav Links */}
              <div className="hidden sm:flex items-center gap-1">
                <Link
                  href="/live"
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Activity className="w-4 h-4" />
                  Live
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <FolderKanban className="w-4 h-4" />
                  Projects
                </Link>
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </div>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 tracking-tight hidden sm:block">
                {user.email}
              </span>
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-medium text-sm">
                {avatarLetter}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
}
