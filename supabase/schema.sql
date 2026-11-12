-- =====================================================================
-- 報修登記系統：Supabase 建表 SQL
-- 資料表：public.repair_requests
--
-- 安全設計分三層：
--   1. GRANT：決定 anon 角色能對哪些欄位做哪些動作。
--   2. RLS（資料列安全）：決定 anon 能讀、能新增哪些資料列。
--   3. CHECK：限制欄位值與文字長度，不管誰寫入都會檢查。
--
-- 本次示範規則：任何人可以新增、可以讀取清單，但不能修改或刪除。
-- 前端只能使用 Supabase 的公開金鑰（anon），不可放入 service_role 金鑰。
-- =====================================================================


-- ---------------------------------------------------------------------
-- 建立資料表與 CHECK 限制（第 3 層）
-- ---------------------------------------------------------------------
create table if not exists public.repair_requests (
  -- 主鍵：由資料庫自動產生 uuid，使用者不能指定。
  id uuid primary key default gen_random_uuid(),

  -- 建立時間：由資料庫自動產生，使用者不能指定。
  created_at timestamptz not null default now(),

  -- 報修人姓名：去掉前後空白後至少 1 個字、最多 50 個字。
  reporter_name text not null
    constraint repair_requests_reporter_name_length
    check (char_length(btrim(reporter_name)) between 1 and 50),

  -- 地點或部門：去掉前後空白後至少 1 個字、最多 100 個字。
  location text not null
    constraint repair_requests_location_length
    check (char_length(btrim(location)) between 1 and 100),

  -- 類別：只能是需求筆記定義的四種。
  category text not null
    constraint repair_requests_category_allowed
    check (category in ('設備', '網路', '環境', '其他')),

  -- 問題說明：去掉前後空白後至少 1 個字、最多 1000 個字。
  description text not null
    constraint repair_requests_description_length
    check (char_length(btrim(description)) between 1 and 1000),

  -- 緊急程度：只能是 低、中、高，沒填時預設為「中」。
  urgency text not null default '中'
    constraint repair_requests_urgency_allowed
    check (urgency in ('低', '中', '高')),

  -- 處理狀態：只能是 待處理、處理中、已完成，沒填時預設為「待處理」。
  status text not null default '待處理'
    constraint repair_requests_status_allowed
    check (status in ('待處理', '處理中', '已完成'))
);

-- 欄位中文名稱，與 文件/報修欄位表.xlsx 的欄位名對應。
comment on table  public.repair_requests               is '報修登記';
comment on column public.repair_requests.id            is '編號';
comment on column public.repair_requests.created_at    is '登記時間';
comment on column public.repair_requests.reporter_name is '報修人姓名';
comment on column public.repair_requests.location      is '地點或部門';
comment on column public.repair_requests.category      is '類別';
comment on column public.repair_requests.description   is '問題說明';
comment on column public.repair_requests.urgency       is '緊急程度';
comment on column public.repair_requests.status        is '處理狀態';

-- 清單依登記時間由新到舊排序，加索引讓讀取比較快。
create index if not exists repair_requests_created_at_idx
  on public.repair_requests (created_at desc);


-- ---------------------------------------------------------------------
-- 第 1 層：GRANT（資料表與欄位權限）
-- ---------------------------------------------------------------------

-- 先收回所有角色的權限，確保只留下下面明確給予的部分。
revoke all on table public.repair_requests from public, anon, authenticated;

-- anon 需要能使用 public 結構描述，才能存取裡面的資料表。
grant usage on schema public to anon;

-- 讀取：anon 可以讀取全部欄位，用來顯示共用清單。
grant select on table public.repair_requests to anon;

-- 新增：anon 只能填寫使用者需要輸入的欄位。
-- id、created_at、status 不開放，一律使用資料庫預設值，
-- 避免使用者自訂編號、假造登記時間，或直接填入「已完成」。
grant insert (reporter_name, location, category, description, urgency)
  on table public.repair_requests to anon;

-- 不給 anon 任何 update、delete、truncate 權限（上面的 revoke 已全部收回）。


-- ---------------------------------------------------------------------
-- 第 2 層：RLS（資料列安全）
-- ---------------------------------------------------------------------

-- 啟用資料列安全：沒有對應政策的動作一律拒絕。
alter table public.repair_requests enable row level security;

-- 重新執行本檔時先刪除舊政策，避免名稱重複而失敗。
drop policy if exists "任何人可以讀取報修清單" on public.repair_requests;
drop policy if exists "任何人可以新增待處理的報修" on public.repair_requests;

-- 讀取政策：任何人都可以讀取所有報修資料。
create policy "任何人可以讀取報修清單"
  on public.repair_requests
  for select
  to anon
  using (true);

-- 新增政策：任何人都可以新增，但新資料的狀態必須是「待處理」。
-- 第 1 層已經不讓 anon 填 status，這裡再檢查一次，作為雙重保護。
create policy "任何人可以新增待處理的報修"
  on public.repair_requests
  for insert
  to anon
  with check (status = '待處理');

-- 不建立 update、delete 政策，因此即使權限被誤開，RLS 仍會拒絕修改和刪除。
