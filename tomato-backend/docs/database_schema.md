# 資料庫 Schema 設計

## ER 圖關係

```
┌─────────────┐       ┌──────────────┐
│   schools   │───┐   │    users     │
└─────────────┘   │   └──────────────┘
                  └───────────┼
                              │
                 ┌────────────┼────────────┐
                 │            │            │
          ┌──────▼─────┐ ┌───▼──────┐ ┌──▼─────────┐
          │  courses   │ │  plans   │ │   todos    │
          └────────────┘ └──────────┘ └────────────┘
                 │            │
                 └──────┬─────┘
                        │
                 ┌──────▼──────────┐
                 │ focus_sessions  │
                 └─────────────────┘

          ┌──────────────┐
          │ friendships  │
          └──────────────┘
               │     │
               └──┬──┘
                  │
            ┌─────▼─────┐
            │   users   │
            └───────────┘
```

## 詳細表結構

### 1. users (用戶表)

用戶基本資料和積分統計

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    total_points INTEGER DEFAULT 0,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_users_total_points ON users(total_points DESC);
```

**欄位說明**:
- `id`: 用戶唯一標識符 (UUID)
- `email`: 登入用 email，唯一
- `password_hash`: bcrypt 加密後的密碼
- `name`: 用戶顯示名稱
- `school_id`: 所屬學校 ID (外鍵)
- `total_points`: 累積總積分
- `avatar_url`: 頭像 URL
- `created_at`: 創建時間
- `updated_at`: 最後更新時間

---

### 2. schools (學校表)

學校資訊和排行榜統計

```sql
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) UNIQUE NOT NULL,
    total_points INTEGER DEFAULT 0,
    student_count INTEGER DEFAULT 0,
    logo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schools_name ON schools(name);
CREATE INDEX idx_schools_total_points ON schools(total_points DESC);
```

**欄位說明**:
- `id`: 學校唯一標識符
- `name`: 學校名稱，唯一
- `total_points`: 學校總積分（所有學生積分總和）
- `student_count`: 學生數量
- `logo_url`: 學校 logo URL
- `created_at`: 創建時間
- `updated_at`: 最後更新時間

**積分計算邏輯**:
- 學生完成番茄鐘 → 用戶獲得積分 → 學校總積分同步更新
- 使用觸發器或應用層邏輯維護一致性

---

### 3. courses (課程表)

用戶的週課表

```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    day INTEGER NOT NULL CHECK (day >= 0 AND day <= 6), -- 0=週日, 6=週六
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(200),
    color VARCHAR(50) DEFAULT 'bg-blue-400',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_courses_day ON courses(day);
```

**欄位說明**:
- `id`: 課程唯一標識符
- `user_id`: 所屬用戶 (外鍵)
- `name`: 課程名稱
- `day`: 星期幾 (0-6, 0為週日)
- `start_time`: 上課時間
- `end_time`: 下課時間
- `location`: 上課地點
- `color`: Tailwind CSS 顏色類名
- `created_at`: 創建時間
- `updated_at`: 最後更新時間

**約束**:
- `end_time` 必須大於 `start_time`
- 同一用戶、同一天的課程不應重疊（應用層檢查）

---

### 4. study_plans (學習計畫表)

用戶的學習計畫

```sql
CREATE TABLE study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reminder_time TIME,
    location VARCHAR(200),
    target_minutes INTEGER DEFAULT 0,
    completed_minutes INTEGER DEFAULT 0,
    pomodoro_count INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plans_user_id ON study_plans(user_id);
CREATE INDEX idx_plans_date ON study_plans(date);
CREATE INDEX idx_plans_course_id ON study_plans(course_id);
CREATE INDEX idx_plans_completed ON study_plans(completed);
```

**欄位說明**:
- `id`: 計畫唯一標識符
- `user_id`: 所屬用戶 (外鍵)
- `course_id`: 關聯課程 ID (可為空)
- `title`: 計畫標題
- `date`: 計畫日期
- `start_time`: 開始時間
- `end_time`: 結束時間
- `reminder_time`: 提醒時間
- `location`: 學習地點
- `target_minutes`: 目標時長（分鐘）
- `completed_minutes`: 已完成時長（分鐘）
- `pomodoro_count`: 完成的番茄鐘數量
- `completed`: 是否完成
- `created_at`: 創建時間
- `updated_at`: 最後更新時間

**業務邏輯**:
- `completed_minutes >= target_minutes` 時自動標記為完成
- 可手動標記完成
- 刪除課程時，關聯計畫的 `course_id` 設為 NULL

---

### 5. focus_sessions (專注紀錄表)

番茄鐘完成紀錄

```sql
CREATE TABLE focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES study_plans(id) ON DELETE SET NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    minutes INTEGER NOT NULL,
    points_earned INTEGER DEFAULT 0,
    location VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX idx_sessions_date ON focus_sessions(date);
