"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import FaceDetector from "@/components/FaceDetector";
import { saveProfile } from "@/lib/faceDb";

type Step = "guide" | "capture" | "naming" | "saving" | "done" | "error";

export default function RegisterPage() {
  const [step, setStep]       = useState<Step>("guide");
  const [faceReady, setFaceReady] = useState(false);
  const [userName, setUserName]   = useState("");
  const [saveError, setSaveError] = useState("");

  // 최신 descriptor 를 ref 로 보관 (state 로 하면 매 프레임 리렌더 발생)
  const descriptorRef = useRef<Float32Array | null>(null);

  const handleFaceDetected = useCallback((detected: boolean) => {
    setFaceReady(detected);
  }, []);

  const handleDescriptor = useCallback((desc: Float32Array | null) => {
    descriptorRef.current = desc;
  }, []);

  // ── 캡처 버튼: 현재 descriptor 고정 후 이름 입력 단계로 이동
  const handleCapture = () => {
    if (!faceReady || !descriptorRef.current) return;
    setStep("naming");
  };

  // ── 이름 입력 후 Supabase 저장
  const handleSave = async () => {
    const name = userName.trim();
    if (!name) return;
    if (!descriptorRef.current) { setSaveError("얼굴 데이터가 없습니다. 다시 촬영하세요."); return; }

    setStep("saving");
    setSaveError("");

    try {
      await saveProfile(name, descriptorRef.current);
      setStep("done");
    } catch (err) {
      console.error(err);
      setSaveError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
      setStep("error");
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-surface-900 px-6">
      <div className="h-12" />

      {/* 헤더 */}
      <header className="flex items-center gap-4 py-4">
        <Link href="/">
          <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/60 transition hover:bg-white/10">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
        </Link>
        <div>
          <h2 className="text-base font-semibold text-white">얼굴 등록</h2>
          <p className="text-xs text-white/40">Face Registration</p>
        </div>
      </header>

      {/* 프로그레스 바 */}
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-700"
          style={{
            width:
              step === "guide"   ? "20%" :
              step === "capture" ? "40%" :
              step === "naming"  ? "60%" :
              step === "saving"  ? "80%" : "100%",
          }}
        />
      </div>

      {/* ─── Step: 가이드 ─────────────────────────────────────── */}
      {step === "guide" && (
        <section className="mt-10 flex flex-col items-center text-center">
          <div className="relative mb-8 flex h-44 w-44 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-brand-500/30 animate-spin" style={{ animationDuration: "12s" }} />
            <div className="absolute inset-4 rounded-full border border-brand-500/20" />
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-surface-700 to-surface-800">
              <svg className="h-16 w-16 text-brand-500/60" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
          </div>

          <h3 className="text-xl font-bold text-white">얼굴을 등록해 주세요</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/45">
            카메라 정면을 바라보고<br />밝은 환경에서 촬영하세요.
          </p>

          <div className="mt-8 w-full space-y-3">
            {[
              { icon: "💡", text: "충분한 조명이 있는 곳에서 진행하세요" },
              { icon: "🙂", text: "표정은 자연스럽게 유지해 주세요" },
              { icon: "👓", text: "안경·마스크 착용 시 인식률이 낮아질 수 있어요" },
            ].map((tip) => (
              <div key={tip.text} className="card-dark flex items-center gap-3 p-3">
                <span className="text-lg">{tip.icon}</span>
                <p className="text-xs text-white/55">{tip.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-auto w-full pb-10 pt-8">
            <button className="btn-primary w-full text-base" onClick={() => setStep("capture")}>
              카메라 시작
            </button>
          </div>
        </section>
      )}

      {/* ─── Step: 촬영 ───────────────────────────────────────── */}
      {step === "capture" && (
        <section className="mt-6 flex flex-col">
          <FaceDetector
            onFaceDetected={handleFaceDetected}
            onDescriptorUpdate={handleDescriptor}
            showLandmarks
          />

          <p className="mt-3 text-center text-sm text-white/40">
            얼굴이 감지되면 <span className="text-blue-400">파란 박스</span>와 특징점이 나타납니다
          </p>

          <div className="mt-4 flex gap-3 pb-8">
            <button className="btn-secondary flex-1 text-sm" onClick={() => setStep("guide")}>
              이전
            </button>
            <button
              className={`flex-[2] rounded-2xl px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                faceReady ? "btn-primary" : "cursor-not-allowed bg-white/5 text-white/25"
              }`}
              onClick={handleCapture}
              disabled={!faceReady}
            >
              {faceReady ? "이 얼굴로 등록하기" : "얼굴 감지 중..."}
            </button>
          </div>
        </section>
      )}

      {/* ─── Step: 이름 입력 ──────────────────────────────────── */}
      {step === "naming" && (
        <section className="mt-10 flex flex-col">
          {/* 등록 미리보기 아이콘 */}
          <div className="mb-8 flex justify-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600/20">
              <svg className="h-10 w-10 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              {/* 체크 뱃지 */}
              <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
            </div>
          </div>

          <h3 className="text-center text-xl font-bold text-white">이름을 입력해 주세요</h3>
          <p className="mt-2 text-center text-sm text-white/45">
            얼굴 인식 시 이 이름으로 표시됩니다
          </p>

          {/* 이름 입력 */}
          <div className="mt-8">
            <label className="mb-2 block text-xs font-medium text-white/50">이름</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="홍길동"
              maxLength={20}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base text-white placeholder-white/25 outline-none transition focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20"
              autoFocus
            />
          </div>

          {/* 벡터 정보 */}
          <div className="mt-4 card-dark flex items-center gap-3 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600/20">
              <svg className="h-4 w-4 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-white/60">얼굴 특징 벡터 준비됨</p>
              <p className="text-[11px] text-white/35">128차원 · Supabase에 암호화 저장</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3 pb-10">
            <button className="btn-secondary flex-1 text-sm" onClick={() => { setUserName(""); setStep("capture"); }}>
              다시 촬영
            </button>
            <button
              className={`flex-[2] rounded-2xl px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                userName.trim() ? "btn-primary" : "cursor-not-allowed bg-white/5 text-white/25"
              }`}
              onClick={handleSave}
              disabled={!userName.trim()}
            >
              저장하기
            </button>
          </div>
        </section>
      )}

      {/* ─── Step: 저장 중 ────────────────────────────────────── */}
      {step === "saving" && (
        <section className="mt-16 flex flex-col items-center text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-brand-600/20 blur-2xl animate-pulse" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-surface-700">
              <svg className="h-12 w-12 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold text-white">저장 중...</h3>
          <p className="mt-2 text-sm text-white/40">Supabase에 얼굴 데이터를 저장하고 있습니다</p>
        </section>
      )}

      {/* ─── Step: 완료 ───────────────────────────────────────── */}
      {step === "done" && (
        <section className="mt-16 flex flex-col items-center text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-green-500/20 blur-2xl" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-500/15">
              <svg className="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-white">등록 완료!</h3>
          <p className="mt-2 text-sm text-white/50">
            <span className="font-semibold text-white">{userName}</span>님의<br />
            얼굴 데이터가 저장되었습니다.
          </p>

          <div className="mt-8 w-full card-dark divide-y divide-white/5">
            {[
              { label: "등록자",      value: userName },
              { label: "벡터 차원",   value: "128차원 Float32" },
              { label: "저장 위치",   value: "Supabase (face_profiles)" },
              { label: "등록 일시",   value: new Date().toLocaleString("ko-KR") },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-white/40">{row.label}</span>
                <span className="text-xs font-medium text-white/80">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 w-full space-y-3 pb-10">
            <Link href="/auth" className="block">
              <button className="btn-primary w-full text-base">인증 시작하기</button>
            </Link>
            <Link href="/" className="block">
              <button className="btn-secondary w-full text-base">홈으로</button>
            </Link>
          </div>
        </section>
      )}

      {/* ─── Step: 에러 ───────────────────────────────────────── */}
      {step === "error" && (
        <section className="mt-16 flex flex-col items-center text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-red-500/20 blur-2xl" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-red-500/15">
              <svg className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold text-white">저장 실패</h3>
          <p className="mt-2 text-sm text-white/50">{saveError}</p>
          <p className="mt-1 text-xs text-white/30">.env.local Supabase 환경변수를 확인하세요</p>

          <div className="mt-8 w-full space-y-3 pb-10">
            <button className="btn-primary w-full text-base" onClick={() => { setSaveError(""); setStep("capture"); }}>
              다시 시도
            </button>
            <Link href="/" className="block">
              <button className="btn-secondary w-full text-base">홈으로</button>
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
