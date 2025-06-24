-- 既存の ENUM 型があれば削除
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
    DROP TYPE userrole;
  END IF;
END
$$;

-- ENUM 型の定義
CREATE TYPE userrole AS ENUM ('user', 'admin');

-- テーブル削除（依存関係を考慮して順番）
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS poc_plans CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS business_plans CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS password_reset_tokens;

-- users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    username VARCHAR NOT NULL UNIQUE,
    hashed_password VARCHAR,
    full_name VARCHAR,
    department VARCHAR,
    division VARCHAR,
    role userrole DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- business_plans
CREATE TABLE business_plans (
    id SERIAL PRIMARY KEY,
    title VARCHAR,
    description TEXT,
    problem_statement TEXT,
    solution TEXT,
    target_market TEXT,
    business_model TEXT,
    competition TEXT,
    implementation_plan TEXT,
    creator_name TEXT,
    creator_id INTEGER REFERENCES users(id),
    is_selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- votes
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    business_plan_id INTEGER REFERENCES business_plans(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- poc_plans
CREATE TABLE poc_plans (
    id SERIAL PRIMARY KEY,
    title VARCHAR,
    description TEXT,
    technical_requirements TEXT,
    implementation_details TEXT,
    timeline TEXT,
    resources_needed TEXT,
    expected_outcomes TEXT,
    creator_name TEXT,
    creator_id INTEGER REFERENCES users(id),
    business_plan_id INTEGER REFERENCES business_plans(id),
    is_technical_only BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- team_members
CREATE TABLE team_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    poc_plan_id INTEGER REFERENCES poc_plans(id),
    role VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    notification_type VARCHAR,
    related_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

--password_reset_tokens
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- セッション管理テーブル（user_sessions）の定義
CREATE TABLE user_sessions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT NOT NULL UNIQUE,
    device_info TEXT,
    ip_address  TEXT,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
-- （必要に応じて）1ユーザー1セッションを強制するユニーク制約
CREATE UNIQUE INDEX uq_user_sessions_user ON user_sessions(user_id);

-- ログイン履歴管理テーブル（user_login_history）の定義
CREATE TABLE user_login_history (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    login_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- メール確認トークン管理テーブル（email_verification_tokens）の定義
CREATE TABLE email_verification_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);