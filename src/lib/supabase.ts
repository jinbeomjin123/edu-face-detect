import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn(
    "[Supabase] 환경변수가 설정되지 않았습니다.\n" +
    ".env.local.example 을 참고해 .env.local 을 작성하세요."
  );
}

export const supabase = createClient(
  url ?? "https://placeholder.supabase.co",
  key ?? "placeholder"
);
