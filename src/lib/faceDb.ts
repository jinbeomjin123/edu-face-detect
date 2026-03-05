import { supabase } from "./supabase";

export interface FaceProfile {
  id: string;
  name: string;
  descriptor: number[]; // 128차원 float 벡터
  created_at: string;
}

/**
 * 얼굴 프로필 저장
 * - descriptor: face-api.js가 생성한 Float32Array (128차원)
 */
export async function saveProfile(
  name: string,
  descriptor: Float32Array
): Promise<FaceProfile> {
  const { data, error } = await supabase
    .from("face_profiles")
    .insert({ name, descriptor: Array.from(descriptor) })
    .select()
    .single();

  if (error) throw new Error(`저장 실패: ${error.message}`);
  return data as FaceProfile;
}

/**
 * 등록된 모든 얼굴 프로필 불러오기
 */
export async function loadAllProfiles(): Promise<FaceProfile[]> {
  const { data, error } = await supabase
    .from("face_profiles")
    .select("id, name, descriptor, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`조회 실패: ${error.message}`);
  return (data ?? []) as FaceProfile[];
}

/**
 * 특정 프로필 삭제
 */
export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabase
    .from("face_profiles")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`삭제 실패: ${error.message}`);
}

// ── 인증 내역 (auth_logs) ────────────────────────────────────────────────

export interface AuthLog {
  id: string;
  face_profile_id: string | null;
  matched_name: string | null;
  similarity: number | null;
  distance: number | null;
  status: "success" | "failed";
  fail_reason: string | null;
  created_at: string;
}

export interface SaveAuthLogParams {
  face_profile_id?: string | null;
  matched_name?: string | null;
  similarity?: number | null;
  distance?: number | null;
  status: "success" | "failed";
  fail_reason?: string | null;
}

/**
 * 인증 내역 저장
 */
export async function saveAuthLog(params: SaveAuthLogParams): Promise<void> {
  const { error } = await supabase.from("auth_logs").insert({
    face_profile_id: params.face_profile_id ?? null,
    matched_name:    params.matched_name    ?? null,
    similarity:      params.similarity      ?? null,
    distance:        params.distance        ?? null,
    status:          params.status,
    fail_reason:     params.fail_reason     ?? null,
  });

  if (error) console.error("[saveAuthLog]", error.message);
}

/**
 * 인증 내역 조회 (최신순)
 */
export async function loadAuthLogs(limit = 50): Promise<AuthLog[]> {
  const { data, error } = await supabase
    .from("auth_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`조회 실패: ${error.message}`);
  return (data ?? []) as AuthLog[];
}
