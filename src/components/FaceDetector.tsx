"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const MODEL_URL = "/models";

// ── 68 랜드마크 그룹: [시작, 끝, 폐곡선, 색상] ──────────────────────────
const LANDMARK_GROUPS: [number, number, boolean, string][] = [
  [0,  16, false, "#60a5fa"], // 턱선
  [17, 21, false, "#c084fc"], // 왼쪽 눈썹
  [22, 26, false, "#c084fc"], // 오른쪽 눈썹
  [27, 30, false, "#4ade80"], // 코 다리
  [31, 35, true,  "#4ade80"], // 코 끝
  [36, 41, true,  "#f472b6"], // 왼쪽 눈
  [42, 47, true,  "#f472b6"], // 오른쪽 눈
  [48, 59, true,  "#facc15"], // 입술 외곽
  [60, 67, true,  "#facc15"], // 입술 내부
];

const LEGEND = [
  { label: "턱선", color: "#60a5fa" },
  { label: "눈썹", color: "#c084fc" },
  { label: "코",   color: "#4ade80" },
  { label: "눈",   color: "#f472b6" },
  { label: "입",   color: "#facc15" },
];

type Phase     = "loading" | "scanning" | "error";
type ErrorKind = "model" | "camera" | "unknown";

export interface FaceDetectorProps {
  /** 얼굴 감지 여부 + 신뢰도 콜백 */
  onFaceDetected?: (detected: boolean, confidence?: number) => void;
  /** 128차원 얼굴 descriptor 콜백 (얼굴 없으면 null) */
  onDescriptorUpdate?: (descriptor: Float32Array | null) => void;
  showLandmarks?: boolean;
}

