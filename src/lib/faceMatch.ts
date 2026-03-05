import type { FaceProfile } from "./faceDb";

/**
 * 얼굴 유사도 계산 기준
 *
 * face-api.js 는 128차원 벡터 간 유클리디안 거리를 사용합니다.
 *   distance = 0.0  → 완전 동일 (100%)
 *   distance ≈ 0.4  → 동일인 높은 확신 (~90% 표시)
 *   distance ≈ 0.6  → 경계선 (~50% 표시)
 *   distance > 0.6  → 다른 사람
 *
 * similarity = clamp(0, 100,  (1 - distance) × 150 )
 *   → distance 0.40 → 90%  (인증 통과 기준)
 *   → distance 0.33 → 100%+ (상한선 100%)
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

/** 거리 → 유사도(%) 변환 */
export function distanceToSimilarity(distance: number): number {
  return Math.min(100, Math.round(Math.max(0, (1 - distance) * 150)));
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