CREATE INDEX idx_sessions_plan_id ON focus_sessions(plan_id);
CREATE INDEX idx_sessions_created_at ON focus_sessions(created_at DESC);
```

**欄位說明**:
- `id`: 紀錄唯一標識符
- `user_id`: 所屬用戶 (外鍵)
- `plan_id`: 關聯學習計畫 ID (可為空)
- `course_id`: 關聯課程 ID (可為空)
- `date`: 完成日期
- `minutes`: 專注時長（分鐘）
- `points_earned`: 獲得積分
- `location`: 學習地點
- `created_at`: 創建時間

**積分計算規則**:
```
基礎積分 = 分鐘數 * 10
獎勵積分 = 連續天數獎勵 + 單次時長獎勵
總積分 = 基礎積分 + 獎勵積分
```

**觸發操作**:
1. 新增 session → 更新 `users.total_points`
2. 新增 session → 更新 `schools.total_points`
3. 新增 session → 更新 `study_plans.completed_minutes` 和 `pomodoro_count`

---

### 6. todos (待辦事項表)

作業、考試、備忘錄

```sql
CREATE TYPE todo_type AS ENUM ('homework', 'exam', 'memo');

CREATE TABLE todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    todo_type todo_type NOT NULL DEFAULT 'memo',
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_date ON todos(date);
CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_type ON todos(todo_type);
```

**欄位說明**:
- `id`: 待辦唯一標識符
- `user_id`: 所屬用戶 (外鍵)
- `course_id`: 關聯課程 ID (可為空)
- `title`: 待辦標題
- `date`: 截止日期
- `todo_type`: 類型 (homework/exam/memo)
- `completed`: 是否完成
- `created_at`: 創建時間
- `updated_at`: 最後更新時間

---

### 7. friendships (好友關係表)

用戶間的好友關係

```sql
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status friendship_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);
```

**欄位說明**:
- `id`: 關係唯一標識符
- `user_id`: 發起好友請求的用戶
- `friend_id`: 被邀請的用戶
- `status`: 狀態 (pending/accepted/rejected)
- `created_at`: 創建時間
- `updated_at`: 最後更新時間

**約束**:
- `user_id` 和 `friend_id` 的組合唯一
- `user_id` 不能等於 `friend_id`（不能加自己為好友）

**業務邏輯**:
- 用戶 A 向 B 發送請求：創建 `(A, B, pending)` 記錄
- B 接受：更新狀態為 `accepted`，並創建反向記錄 `(B, A, accepted)`
- 查詢好友列表：`WHERE user_id = ? AND status = 'accepted'`

---

## 觸發器和函數

### 1. 自動更新 updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 應用到所有表
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... 其他表
```

### 2. 自動更新學校積分和學生數

```sql
-- 新增用戶時更新學校學生數
CREATE OR REPLACE FUNCTION update_school_student_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.school_id IS NOT NULL THEN
        UPDATE schools SET student_count = student_count + 1
        WHERE id = NEW.school_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.school_id IS NOT NULL AND NEW.school_id IS DISTINCT FROM OLD.school_id THEN
            UPDATE schools SET student_count = student_count - 1
            WHERE id = OLD.school_id;
        END IF;
        IF NEW.school_id IS NOT NULL AND NEW.school_id IS DISTINCT FROM OLD.school_id THEN
            UPDATE schools SET student_count = student_count + 1
            WHERE id = NEW.school_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.school_id IS NOT NULL THEN
        UPDATE schools SET student_count = student_count - 1
        WHERE id = OLD.school_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintain_school_student_count
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION update_school_student_count();

-- 用戶積分變化時同步更新學校積分
CREATE OR REPLACE FUNCTION sync_school_points()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.total_points != OLD.total_points AND NEW.school_id IS NOT NULL THEN
        UPDATE schools
        SET total_points = total_points + (NEW.total_points - OLD.total_points)
        WHERE id = NEW.school_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_school_points_on_user_update
    AFTER UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION sync_school_points();
```

### 3. 專注紀錄自動更新積分和計畫進度

