-- ==============================================================================
-- 0001_init.sql — Lược đồ cơ sở dữ liệu Supabase, RLS và hàm RPC đồng bộ
-- Đặc tả: project-design-spec.md §3.2 & SPEC-08 §2.2
-- ==============================================================================

-- 1. Bảng hồ sơ cá nhân và thiết lập học tập (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  streak_count INT DEFAULT 0,
  last_study_date DATE,
  daily_goal_minutes INT DEFAULT 20,
  settings JSONB DEFAULT '{
    "furigana": true,
    "furiganaSize": "normal",
    "hideTranslations": false,
    "theme": "system",
    "soundVolume": 1.0,
    "dailyNewLimit": 20
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng lịch sử các lượt luyện tập (Practice Sessions)
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  selected_lessons INT[] NOT NULL,
  exercise_types TEXT[] NOT NULL,
  total_questions INT NOT NULL CHECK (total_questions > 0),
  correct_count INT NOT NULL CHECK (correct_count >= 0),
  accuracy_rate NUMERIC(5,2) GENERATED ALWAYS AS (ROUND((correct_count::numeric / total_questions) * 100, 2)) STORED,
  duration_seconds INT NOT NULL CHECK (duration_seconds >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT correct_not_exceed_total CHECK (correct_count <= total_questions)
);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_time 
  ON public.practice_sessions (user_id, created_at DESC);

-- 3. Bảng mục tiêu ôn tập (Review Items - FSRS)
CREATE TABLE IF NOT EXISTS public.review_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('vocab','grammar','kanji','particle','listening')),
  lesson INT NOT NULL,
  incorrect_count INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  last_failed_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fsrs_card JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_review_items_due 
  ON public.review_items (user_id, due_at);

CREATE INDEX IF NOT EXISTS idx_review_items_weak 
  ON public.review_items (user_id, target_type, incorrect_count DESC);

-- 4. Kích hoạt Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read/write their own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only read/write their own practice sessions" ON public.practice_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only read/write their own review items" ON public.review_items
  FOR ALL USING (auth.uid() = user_id);

-- 5. Trigger tự động tạo profile khi người dùng đăng ký qua Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. RPC Function: sync_practice(payload jsonb)
-- Đảm bảo idempotent, atomic transaction và giải quyết xung đột Last-Write-Wins (SPEC-08 §2.2)
CREATE OR REPLACE FUNCTION public.sync_practice(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  kind TEXT := payload->>'kind';
  item_record jsonb;
  session_record jsonb;
  applied_count INT := 0;
  skipped_count INT := 0;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Xử lý lệnh xóa (Wipe)
  IF kind = 'wipe' THEN
    IF payload->>'scope' = 'account' THEN
      DELETE FROM public.review_items WHERE user_id = current_user_id;
      DELETE FROM public.practice_sessions WHERE user_id = current_user_id;
      RETURN jsonb_build_object('status', 'ok', 'action', 'wiped_account');
    END IF;
    RETURN jsonb_build_object('status', 'ok', 'action', 'wiped_local_ignored');
  END IF;

  -- Xử lý import chế độ Thay thế (Replace)
  IF kind = 'import' AND (payload->>'replaced')::boolean = true THEN
    DELETE FROM public.review_items WHERE user_id = current_user_id;
    DELETE FROM public.practice_sessions WHERE user_id = current_user_id;
  END IF;

  -- Ghi các phiên luyện tập (Practice Sessions) - Idempotent
  IF payload ? 'session' THEN
    session_record := payload->'session';
    INSERT INTO public.practice_sessions (
      id, user_id, selected_lessons, exercise_types,
      total_questions, correct_count, duration_seconds, created_at
    ) VALUES (
      (session_record->>'id')::UUID,
      current_user_id,
      ARRAY(SELECT jsonb_array_elements_text(session_record->'selectedLessons')::INT),
      ARRAY(SELECT jsonb_array_elements_text(session_record->'exerciseTypes')),
      (session_record->>'totalQuestions')::INT,
      (session_record->>'correctCount')::INT,
      (session_record->>'durationSeconds')::INT,
      (session_record->>'createdAt')::TIMESTAMPTZ
    ) ON CONFLICT (id) DO NOTHING;
  END IF;

  IF payload ? 'sessions' THEN
    FOR session_record IN SELECT * FROM jsonb_array_elements(payload->'sessions') LOOP
      INSERT INTO public.practice_sessions (
        id, user_id, selected_lessons, exercise_types,
        total_questions, correct_count, duration_seconds, created_at
      ) VALUES (
        (session_record->>'id')::UUID,
        current_user_id,
        ARRAY(SELECT jsonb_array_elements_text(session_record->'selectedLessons')::INT),
        ARRAY(SELECT jsonb_array_elements_text(session_record->'exerciseTypes')),
        (session_record->>'totalQuestions')::INT,
        (session_record->>'correctCount')::INT,
        (session_record->>'durationSeconds')::INT,
        (session_record->>'createdAt')::TIMESTAMPTZ
      ) ON CONFLICT (id) DO NOTHING;
    END LOOP;
  END IF;

  -- Ghi các mục ôn tập (Review Items) - Last-Write-Wins theo updated_at
  IF payload ? 'reviewItems' THEN
    FOR item_record IN SELECT * FROM jsonb_array_elements(payload->'reviewItems') LOOP
      INSERT INTO public.review_items (
        user_id, target_id, target_type, lesson,
        incorrect_count, correct_count, last_failed_at,
        due_at, fsrs_card, updated_at
      ) VALUES (
        current_user_id,
        item_record->>'targetId',
        item_record->>'targetType',
        (item_record->>'lesson')::INT,
        COALESCE((item_record->>'incorrectCount')::INT, 0),
        COALESCE((item_record->>'correctCount')::INT, 0),
        (item_record->>'lastFailedAt')::TIMESTAMPTZ,
        (item_record->>'dueAt')::TIMESTAMPTZ,
        item_record->'fsrsCard',
        (item_record->>'updatedAt')::TIMESTAMPTZ
      )
      ON CONFLICT (user_id, target_id) DO UPDATE
      SET
        target_type = EXCLUDED.target_type,
        lesson = EXCLUDED.lesson,
        incorrect_count = EXCLUDED.incorrect_count,
        correct_count = EXCLUDED.correct_count,
        last_failed_at = EXCLUDED.last_failed_at,
        due_at = EXCLUDED.due_at,
        fsrs_card = EXCLUDED.fsrs_card,
        updated_at = EXCLUDED.updated_at
      WHERE review_items.updated_at < EXCLUDED.updated_at;

      IF FOUND THEN
        applied_count := applied_count + 1;
      ELSE
        skipped_count := skipped_count + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'status', 'ok',
    'applied', applied_count,
    'skipped', skipped_count
  );
END;
$$;
