-- ============================================================
-- Life RPG — Initial Schema Migration
-- Run this in Supabase SQL Editor (or via supabase CLI)
-- ============================================================

-- ---------------------------------------------------------------
-- 1. USERS PROFILE (extends auth.users 1:1)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users_profile (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT        NOT NULL,
  level           INT         NOT NULL DEFAULT 1,
  xp              INT         NOT NULL DEFAULT 0,
  xp_to_next      INT         NOT NULL DEFAULT 100,
  rank            TEXT        NOT NULL DEFAULT 'E' CHECK (rank IN ('E','D','C','B','A','S')),
  gold            INT         NOT NULL DEFAULT 0,
  mana_crystals   INT         NOT NULL DEFAULT 0,
  streak          INT         NOT NULL DEFAULT 0,
  last_active     DATE,
  stat_str        INT         NOT NULL DEFAULT 0,
  stat_agi        INT         NOT NULL DEFAULT 0,
  stat_vit        INT         NOT NULL DEFAULT 0,
  stat_int        INT         NOT NULL DEFAULT 0,
  stat_per        INT         NOT NULL DEFAULT 0,
  equipped_frame  TEXT,
  equipped_theme  TEXT        NOT NULL DEFAULT 'default',
  title           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- 2. QUESTS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL CHECK (char_length(trim(title)) > 0),
  description  TEXT,
  discipline   TEXT        NOT NULL CHECK (discipline IN ('intellect','strength','agility','vitality','perception')),
  difficulty   TEXT        NOT NULL CHECK (difficulty IN ('E','D','C','B','A','S')),
  quest_type   TEXT        NOT NULL DEFAULT 'quest' CHECK (quest_type IN ('quest','daily','gate')),
  xp_reward    INT         NOT NULL,
  gold_reward  INT         NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  due_date     DATE,
  sort_order   INT         NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- 3. QUEST COMPLETIONS LOG (immutable append-only ledger)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quest_completions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id     UUID        NOT NULL REFERENCES public.quests(id),
  xp_gained    INT         NOT NULL,
  gold_gained  INT         NOT NULL,
  stat_gained  TEXT        NOT NULL,
  level_before INT         NOT NULL,
  level_after  INT         NOT NULL,
  rank_before  TEXT        NOT NULL,
  rank_after   TEXT        NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- 4. SHADOW ARMY
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shadow_soldiers (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  soldier_key  TEXT        NOT NULL,
  soldier_name TEXT        NOT NULL,
  unlocked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  skin         TEXT        NOT NULL DEFAULT 'default',
  UNIQUE (user_id, soldier_key)
);

-- ---------------------------------------------------------------
-- 5. SHOP PURCHASES
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_purchases (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_key      TEXT        NOT NULL,
  currency_type TEXT        NOT NULL CHECK (currency_type IN ('gold','mana_crystals')),
  cost          INT         NOT NULL,
  purchased_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_key)
);

-- ---------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ---------------------------------------------------------------
ALTER TABLE public.users_profile     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadow_soldiers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_purchases    ENABLE ROW LEVEL SECURITY;

-- users_profile
CREATE POLICY "Users can view own profile"
  ON public.users_profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.users_profile FOR UPDATE USING (auth.uid() = id);
-- INSERT handled by trigger (service role bypasses RLS)

-- quests
CREATE POLICY "Users can view own quests"
  ON public.quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quests"
  ON public.quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quests"
  ON public.quests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quests"
  ON public.quests FOR DELETE USING (auth.uid() = user_id);

-- quest_completions (read-only for users — writes via DB function)
CREATE POLICY "Users can view own completions"
  ON public.quest_completions FOR SELECT USING (auth.uid() = user_id);

-- shadow_soldiers
CREATE POLICY "Users can view own soldiers"
  ON public.shadow_soldiers FOR SELECT USING (auth.uid() = user_id);