```sql
CREATE OR REPLACE FUNCTION update_after_focus_session()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新用戶總積分
    UPDATE users
    SET total_points = total_points + NEW.points_earned
    WHERE id = NEW.user_id;

    -- 如果關聯了計畫，更新計畫進度
    IF NEW.plan_id IS NOT NULL THEN
        UPDATE study_plans
        SET
            completed_minutes = completed_minutes + NEW.minutes,
            pomodoro_count = pomodoro_count + 1,
            completed = CASE
                WHEN (completed_minutes + NEW.minutes) >= target_minutes THEN TRUE
                ELSE completed
            END
        WHERE id = NEW.plan_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_focus_session_insert
    AFTER INSERT ON focus_sessions
    FOR EACH ROW EXECUTE FUNCTION update_after_focus_session();
```

---

## 查詢範例

### 1. 獲取用戶的週課表

```sql
SELECT * FROM courses
WHERE user_id = $1
ORDER BY day, start_time;
```

### 2. 獲取今日學習計畫

```sql
SELECT
    sp.*,
    c.name AS course_name
FROM study_plans sp
LEFT JOIN courses c ON sp.course_id = c.id
WHERE sp.user_id = $1 AND sp.date = CURRENT_DATE
ORDER BY sp.start_time;
```

### 3. 獲取本月專注統計

```sql
SELECT
    COUNT(*) AS total_sessions,
    SUM(minutes) AS total_minutes,
    SUM(points_earned) AS total_points,
    COUNT(DISTINCT date) AS active_days
FROM focus_sessions
WHERE user_id = $1
    AND date >= DATE_TRUNC('month', CURRENT_DATE)
    AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
```

### 4. 學校排行榜（本週）

```sql
SELECT
    s.id,
    s.name,
    s.student_count,
    SUM(fs.points_earned) AS week_points
FROM schools s
JOIN users u ON u.school_id = s.id
JOIN focus_sessions fs ON fs.user_id = u.id
WHERE fs.date >= DATE_TRUNC('week', CURRENT_DATE)
GROUP BY s.id, s.name, s.student_count
ORDER BY week_points DESC
LIMIT 100;
```

### 5. 計算連續專注天數

```sql
WITH RECURSIVE date_series AS (
    SELECT CURRENT_DATE AS check_date
    UNION ALL
    SELECT check_date - INTERVAL '1 day'
    FROM date_series
    WHERE check_date > (
        SELECT MIN(date) FROM focus_sessions WHERE user_id = $1
    )
),
user_sessions AS (
    SELECT DISTINCT date FROM focus_sessions WHERE user_id = $1
)
SELECT COUNT(*) AS streak
FROM date_series ds
JOIN user_sessions us ON ds.check_date = us.date
WHERE ds.check_date <= CURRENT_DATE
ORDER BY ds.check_date DESC;
```

---

## 資料完整性和約束

### 外鍵約束
- `ON DELETE CASCADE`: 刪除用戶時，級聯刪除其所有課程、計畫、專注紀錄等
- `ON DELETE SET NULL`: 刪除課程時，相關計畫/紀錄保留但 `course_id` 設為 NULL

### 唯一性約束
- `users.email`: 唯一
- `schools.name`: 唯一
- `friendships(user_id, friend_id)`: 組合唯一

### 檢查約束
- `courses.day`: 0-6 範圍
- `friendships`: `user_id != friend_id`

### 索引策略
- 主鍵自動索引
- 外鍵欄位建立索引（提升 JOIN 效能）
- 常用查詢欄位（日期、狀態）建立索引
- 排序欄位（積分）建立降序索引

---

## 資料遷移策略

### 初始化 (001_init_schema.sql)
- 創建所有表
- 創建索引
- 創建觸發器

### 後續遷移
- 使用版本號命名 (002_xxx.sql, 003_xxx.sql)
- 保持向後兼容
- 提供回滾腳本

---

## 效能優化建議

1. **使用連接池**: 限制資料庫連接數
2. **查詢優化**: 使用 EXPLAIN ANALYZE 檢查查詢計畫
3. **分頁查詢**: 使用 LIMIT/OFFSET 或游標分頁
4. **適當的索引**: 根據查詢模式調整索引
5. **快取策略**: Redis 快取熱點資料（排行榜、統計）
6. **批次處理**: 批次插入專注紀錄
7. **定期 VACUUM**: 清理過期資料，維護效能

---

## 備份和恢復

### 定期備份
```bash
pg_dump -U postgres -d tomato_db > backup_$(date +%Y%m%d).sql
```

### 恢復
```bash
psql -U postgres -d tomato_db < backup_20250101.sql
```

### 自動備份策略
- 每日全量備份
- 每週歸檔備份
- 保留 30 天內備份