export default function FaceDetector({
  onFaceDetected,
  onDescriptorUpdate,
  showLandmarks = true,
}: FaceDetectorProps) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const runningRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const faceApiRef = useRef<any>(null);

  const [phase,      setPhase]      = useState<Phase>("loading");
  const [loadMsg,    setLoadMsg]    = useState("AI 모델 초기화 중...");
  const [errorKind,  setErrorKind]  = useState<ErrorKind>("unknown");
  const [detected,   setDetected]   = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [ptCount,    setPtCount]    = useState(0);

  // ── 1. 모델 로드 + 카메라 초기화 ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // ① 라이브러리 임포트
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let faceapi: any;
      try {
        setLoadMsg("face-api.js 라이브러리 로드 중...");
        faceapi = await import("face-api.js");
        faceApiRef.current = faceapi;
      } catch (err) {
        console.error("[FaceDetector] import 실패:", err);
        if (!cancelled) { setErrorKind("model"); setPhase("error"); }
        return;
      }

      // ② 모델 파일 로드
      try {
        setLoadMsg("얼굴 감지 모델 로드 중...");
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

        setLoadMsg("특징점 모델 로드 중...");
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

        setLoadMsg("얼굴 인식 모델 로드 중... (약 6 MB)");
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      } catch (err) {
        console.error("[FaceDetector] 모델 로드 실패:", err);
        if (!cancelled) { setErrorKind("model"); setPhase("error"); }
        return;
      }

      if (cancelled) return;

      // ③ 카메라 스트림
      try {
        setLoadMsg("카메라 연결 중...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

        const video = videoRef.current;
        if (video) { video.srcObject = stream; await video.play(); }
        setPhase("scanning");
      } catch (err) {
        console.error("[FaceDetector] 카메라 실패:", err);
        if (!cancelled) { setErrorKind("camera"); setPhase("error"); }
      }
    })();

    return () => {
      cancelled = true;
      const video = videoRef.current;
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ── 2. 실시간 감지 루프 ───────────────────────────────────────────────
  const detect = useCallback(async () => {
    const faceapi = faceApiRef.current;
    const video   = videoRef.current;
    const canvas  = canvasRef.current;

    if (!faceapi || !video || !canvas || !runningRef.current) return;

    const W = video.videoWidth;
    const H = video.videoHeight;
    if (W === 0 || H === 0) { requestAnimationFrame(detect); return; }

    if (canvas.width  !== W) canvas.width  = W;
    if (canvas.height !== H) canvas.height = H;

    // 얼굴 감지 + 랜드마크 + 128차원 descriptor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any[] = await faceapi
      .detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5, inputSize: 320 })
      )
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (!runningRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    if (results.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const best = results.reduce((a: any, b: any) =>
        a.detection.score > b.detection.score ? a : b
      );
      const conf = Math.round(best.detection.score * 100);

      setDetected(true);
      setConfidence(conf);
      setPtCount(best.landmarks.positions.length);
      onFaceDetected?.(true, best.detection.score);
      onDescriptorUpdate?.(best.descriptor as Float32Array);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.forEach(({ detection, landmarks }: { detection: any; landmarks: any }) => {
        const { x, y, width, height } = detection.box;

        // ── 파란색 바운딩 박스 + 글로우 ─────────────────────────────
        ctx.save();
        ctx.shadowBlur  = 18;
        ctx.shadowColor = "rgba(59,130,246,0.85)";
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth   = 2;
        ctx.strokeRect(x, y, width, height);
        ctx.restore();

        // ── 코너 브라켓 ──────────────────────────────────────────────
        const cl = Math.min(width, height) * 0.14;
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth   = 3;
        ctx.lineCap     = "round";
        (
          [
            [x,          y + cl,      x,        y,        x + cl,   y        ],
            [x+width-cl, y,           x+width,  y,        x+width,  y + cl   ],
            [x,          y+height-cl, x,        y+height, x+cl,     y+height ],
            [x+width-cl, y+height,    x+width,  y+height, x+width,  y+height-cl],
          ] as [number, number, number, number, number, number][]
        ).forEach(([x1, y1, x2, y2, x3, y3]) => {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x3, y3);
          ctx.stroke();
        });

        // ── 신뢰도 레이블 ─────────────────────────────────────────────
        const label = `${conf}%`;
        ctx.font      = "bold 13px Inter, system-ui, sans-serif";
        const tw      = ctx.measureText(label).width + 14;
        ctx.fillStyle = "rgba(37,99,235,0.85)";
        ctx.beginPath();
        ctx.roundRect(x, y - 24, tw, 20, 4);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillText(label, x + 7, y - 9);

        // ── 68개 랜드마크 ────────────────────────────────────────────
        if (showLandmarks) {
          const pts = landmarks.positions;
          LANDMARK_GROUPS.forEach(([start, end, close, color]) => {
            const group = pts.slice(start, end + 1);
            ctx.save();
            ctx.strokeStyle = color;
            ctx.fillStyle   = color;
            ctx.lineWidth   = 1.2;
            ctx.globalAlpha = 0.72;

            ctx.beginPath();
            ctx.moveTo(group[0].x, group[0].y);
            for (let i = 1; i < group.length; i++) ctx.lineTo(group[i].x, group[i].y);
            if (close) ctx.closePath();
            ctx.stroke();

            ctx.globalAlpha = 1;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            group.forEach((p: any) => {
              ctx.beginPath();
              ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
              ctx.fill();
            });
            ctx.restore();
          });
        }
      });
    } else {
      setDetected(false);
      setConfidence(0);
      setPtCount(0);
      onFaceDetected?.(false);
      onDescriptorUpdate?.(null);
    }

    if (runningRef.current) requestAnimationFrame(detect);
  }, [showLandmarks, onFaceDetected, onDescriptorUpdate]);

  // ── 3. 루프 시작/정지 ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "scanning") return;
    runningRef.current = true;
    requestAnimationFrame(detect);
    return () => { runningRef.current = false; };
  }, [phase, detect]);

  // ── 렌더 ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-3">
      {/* 카메라 뷰 */}
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-surface-800"
        style={{ aspectRatio: "4/3" }}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: "fill", transform: "scaleX(-1)" }}
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* 로딩 */}
        {phase === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface-800">
            <div className="relative">
              <div className="h-14 w-14 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-brand-600/30" />
              </div>
            </div>
            <p className="px-4 text-center text-xs text-white/50">{loadMsg}</p>
          </div>
        )}

        {/* 에러 */}
        {phase === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-800 px-6 text-center">
            <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            {errorKind === "model" ? (
              <>
                <p className="text-sm font-semibold text-red-400">모델 파일 없음</p>
                <p className="text-xs text-white/50">터미널에서 먼저 실행하세요</p>
                <code className="rounded-lg bg-black/50 px-3 py-2 text-xs text-amber-300">npm run models</code>
              </>
            ) : errorKind === "camera" ? (
              <>
                <p className="text-sm font-semibold text-red-400">카메라 접근 실패</p>
                <p className="text-xs text-white/50">주소창 왼쪽 카메라 아이콘에서<br/>권한을 허용해 주세요</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-red-400">초기화 실패</p>
                <p className="text-xs text-white/40">F12 콘솔에서 오류를 확인하세요</p>
              </>
            )}
          </div>
        )}

        {/* 감지 상태 칩 */}
        {phase === "scanning" && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-md transition-all duration-300 ${
                detected
                  ? "border border-blue-500/40 bg-blue-500/25"
                  : "border border-white/10 bg-black/55"
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                  detected ? "animate-pulse bg-blue-400" : "bg-white/25"
                }`}
              />
              <span className="text-xs font-medium text-white/80">
                {detected
                  ? `얼굴 감지됨 · 신뢰도 ${confidence}%`
                  : "얼굴을 카메라 앞에 위치시켜 주세요"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 랜드마크 범례 */}
      {phase === "scanning" && showLandmarks && (
        <div className="card-dark px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/60">얼굴 특징점 (Facial Landmarks)</span>
            <span className={`text-xs font-bold transition-colors ${detected ? "text-blue-400" : "text-white/30"}`}>
              {detected ? `${ptCount}pt` : "—"}
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
            {LEGEND.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] text-white/50">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
