/**
 * face-api.js 모델 파일 다운로드 스크립트
 * 실행: node scripts/download-models.mjs
 *
 * 다운로드 위치: public/models/
 * (Next.js public 폴더 → 브라우저에서 /models/... 로 접근 가능)
 */

import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEST_DIR = path.join(__dirname, "../public/models");

const BASE =
  "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";

// 필요한 모델 파일 목록
const FILES = [
  // TinyFaceDetector – 빠른 실시간 얼굴 감지
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model-shard1",
  // FaceLandmark68Net – 68개 특징점 추출
  "face_landmark_68_model-weights_manifest.json",
  "face_landmark_68_model-shard1",
  // FaceRecognitionNet – 128차원 얼굴 벡터 생성 (얼굴 대조용)
  "face_recognition_model-weights_manifest.json",
  "face_recognition_model-shard1",
  "face_recognition_model-shard2",
];

// ── 헬퍼: 리디렉션 추적 다운로드 ──────────────────────────────────────────
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    const req = https.get(url, (res) => {
      // 301/302 리디렉션 처리
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        try { fs.unlinkSync(dest); } catch {}
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(dest); } catch {}
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }

      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    });

    req.on("error", (err) => {
      try { fs.unlinkSync(dest); } catch {}
      reject(err);
    });
  });
}

// ── 메인 ──────────────────────────────────────────────────────────────────
(async () => {
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
  }

  console.log(`\n📦 face-api.js 모델 다운로드\n   → ${DEST_DIR}\n`);

  let ok = 0;
  for (const file of FILES) {
    const dest = path.join(DEST_DIR, file);

    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      console.log(`  ✓ ${file} (이미 존재)`);
      ok++;
      continue;
    }

    process.stdout.write(`  ↓ ${file} ...`);
    try {
      await download(`${BASE}/${file}`, dest);
      const kb = Math.round(fs.statSync(dest).size / 1024);
      console.log(` 완료 (${kb} KB)`);
      ok++;
    } catch (err) {
      console.log(` ❌ 실패: ${err.message}`);
    }
  }

  console.log(`\n${ok === FILES.length ? "✅" : "⚠️ "} ${ok}/${FILES.length} 완료`);
  if (ok < FILES.length) {
    console.log("네트워크를 확인하거나 GitHub Raw에 수동으로 접근해 주세요.");
    process.exit(1);
  }
})();
