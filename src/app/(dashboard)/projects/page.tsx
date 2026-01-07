import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Globe, ArrowRight, Copy, ExternalLink } from 'lucide-react';

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Projects
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your tracked sites
          </p>
        </div>
        <Link
          href="/projects/new"
          className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-brand-500 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 hover:shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {projects && projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/5 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-500">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900 text-lg">
                      {project.name}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {project.domain}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/live?project=${project.id}`}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-brand-50 hover:text-brand-600 transition-all flex items-center gap-2"
                  >
                    View Live
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/projects/${project.id}/setup`}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:border-brand-200 hover:text-brand-600 transition-all"
                  >
                    Setup
                  </Link>
                </div>
              </div>

              {/* Tracking Script */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Tracking Script
                  </p>
                  <button className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                  <code className="text-xs font-mono text-slate-300">
                    <span className="text-purple-400">&lt;script</span>{' '}
                    <span className="text-orange-400">defer</span>{' '}
                    <span className="text-orange-400">src</span>=
                    <span className="text-green-400">&quot;{process.env.NEXT_PUBLIC_APP_URL || 'https://app.nowwhy.com'}/tracker.js&quot;</span>{' '}
                    <span className="text-orange-400">data-project</span>=
                    <span className="text-green-400">&quot;{project.public_key}&quot;</span>
                    <span className="text-purple-400">&gt;&lt;/script&gt;</span>
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Globe className="w-8 h-8 text-brand-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            No projects yet
          </h2>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            Create your first project to start tracking visitor intent on your site.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-brand-500 transition-all shadow-lg shadow-slate-900/10 hover:shadow-orange-500/20"
          >
            <Plus className="w-5 h-5" />
            Create your first project
          </Link>
        </div>
      )}
    </div>
  );
}
