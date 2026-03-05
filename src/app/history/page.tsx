"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { loadAuthLogs, type AuthLog } from "@/lib/faceDb";
import { supabase } from "@/lib/supabase";

type Filter = "all" | "success" | "failed";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)         return `${diff}초 전`;
  if (diff < 3600)       return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400)      return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export default function HistoryPage() {
  const [logs,    setLogs]    = useState<AuthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<Filter>("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [error,   setError]   = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await loadAuthLogs(100);
      setLogs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // ── 단건 삭제 ─────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("auth_logs").delete().eq("id", id);
    if (error) {
      setError(`삭제 실패: ${error.message}`);
    } else {
      setLogs((prev) => prev.filter((l) => l.id !== id));
    }
    setDeleting(null);
  };

  // ── 전체 삭제 ─────────────────────────────────────────────────────────
  const handleClearAll = async () => {
    if (!confirm("모든 인증 내역을 삭제하시겠습니까?")) return;
    setClearing(true);
    const { error } = await supabase
      .from("auth_logs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // all rows
    if (error) {
      setError(`전체 삭제 실패: ${error.message}`);
    } else {
      setLogs([]);
    }
    setClearing(false);
  };

  const filtered = filter === "all" ? logs : logs.filter((l) => l.status === filter);
  const successCount = logs.filter((l) => l.status === "success").length;
  const failedCount  = logs.filter((l) => l.status === "failed").length;

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
        <div className="flex-1">
          <h2 className="text-base font-semibold text-white">인증 내역</h2>
          <p className="text-xs text-white/40">Auth History</p>
        </div>
        {/* 새로고침 */}
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/60 transition hover:bg-white/10 disabled:opacity-40"
        >
          <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </header>

      {/* 요약 카드 */}
      <section className="grid grid-cols-3 gap-3">
        <div className="card-dark flex flex-col items-center py-3">
          <span className="text-xl font-bold text-white">{logs.length}</span>
          <span className="mt-0.5 text-[11px] text-white/40">전체</span>
        </div>
        <div className="card-dark flex flex-col items-center py-3">
          <span className="text-xl font-bold text-green-400">{successCount}</span>
          <span className="mt-0.5 text-[11px] text-white/40">성공</span>
        </div>
        <div className="card-dark flex flex-col items-center py-3">
          <span className="text-xl font-bold text-red-400">{failedCount}</span>
          <span className="mt-0.5 text-[11px] text-white/40">실패</span>
        </div>
      </section>

      {/* 필터 탭 */}
      <section className="mt-4 flex gap-2">
        {(["all", "success", "failed"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              filter === f
                ? f === "all"     ? "bg-brand-600 text-white"
                : f === "success" ? "bg-green-500/30 text-green-300"
                                  : "bg-red-500/30 text-red-300"
                : "bg-white/5 text-white/40 hover:bg-white/10"
            }`}
          >
            {f === "all" ? "전체" : f === "success" ? "✓ 성공" : "✕ 실패"}
          </button>
        ))}

        {/* 전체 삭제 */}
        {logs.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="ml-auto rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-40"
          >
            {clearing ? "삭제 중..." : "전체 삭제"}
          </button>
        )}
      </section>

      {/* 에러 */}
      {error && (
        <div className="mt-3 rounded-xl bg-red-500/10 px-4 py-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* 로그 목록 */}
      <section className="mt-4 flex-1 space-y-3 pb-10">
        {loading ? (
          <div className="flex flex-col items-center gap-3 pt-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-500" />
            <p className="text-xs text-white/40">불러오는 중...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-16 text-center">
            <svg className="h-12 w-12 text-white/15" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <p className="text-sm text-white/30">
              {filter === "all" ? "인증 내역이 없습니다" : `${filter === "success" ? "성공" : "실패"} 내역이 없습니다`}
            </p>
          </div>
        ) : (
          filtered.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              deleting={deleting === log.id}
              onDelete={() => handleDelete(log.id)}
            />
          ))
        )}
      </section>
    </main>
  );
}

// ── 개별 로그 카드 ────────────────────────────────────────────────────────
function LogCard({
  log,
  deleting,
  onDelete,
}: {
  log: AuthLog;
  deleting: boolean;
  onDelete: () => void;
}) {
  const isSuccess = log.status === "success";

  return (
    <div className={`card-dark overflow-hidden ${deleting ? "opacity-50" : ""}`}>
      {/* 상단 바 */}
      <div className={`h-1 w-full ${isSuccess ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-gradient-to-r from-red-500 to-rose-400"}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* 아이콘 + 이름 */}
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isSuccess ? "bg-green-500/15" : "bg-red-500/15"}`}>
              {isSuccess ? (
                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {log.matched_name ?? "미확인"}
              </p>
              <p className={`text-xs font-medium ${isSuccess ? "text-green-400" : "text-red-400"}`}>
                {isSuccess ? "인증 성공" : "인증 실패"}
              </p>
            </div>
          </div>

          {/* 시간 + 삭제 */}
          <div className="flex flex-col items-end gap-2">
            <span className="text-[11px] text-white/35">{timeAgo(log.created_at)}</span>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-white/30 transition hover:bg-red-500/20 hover:text-red-400 disabled:opacity-40"
            >
              {deleting ? (
                <div className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-transparent" />
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* 유사도 게이지 */}
        {log.similarity !== null && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[11px]">
              <span className="text-white/40">유사도</span>
              <span className={`font-semibold ${isSuccess ? "text-green-400" : "text-red-400"}`}>
                {log.similarity}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
              <div
                className={`h-full rounded-full transition-all ${isSuccess ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-gradient-to-r from-red-500 to-rose-400"}`}
                style={{ width: `${log.similarity}%` }}
              />
            </div>
          </div>
        )}

        {/* 세부 정보 */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {log.distance !== null && (
            <span className="text-[11px] text-white/35">
              거리: {log.distance.toFixed(4)}
            </span>
          )}
          <span className="text-[11px] text-white/35">
            {new Date(log.created_at).toLocaleString("ko-KR")}
          </span>
        </div>

        {/* 실패 사유 */}
        {!isSuccess && log.fail_reason && (
          <p className="mt-2 rounded-lg bg-red-500/8 px-3 py-2 text-[11px] text-red-400/80">
            {log.fail_reason}
          </p>
        )}
      </div>
    </div>
  );
}
