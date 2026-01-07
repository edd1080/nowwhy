'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, Copy, ExternalLink, ArrowRight, Loader2, Zap, Globe, Code } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  domain: string;
  public_key: string;
}

export default function ProjectSetupPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProject() {
      const supabase = createClient();
      const { data } = await supabase
        .from('projects')
        .select('id, name, domain, public_key')
        .eq('id', params.id)
        .single();

      setProject(data);
      setLoading(false);
    }

    fetchProject();
  }, [params.id]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const trackingScript = project
    ? `<script defer src="${appUrl}/tracker.js" data-project="${project.public_key}" data-endpoint="${appUrl}/api/v1/collect"></script>`
    : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <p className="text-slate-500">Project not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      {/* Success Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-semibold mb-4">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Project Created
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {project.name}
            </h1>
            <p className="text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Globe className="w-4 h-4" />
              {project.domain}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Step 1: Add tracking script */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-slate-900 text-lg mb-1">
                  Add the tracking script
                </h2>
                <p className="text-sm text-slate-500">
                  Copy this script and paste it in the <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs">&lt;head&gt;</code> section of your HTML.
                </p>
              </div>
            </div>
          </div>

          {/* Code block */}
          <div className="bg-slate-900 p-5 relative group">
            <button
              onClick={copyToClipboard}
              className={`absolute top-4 right-4 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>

            <pre className="text-sm font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap break-all pr-24">
              <span className="text-slate-500">{`<!-- Add this to your <head> -->`}</span>{'\n'}
              <span className="text-purple-400">&lt;script</span>{' '}
              <span className="text-orange-400">defer</span>{'\n'}
              {'  '}<span className="text-orange-400">src</span>=<span className="text-green-400">&quot;{appUrl}/tracker.js&quot;</span>{'\n'}
              {'  '}<span className="text-orange-400">data-project</span>=<span className="text-green-400">&quot;{project.public_key}&quot;</span>{'\n'}
              {'  '}<span className="text-orange-400">data-endpoint</span>=<span className="text-green-400">&quot;{appUrl}/api/v1/collect&quot;</span>
              <span className="text-purple-400">&gt;&lt;/script&gt;</span>
            </pre>

            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Ready to track</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">&lt;2KB gzipped</span>
            </div>
          </div>
        </div>

        {/* Step 2: Verify */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
              2
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900 text-lg mb-1">
                Visit your site
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Open your site in a new tab and navigate around. Activity should appear in your live dashboard within seconds.
              </p>
              <a
                href={`https://${project.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600 font-medium"
              >
                Open {project.domain}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push(`/live?project=${project.id}`)}
            className="flex-1 py-3.5 px-6 rounded-xl bg-slate-900 text-white font-semibold hover:bg-brand-500 transition-all flex items-center justify-center gap-3 group shadow-lg shadow-slate-900/10 hover:shadow-orange-500/20"
          >
            Go to Live Dashboard
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => router.push('/projects')}
            className="py-3.5 px-6 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:border-brand-200 hover:text-brand-600 transition-all"
          >
            Back to Projects
          </button>
        </div>

        {/* Help box */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-start gap-3">
            <Code className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">
                Using a framework?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                For React, Next.js, or Vue, add the script to your root layout or index.html file.
                The script loads asynchronously and won&apos;t block page rendering.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
