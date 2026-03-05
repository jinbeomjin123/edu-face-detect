"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import FaceDetector from "@/components/FaceDetector";
import { loadAllProfiles, saveAuthLog } from "@/lib/faceDb";
import { findBestMatch, AUTH_THRESHOLD, type MatchResult } from "@/lib/faceMatch";

type AuthStep = "scanning" | "verifying" | "success" | "failed";

export default function AuthPage() {
  const [step, setStep]         = useState<AuthStep>("scanning");
  const [faceReady, setFaceReady] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [failReason, setFailReason]   = useState("");

  const descriptorRef = useRef<Float32Array | null>(null);

  const handleFaceDetected = useCallback((detected: boolean) => {
    setFaceReady(detected);
  }, []);

  const handleDescriptor = useCallback((desc: Float32Array | null) => {
    descriptorRef.current = desc;
  }, []);

  // ── 인증 실행 ────────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (!faceReady || !descriptorRef.current) return;

    const currentDesc = descriptorRef.current;
    setVerifying(true);
    setStep("verifying");

    try {
      const profiles = await loadAllProfiles();

      if (profiles.length === 0) {
        setFailReason("등록된 얼굴이 없습니다. 먼저 얼굴을 등록해 주세요.");
        setStep("failed");
        return;
      }

      const result = findBestMatch(currentDesc, profiles);

      if (result && result.similarity >= AUTH_THRESHOLD) {
        setMatchResult(result);
        // ── 성공 로그 저장
        await saveAuthLog({
          face_profile_id: result.id,
          matched_name:    result.name,
          similarity:      result.similarity,
          distance:        result.distance,
          status:          "success",
        });
        setStep("success");
      } else {
        setMatchResult(result);
        const reason = result
          ? `가장 유사한 사람: ${result.name} (${result.similarity}%) — 90% 미만`
          : "일치하는 얼굴을 찾지 못했습니다.";
        setFailReason(reason);
        // ── 실패 로그 저장
        await saveAuthLog({
          face_profile_id: result?.id ?? null,
          matched_name:    result?.name ?? null,
          similarity:      result?.similarity ?? null,
          distance:        result?.distance ?? null,
          status:          "failed",
          fail_reason:     reason,
        });
        setStep("failed");
      }
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "인증 중 오류 발생";
      setFailReason(msg);
      await saveAuthLog({ status: "failed", fail_reason: msg });
      setStep("failed");
    } finally {
      setVerifying(false);
    }
  };

  const resetToScan = () => {
    setFaceReady(false);
    setMatchResult(null);
    setFailReason("");
    setStep("scanning");
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
          <h2 className="text-base font-semibold text-white">인증 시작</h2>
          <p className="text-xs text-white/40">Face Authentication</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] font-medium text-green-400">보안 연결</span>
        </div>
      </header>

      {/* ─── Step: 스캔 ───────────────────────────────────────── */}
      {step === "scanning" && (
        <section className="mt-4 flex flex-col">
          <FaceDetector
            onFaceDetected={handleFaceDetected}
            onDescriptorUpdate={handleDescriptor}
            showLandmarks
          />

          <p className="mt-3 text-center text-sm text-white/40">
            얼굴이 감지되면 인증 버튼이 활성화됩니다
          </p>

          <div className="mt-4 pb-8">
            <button
              className={`w-full rounded-2xl px-6 py-4 text-base font-semibold transition-all duration-200 ${
                faceReady && !verifying
                  ? "btn-primary"
                  : "cursor-not-allowed bg-white/5 text-white/25"
              }`}
              onClick={handleVerify}
              disabled={!faceReady || verifying}
            >
              {verifying ? "인증 중..." : faceReady ? "인증하기" : "얼굴을 인식하는 중..."}
            </button>
          </div>
        </section>
      )}

      {/* ─── Step: 대조 중 ────────────────────────────────────── */}
      {step === "verifying" && (
        <section className="mt-16 flex flex-col items-center text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-brand-600/25 blur-2xl animate-pulse" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-surface-700 to-surface-800">
              <svg className="h-14 w-14 animate-spin text-brand-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          </div>

          <h3 className="text-xl font-bold text-white">얼굴 대조 중...</h3>
          <p className="mt-2 text-sm text-white/40">
            Supabase에서 등록된 얼굴과 비교하고 있습니다
          </p>

          <div className="mt-10 w-full space-y-2">
            {[
              { label: "DB 프로필 로드",    done: true  },
              { label: "128차원 벡터 비교", done: true  },
              { label: "유사도 계산",        done: false },
            ].map((m) => (
              <div key={m.label} className="card-dark flex items-center justify-between px-4 py-3">
                <span className="text-sm text-white/60">{m.label}</span>
                {m.done ? (
                  <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Step: 인증 성공 ──────────────────────────────────── */}
      {step === "success" && matchResult && (
        <section className="mt-12 flex flex-col items-center text-center">
          {/* 성공 아이콘 */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-green-500/20 blur-2xl" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-green-500/15">
              <svg className="h-14 w-14 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-white">인증 완료!</h3>
          <p className="mt-1 text-base text-white/60">
            <span className="font-bold text-white">{matchResult.name}</span>님으로 확인되었습니다
          </p>

          {/* 유사도 게이지 */}
          <div className="mt-6 w-full card-dark p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-white/60">얼굴 유사도</span>
              <span className="text-2xl font-bold text-green-400">{matchResult.similarity}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000"
                style={{ width: `${matchResult.similarity}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-white/30">
              <span>0%</span>
              <span className="text-white/50">인증 기준 {AUTH_THRESHOLD}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="mt-4 w-full card-dark divide-y divide-white/5">
            {[
              { label: "인증 방식",  value: "얼굴 인식 (AI)" },
              { label: "유사도",     value: `${matchResult.similarity}%` },
              { label: "거리값",     value: matchResult.distance.toFixed(4) },
              { label: "인증 일시",  value: new Date().toLocaleString("ko-KR") },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-white/40">{row.label}</span>
                <span className="text-xs font-medium text-white/80">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 w-full space-y-3 pb-10">
            <button className="btn-primary w-full text-base">서비스 이용하기</button>
            <Link href="/" className="block">
              <button className="btn-secondary w-full text-base">홈으로</button>
            </Link>
          </div>
        </section>
      )}

      {/* ─── Step: 인증 실패 ──────────────────────────────────── */}
      {step === "failed" && (
        <section className="mt-12 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-red-500/20 blur-2xl" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-red-500/15">
              <svg className="h-14 w-14 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-white">인증 실패</h3>
          <p className="mt-2 text-sm text-white/50">
            등록된 얼굴과 일치하지 않습니다
          </p>

          {/* 유사도 게이지 (실패) */}
          {matchResult && (
            <div className="mt-6 w-full card-dark p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-white/60">최고 유사도</span>
                <span className="text-2xl font-bold text-red-400">{matchResult.similarity}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-1000"
                  style={{ width: `${matchResult.similarity}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-white/30">
                <span>0%</span>
                <span className="text-white/50">인증 기준 {AUTH_THRESHOLD}%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          <div className="mt-4 w-full card-dark p-4">
            <p className="text-xs font-medium text-white/50">{failReason}</p>
            <ul className="mt-3 space-y-2 text-left">
              {["조명이 충분한지 확인하세요", "카메라 정면을 바라보세요", "마스크·안경을 제거해 보세요"].map((r) => (
                <li key={r} className="flex items-center gap-2 text-xs text-white/45">
                  <div className="h-1 w-1 shrink-0 rounded-full bg-red-400" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 w-full space-y-3 pb-10">
            <button className="btn-primary w-full text-base" onClick={resetToScan}>
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
