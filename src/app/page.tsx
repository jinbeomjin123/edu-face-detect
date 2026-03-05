"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-surface-900 px-6">
      {/* Status bar area */}
      <div className="h-12" />

      {/* Header */}
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 1 1 3 0m-3 6a1.5 1.5 0 0 0 3 0m0 0V8.5m0 3a1.5 1.5 0 0 0 3 0m0 0V5.5a1.5 1.5 0 0 1 3 0V10m0 0a1.5 1.5 0 0 0 3 0m0 0v-1a1.5 1.5 0 0 1 3 0V10m-9 3 3-1 3 1" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-wide text-white/80">FaceAuth</span>
        </div>
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
          <svg className="h-4 w-4 text-white/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
          </svg>
        </button>
      </header>

      {/* Hero section */}
      <section className="mt-10 flex flex-col items-center text-center">
        {/* Shield / Face icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full bg-brand-600/20 blur-2xl" />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 shadow-glow-lg">
            <svg className="h-14 w-14 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          {/* Ping animation */}
          <span className="absolute right-1 top-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-green-500" />
          </span>
        </div>

        <h1 className="text-3xl font-bold leading-tight text-white">
          얼굴 인증으로<br />
          <span className="text-gradient">안전하게 로그인</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/45">
          AI 기반 안면 인식으로 비밀번호 없이<br />빠르고 안전하게 인증하세요.
        </p>
      </section>

      {/* Stats strip */}
      <section className="mt-10 grid grid-cols-3 gap-3">
        {[
          { label: "인증 속도", value: "0.3초" },
          { label: "정확도",   value: "99.9%" },
          { label: "보안 등급", value: "AAA" },
        ].map((stat) => (
          <div key={stat.label} className="card-dark flex flex-col items-center py-4">
            <span className="text-lg font-bold text-brand-400">{stat.value}</span>
            <span className="mt-1 text-[11px] text-white/40">{stat.label}</span>
          </div>
        ))}
      </section>

      {/* Notice card */}
      <section className="mt-6">
        <div className="card-dark p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
              <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-400">첫 사용 안내</p>
              <p className="mt-1 text-xs leading-relaxed text-white/50">
                처음 이용하시는 경우 먼저 <strong className="text-white/70">얼굴 등록</strong>을 진행해 주세요. 등록 후 인증을 시작할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons */}
      <section className="pb-10 pt-6 space-y-3">
        <Link href="/register" className="block">
          <button className="btn-secondary w-full text-base">
            <div className="flex items-center justify-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600/20">
                <svg className="h-4 w-4 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
              </div>
              <span>얼굴 등록</span>
            </div>
          </button>
        </Link>

        <Link href="/auth" className="block">
          <button className="btn-primary w-full text-base">
            <div className="flex items-center justify-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <span>인증 시작</span>
            </div>
          </button>
        </Link>

        <Link href="/history" className="block">
          <button className="w-full rounded-2xl border border-white/8 bg-white/3 px-6 py-3.5 text-sm font-medium text-white/50 transition hover:bg-white/6 hover:text-white/70">
            <div className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span>인증 내역 보기</span>
            </div>
          </button>
        </Link>

        <p className="pt-1 text-center text-[11px] text-white/25">
          생체 정보는 기기 내에서만 처리되며 외부로 전송되지 않습니다.
        </p>
      </section>
    </main>
  );
}
