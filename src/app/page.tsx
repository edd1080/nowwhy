import Link from "next/link";
import { Zap, Check, Target, AlertTriangle, ArrowRight, ArrowDown, RefreshCw, Twitter, Github, Linkedin } from "lucide-react";

export default function Home() {
  return (
    <main className="bg-white text-slate-900 antialiased overflow-x-hidden">
      {/* Hero Section */}
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-white relative">
        {/* Left Sidebar / Content */}
        <div className="lg:col-span-4 flex flex-col lg:p-10 z-20 bg-white border-slate-100 border-r p-6 justify-between relative shadow-2xl">
          {/* Header/Nav */}
          <div className="flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-500 text-white flex items-center justify-center font-semibold text-lg rounded-lg shadow-lg shadow-orange-500/30">
                <Zap className="w-[18px] h-[18px]" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-slate-900">NowWhy</span>
            </div>
          </div>

          {/* Main Title */}
          <div className="my-12 lg:my-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-brand-600 text-xs font-semibold tracking-wide uppercase mb-6 animate-slide-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span>Live Intelligence</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-semibold tracking-tighter leading-[0.95] text-slate-900 animate-slide-in delay-100">
              Real-time
              <br />
              <span className="text-brand-500">Awareness.</span>
            </h1>

            <p className="mt-6 text-base font-normal text-slate-500 leading-relaxed max-w-sm animate-slide-in delay-150">
              Traditional analytics tell you what happened yesterday. NowWhy tells you who is stuck on pricing <strong className="text-slate-700">right now</strong>.
            </p>
          </div>

          {/* Bottom Actions */}
          <div className="space-y-8 animate-slide-in delay-200">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                <Check className="w-4 h-4 text-brand-500" />
                <span>Intent Classification</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                <Check className="w-4 h-4 text-brand-500" />
                <span>Friction Detection</span>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t border-slate-100 pt-6">
              <Link
                href="/login"
                className="pl-5 pr-2 py-2 bg-slate-900 text-white rounded-full transition-all hover:bg-brand-500 hover:shadow-lg hover:shadow-orange-500/20 flex items-center gap-4 group w-full sm:w-auto justify-between"
              >
                <span className="text-sm font-semibold tracking-wide">Start Tracking</span>
                <div className="w-8 h-8 bg-white text-slate-900 rounded-full flex items-center justify-center group-hover:text-brand-500 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
              <span className="text-xs text-slate-400 font-medium hidden sm:block">No credit card required</span>
            </div>
          </div>
        </div>

        {/* Right Art / Abstract */}
        <div className="lg:col-span-8 overflow-hidden min-h-[50vh] lg:min-h-auto bg-slate-50 relative">
          {/* Abstract Background */}
          <div className="absolute inset-0 bg-grid-pattern bg-grid"></div>

          {/* Blobs */}
          <div className="absolute top-10 right-20 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob"></div>
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob animation-delay-2000"></div>

          <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-6 md:p-0">
            {/* 3D UI Card */}
            <div className="relative z-10 perspective-1000 group">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 w-full max-w-md transform transition-all duration-700 ease-out preserve-3d" style={{ transform: 'rotateY(12deg) rotateX(5deg)' }}>
                {/* Window Chrome */}
                <div className="h-10 border-b border-slate-100 flex items-center px-4 gap-2 bg-slate-50/50 rounded-t-2xl">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                  </div>
                  <div className="ml-auto text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Live Feed
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Visitor 1 */}
                  <div className="flex items-start gap-4 p-3 rounded-xl bg-orange-50/50 border border-orange-100/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white border border-orange-100 flex items-center justify-center shadow-sm text-brand-500 shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-slate-800">Visitor #8392 <span className="text-slate-400 font-normal">from San Francisco</span></p>
                        <span className="text-[10px] font-bold text-brand-600 bg-orange-100 px-1.5 py-0.5 rounded">HIGH_INTENT</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">Comparing pricing plans for 3m 21s</p>
                      <div className="h-1 w-full bg-orange-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 w-[85%] rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Visitor 2 */}
                  <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors opacity-60">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm text-slate-400 shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-slate-800">Visitor #8393 <span className="text-slate-400 font-normal">from London</span></p>
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">FRICTION</span>
                      </div>
                      <p className="text-xs text-slate-500">Stuck on signup form (2m)</p>
                    </div>
                  </div>
                </div>

                {/* Slack Notification Pop */}
                <div className="absolute -right-8 top-1/2 translate-x-4 bg-[#1e1e1e] p-3 rounded-lg shadow-2xl border border-white/10 w-64 animate-slide-in delay-500">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Slack Alert</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    <span className="text-white font-semibold">Hot Lead:</span> Visitor just visited Pricing twice and moved to Signup.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Big Typography Overlay */}
          <div className="absolute bottom-0 right-0 mix-blend-overlay opacity-[0.03] pointer-events-none select-none">
            <span className="text-[12rem] lg:text-[18rem] font-bold leading-none tracking-tighter text-slate-900">
              NOW
            </span>
          </div>
        </div>
      </div>

      {/* Features Section (Bento Grid) */}
      <section className="bg-brand-500 pt-24 pb-24 relative overflow-hidden noise-overlay">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end gap-6 mb-16 justify-between animate-slide-in">
            <div>
              <span className="text-orange-200 text-xs font-semibold tracking-widest uppercase">
                Why NowWhy?
              </span>
              <h2 className="text-3xl lg:text-5xl font-semibold text-white tracking-tight mt-3 max-w-xl">
                Turn Traffic into Revenue with <span className="opacity-50">Real Context.</span>
              </h2>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full border border-orange-400/50 flex items-center justify-center text-white hover:bg-white hover:text-brand-500 transition-colors">
                <ArrowDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Card 1: Intent Classification (Large) */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-3xl p-8 lg:p-10 overflow-hidden relative group">
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="mb-8">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl mb-6 flex items-center justify-center text-brand-600">
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl lg:text-3xl text-slate-900 font-semibold mb-3 tracking-tight">
                    Intent Classification (The Wedge)
                  </h3>
                  <p className="text-slate-500 leading-relaxed max-w-md">
                    Don&apos;t guess. We automatically label visitors based on behavior patterns. Distinguish between window shoppers and ready buyers.
                  </p>
                </div>

                {/* Visual Representation */}
                <div className="flex gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-green-50 border border-green-100 text-green-700 text-xs font-bold uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> High_Intent
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Evaluating
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-50 border border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Bounce_Risk
                  </span>
                </div>
              </div>

              {/* Decorative Background element */}
              <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-l from-orange-50/50 to-transparent"></div>
            </div>

            {/* Card 2: Real-time */}
            <div className="bg-slate-900 rounded-3xl p-8 overflow-hidden relative group border border-white/5">
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-brand-400 font-mono text-xs">LIVE_FEED</span>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  </div>
                  <h3 className="text-xl text-white font-semibold tracking-tight mb-2">Real-time Awareness</h3>
                  <p className="text-slate-400 text-sm">&quot;Someone from NYC is on pricing.&quot; Know what&apos;s happening NOW.</p>
                </div>

                {/* Mini Feed Visual */}
                <div className="mt-6 space-y-2">
                  <div className="bg-white/5 p-2 rounded border border-white/5 flex gap-2 items-center">
                    <div className="w-1 h-8 bg-brand-500 rounded-full"></div>
                    <div className="text-[10px] text-slate-300 font-mono">
                      User_291 &gt; /pricing<br />
                      <span className="text-slate-500">3s ago</span>
                    </div>
                  </div>
                  <div className="bg-white/5 p-2 rounded border border-white/5 flex gap-2 items-center opacity-50">
                    <div className="w-1 h-8 bg-slate-600 rounded-full"></div>
                    <div className="text-[10px] text-slate-300 font-mono">
                      User_290 &gt; /blog<br />
                      <span className="text-slate-500">12s ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Friction Detection */}
            <div className="bg-[#fefce8] rounded-3xl p-8 overflow-hidden relative group border border-yellow-100">
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center mb-4">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-xl text-yellow-900 font-semibold tracking-tight mb-2">Friction Detection</h3>
                <p className="text-yellow-800/80 text-sm mb-4">Identify pricing loops, form stalls, and rage clicks instantly.</p>

                <div className="mt-auto bg-white p-3 rounded-xl shadow-sm border border-yellow-100/50 flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs font-semibold text-slate-700">Pricing Loop Detected</span>
                </div>
              </div>
            </div>

            {/* Card 4: Slack Alerts (Large) */}
            <div className="col-span-1 md:col-span-2 bg-[#1e1e1e] rounded-3xl p-8 lg:p-10 relative overflow-hidden group">
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-500/20 rounded-full filter blur-[60px]"></div>

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider mb-4">
                    <Zap className="w-3 h-3" />
                    <span>Actionable</span>
                  </div>
                  <h3 className="text-2xl text-white font-semibold tracking-tight mb-3">
                    Alerts right where you work
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    &quot;A visitor from Google Ads just spent 4 minutes on pricing and moved to signup.&quot; Jump into chat at the perfect moment.
                  </p>
                </div>

                {/* Slack Mockup */}
                <div className="w-full md:w-1/2 bg-[#2c2c2c] rounded-xl border border-white/10 p-4 shadow-2xl">
                  <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                    <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-xs text-slate-300 font-bold">#growth-alerts</span>
                    <span className="text-[10px] text-slate-500 ml-auto">Just now</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded bg-brand-500 flex items-center justify-center text-white shrink-0">
                      <span className="font-bold text-xs">NW</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">NowWhy Bot</span>
                        <span className="text-[10px] bg-slate-700 text-slate-300 px-1 rounded">APP</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        <span className="text-white font-semibold">High Intent Visitor Detected!</span><br />
                        Visitor from <span className="text-blue-400">San Francisco</span> has been on <span className="bg-slate-700 px-1 rounded">/pricing</span> for 3 minutes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer/Integration Section */}
      <section className="py-24 bg-white relative overflow-hidden border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left Content */}
            <div className="order-2 lg:order-1 animate-slide-in">
              <h2 className="text-3xl lg:text-5xl font-semibold text-slate-900 tracking-tight leading-[0.95] mb-6">
                Drop-in simplicity.
                <br />
                <span className="text-brand-500">Under 2KB.</span>
              </h2>

              <p className="text-slate-600 text-lg font-light leading-relaxed mb-8">
                We don&apos;t bloat your site. Our ultra-lightweight script loads asynchronously and begins classifying intent immediately. No complex configuration required.
              </p>

              <div className="space-y-6 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mt-1">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-semibold text-sm">Privacy Friendly</h3>
                    <p className="text-slate-500 text-sm mt-1">GDPR compliant without cookies.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mt-1">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-semibold text-sm">Magic Link Auth</h3>
                    <p className="text-slate-500 text-sm mt-1">Secure, passwordless access to your dashboard.</p>
                  </div>
                </div>
              </div>

              <Link href="/login" className="inline-flex items-center gap-2 text-brand-600 font-semibold text-sm hover:text-brand-700 transition-colors group">
                Read Integration Docs
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Right Content: Code */}
            <div className="order-1 lg:order-2">
              <div className="bg-[#1e1e1e] rounded-xl shadow-2xl overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center px-4 py-3 bg-[#252526] border-b border-white/5">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                  </div>
                  <div className="ml-4 text-xs text-slate-500 font-mono">index.html</div>
                </div>
                <div className="p-6 overflow-x-auto">
                  <pre className="font-mono text-sm leading-relaxed text-slate-300">
                    <code>
                      <span className="text-slate-500">{`<!-- Just add this line to your <head> -->`}</span>{'\n'}
                      <span className="text-purple-400">&lt;script</span> <span className="text-orange-400">src</span>=<span className="text-green-400">&quot;https://cdn.nowwhy.com/tracker.js&quot;</span>{'\n'}
                      {'        '}<span className="text-orange-400">data-id</span>=<span className="text-green-400">&quot;nw_live_x829s&quot;</span>{'\n'}
                      {'        '}<span className="text-orange-400">defer</span><span className="text-purple-400">&gt;&lt;/script&gt;</span>{'\n\n'}
                      <span className="text-slate-500">{`<!-- That's it. You're live. -->`}</span>
                    </code>
                  </pre>
                </div>
                <div className="bg-[#2d2d2d] px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">System Active</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">1.8KB gzipped</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banner / CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-brand-500 rounded-[2.5rem] p-12 text-center relative overflow-hidden shadow-2xl shadow-orange-500/30">
            {/* Decorative Circles */}
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-semibold text-white tracking-tight mb-6">
                Stop flying blind.
              </h2>
              <p className="text-orange-100 text-lg mb-8 max-w-xl mx-auto font-light">
                Deploy in minutes. Polish later. Get the insights you need to fix your funnel today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="px-8 py-4 bg-white text-brand-600 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-slate-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/live"
                  className="px-8 py-4 bg-brand-600 text-white border border-white/20 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-brand-700 transition-all"
                >
                  View Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 pt-20 pb-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-brand-500 text-white flex items-center justify-center rounded-lg">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-lg font-bold text-slate-900 tracking-tight">NowWhy</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-6">
                The visitor intelligence platform for founders who want to know what&apos;s actually happening on their website.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-slate-400 hover:text-brand-500 transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="text-slate-400 hover:text-brand-500 transition-colors"><Github className="w-5 h-5" /></a>
                <a href="#" className="text-slate-400 hover:text-brand-500 transition-colors"><Linkedin className="w-5 h-5" /></a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-brand-500 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-brand-500 transition-colors">Pricing</a></li>
                <li><a href="/live" className="hover:text-brand-500 transition-colors">Live Demo</a></li>
                <li><a href="#" className="hover:text-brand-500 transition-colors flex items-center gap-2">Changelog <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded">New</span></a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-brand-500 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-brand-500 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-brand-500 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-brand-500 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-400 font-medium">&copy; 2025 NowWhy Inc. All rights reserved.</p>
            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-xs text-slate-600 font-medium">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