-- shop_purchases
CREATE POLICY "Users can view own purchases"
  ON public.shop_purchases FOR SELECT USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 7. AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_profile (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------
-- 8. CORE GAME FUNCTION: complete_quest (atomic, server-side)
--    Called from API route with service role key — never from client
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_quest(
  p_quest_id  UUID,
  p_user_id   UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quest         quests%ROWTYPE;
  v_profile       users_profile%ROWTYPE;
  v_xp_reward     INT;
  v_gold_reward   INT;
  v_stat_col      TEXT;
  v_new_xp        INT;
  v_new_level     INT;
  v_new_xp_to_next INT;
  v_new_rank      TEXT;
  v_rank_before   TEXT;
  v_level_before  INT;
  v_leveled_up    BOOLEAN := FALSE;
  v_ranked_up     BOOLEAN := FALSE;
  v_new_soldiers  JSONB := '[]'::jsonb;
  v_completion_count INT;
BEGIN
  -- Lock and fetch quest, verify ownership
  SELECT * INTO v_quest FROM quests
  WHERE id = p_quest_id AND user_id = p_user_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest not found or already completed: %', p_quest_id;
  END IF;

  -- Fetch and lock profile
  SELECT * INTO v_profile FROM users_profile
  WHERE id = p_user_id
  FOR UPDATE;

  v_xp_reward   := v_quest.xp_reward;
  v_gold_reward := v_quest.gold_reward;
  v_level_before := v_profile.level;
  v_rank_before  := v_profile.rank;

  -- Map discipline to stat column
  v_stat_col := CASE v_quest.discipline
    WHEN 'intellect'   THEN 'stat_int'
    WHEN 'strength'    THEN 'stat_str'
    WHEN 'agility'     THEN 'stat_agi'
    WHEN 'vitality'    THEN 'stat_vit'
    WHEN 'perception'  THEN 'stat_per'
  END;

  -- Accumulate XP (may span multiple levels)
  v_new_xp    := v_profile.xp + v_xp_reward;
  v_new_level := v_profile.level;

  LOOP
    -- xp_to_next = ROUND(100 * level^1.8 / 10) * 10
    v_new_xp_to_next := GREATEST(100, (ROUND(100.0 * POWER(v_new_level, 1.8) / 10) * 10)::INT);
    EXIT WHEN v_new_xp < v_new_xp_to_next;
    v_new_xp    := v_new_xp - v_new_xp_to_next;
    v_new_level := v_new_level + 1;
    v_leveled_up := TRUE;
  END LOOP;

  -- xp_to_next for new level
  v_new_xp_to_next := GREATEST(100, (ROUND(100.0 * POWER(v_new_level, 1.8) / 10) * 10)::INT);

  -- Determine rank from level
  v_new_rank := CASE
    WHEN v_new_level >= 70 THEN 'S'
    WHEN v_new_level >= 50 THEN 'A'
    WHEN v_new_level >= 35 THEN 'B'
    WHEN v_new_level >= 20 THEN 'C'
    WHEN v_new_level >= 10 THEN 'D'
    ELSE 'E'
  END;

  v_ranked_up := (v_new_rank != v_rank_before);

  -- Mark quest complete
  UPDATE quests
  SET status = 'completed', completed_at = now()
  WHERE id = p_quest_id;

  -- Update profile (atomic)
  EXECUTE format(
    'UPDATE users_profile SET
       xp = $1, xp_to_next = $2, level = $3, rank = $4,
       gold = gold + $5, mana_crystals = mana_crystals + $6,
       %I = %I + 1,
       streak = CASE
         WHEN last_active = CURRENT_DATE THEN streak
         WHEN last_active = CURRENT_DATE - 1 THEN streak + 1
         ELSE 1
       END,
       last_active = CURRENT_DATE
     WHERE id = $7',
    v_stat_col, v_stat_col
  )
  USING v_new_xp, v_new_xp_to_next, v_new_level, v_new_rank,
        v_gold_reward,
        CASE WHEN v_quest.difficulty IN (''A'',''S'') THEN v_gold_reward / 2 ELSE 0 END,
        p_user_id;

  -- Log completion
  INSERT INTO quest_completions (
    user_id, quest_id, xp_gained, gold_gained,
    stat_gained, level_before, level_after, rank_before, rank_after
  ) VALUES (
    p_user_id, p_quest_id, v_xp_reward, v_gold_reward,
    v_quest.discipline, v_level_before, v_new_level, v_rank_before, v_new_rank
  );

  -- Check Shadow Army unlocks
  SELECT COUNT(*) INTO v_completion_count
  FROM quest_completions WHERE user_id = p_user_id;

  -- Unlock soldiers at specific completion milestones
  IF v_completion_count = 1 THEN
    INSERT INTO shadow_soldiers (user_id, soldier_key, soldier_name)
    VALUES (p_user_id, 'initiate', 'The Initiate')
    ON CONFLICT DO NOTHING;
    v_new_soldiers := '[{"key":"initiate","name":"The Initiate"}]'::jsonb;
  ELSIF v_completion_count % 5 = 0 AND v_completion_count <= 100 THEN
    DECLARE
      v_soldier_keys TEXT[] := ARRAY[
        'shadow_rogue','iron_sentinel','voidwalker','ember_knight',
        'storm_caller','silent_blade','bone_warden','ash_revenant',
        'plague_herald','obsidian_giant','frost_specter','crimson_warden',
        'eclipse_hunter','void_sovereign','nether_wraith','chaos_herald',
        'time_weaver','death_sovereign','abyss_titan','shadow_monarch'
      ];
      v_soldier_names TEXT[] := ARRAY[
        'Shadow Rogue','Iron Sentinel','Voidwalker','Ember Knight',
        'Storm Caller','Silent Blade','Bone Warden','Ash Revenant',
        'Plague Herald','Obsidian Giant','Frost Specter','Crimson Warden',
        'Eclipse Hunter','Void Sovereign','Nether Wraith','Chaos Herald',
        'Time Weaver','Death Sovereign','Abyss Titan','Shadow Monarch'
      ];
      v_idx INT := LEAST((v_completion_count / 5)::INT, 20);
      v_key TEXT := v_soldier_keys[v_idx];
      v_name TEXT := v_soldier_names[v_idx];
    BEGIN
      INSERT INTO shadow_soldiers (user_id, soldier_key, soldier_name)
      VALUES (p_user_id, v_key, v_name)
      ON CONFLICT DO NOTHING;
      v_new_soldiers := jsonb_build_array(jsonb_build_object('key', v_key, 'name', v_name));
    END;
  END IF;

  -- Return diff for client to drive animations
  RETURN jsonb_build_object(
    'xp_gained',       v_xp_reward,
    'gold_gained',     v_gold_reward,
    'stat_gained',     v_quest.discipline,
    'level_before',    v_level_before,
    'level_after',     v_new_level,
    'rank_before',     v_rank_before,
    'rank_after',      v_new_rank,
    'leveled_up',      v_leveled_up,
    'ranked_up',       v_ranked_up,
    'new_xp',          v_new_xp,
    'new_xp_to_next',  v_new_xp_to_next,
    'new_soldiers',    v_new_soldiers
  );
END;
$$;

-- ---------------------------------------------------------------
-- 9. SHOP PURCHASE FUNCTION (atomic currency deduction)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purchase_shop_item(
  p_user_id       UUID,
  p_item_key      TEXT,
  p_currency_type TEXT,  -- 'gold' or 'mana_crystals'
  p_cost          INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INT;
BEGIN
  -- Check existing purchase
  IF EXISTS (SELECT 1 FROM shop_purchases WHERE user_id = p_user_id AND item_key = p_item_key) THEN
    RAISE EXCEPTION 'Item already purchased: %', p_item_key;
  END IF;

  -- Check balance
  SELECT CASE p_currency_type WHEN 'gold' THEN gold ELSE mana_crystals END
  INTO v_balance FROM users_profile WHERE id = p_user_id FOR UPDATE;

  IF v_balance < p_cost THEN
    RAISE EXCEPTION 'Insufficient %: have %, need %', p_currency_type, v_balance, p_cost;
  END IF;

  -- Deduct
  IF p_currency_type = 'gold' THEN
    UPDATE users_profile SET gold = gold - p_cost WHERE id = p_user_id;
  ELSE
    UPDATE users_profile SET mana_crystals = mana_crystals - p_cost WHERE id = p_user_id;
  END IF;

  -- Record
  INSERT INTO shop_purchases (user_id, item_key, currency_type, cost)
  VALUES (p_user_id, p_item_key, p_currency_type, p_cost);

  RETURN jsonb_build_object('success', true, 'item_key', p_item_key);
END;
$$;

-- ---------------------------------------------------------------
-- 10. INDEXES
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_quests_user_status ON public.quests (user_id, status);
CREATE INDEX IF NOT EXISTS idx_quests_user_type   ON public.quests (user_id, quest_type);
CREATE INDEX IF NOT EXISTS idx_completions_user   ON public.quest_completions (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_soldiers_user      ON public.shadow_soldiers (user_id);
