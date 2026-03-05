import type { FaceProfile } from "./faceDb";

/**
 * 얼굴 유사도 계산 기준
 *
 * face-api.js 는 128차원 벡터 간 유클리디안 거리를 사용합니다.
 *   distance = 0.0  → 완전 동일 (100%)
 *   distance ≈ 0.1  → 같은 사람 (~97%)
 *   distance ≈ 0.3  → 같은 사람 (~92%)
 *   distance = 0.4  → 인증 경계선 (90%)
 *   distance = 0.6  → 다른 사람 (~60%)
 *   distance = 1.0  → 완전 다른 사람 (0%)
 *
 * d ≤ 0.4: similarity = 90 + (0.4 - d) / 0.4 × 10   → [100%, 90%]
 * d > 0.4: similarity = 90 × (1 - (d - 0.4) / 0.6)  → [90%, 0%]
 */

/** 인증 통과 최소 유사도 (%) */
export const AUTH_THRESHOLD = 90;

/** 유클리디안 거리 계산 */
export function euclideanDistance(
  a: Float32Array | number[],
  b: Float32Array | number[]
): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = (a as number[])[i] - (b as number[])[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/** 거리 → 유사도(%) 변환
 * d=0.0 → 100%, d=0.1 → 97%, d=0.3 → 92%, d=0.4 → 90%, d=1.0 → 0%
 */
export function distanceToSimilarity(distance: number): number {
  const THRESHOLD_DIST = 0.4;
  if (distance <= THRESHOLD_DIST) {
    return Math.round(AUTH_THRESHOLD + (THRESHOLD_DIST - distance) / THRESHOLD_DIST * (100 - AUTH_THRESHOLD));
  } else {
    return Math.max(0, Math.round(AUTH_THRESHOLD * (1 - (distance - THRESHOLD_DIST) / (1 - THRESHOLD_DIST))));
  }
}

export interface MatchResult {
  id: string;
  name: string;
  similarity: number; // 0~100
  distance: number;
}

/**
 * 현재 얼굴 descriptor 를 DB 프로필 전체와 비교해 가장 유사한 항목 반환
 * - 일치 항목이 없으면 null 반환
 */
export function findBestMatch(
  current: Float32Array,
  profiles: FaceProfile[]
): MatchResult | null {
  if (profiles.length === 0) return null;

  let best: MatchResult | null = null;

  for (const p of profiles) {
    const distance   = euclideanDistance(current, p.descriptor);
    const similarity = distanceToSimilarity(distance);

    if (!best || similarity > best.similarity) {
      best = { id: p.id, name: p.name, similarity, distance };
    }
  }

  return best;
}
