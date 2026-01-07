-- NowWhy Database Schema
-- Initial migration for v1.0 MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table (customer sites being tracked)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    public_key TEXT NOT NULL UNIQUE DEFAULT ('pk_' || substr(md5(random()::text), 1, 24)),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for looking up projects by public key (used in event ingestion)
CREATE INDEX idx_projects_public_key ON projects(public_key);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_domain ON projects(domain);

-- Visitors table (anonymized visitor records)
CREATE TABLE visitors (
    id TEXT NOT NULL, -- hashed visitor ID from tracker
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    country TEXT,
    city TEXT,
    device TEXT NOT NULL CHECK (device IN ('mobile', 'desktop', 'tablet')),
    PRIMARY KEY (id, project_id)
);

-- Index for visitor lookups
CREATE INDEX idx_visitors_project_id ON visitors(project_id);
CREATE INDEX idx_visitors_last_seen ON visitors(last_seen);

-- Sessions table (individual browsing sessions)
CREATE TABLE sessions (
    id TEXT NOT NULL, -- session ID from tracker
    visitor_id TEXT NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    referrer TEXT,
    referrer_category TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (
        referrer_category IN ('DIRECT', 'SEARCH', 'SOCIAL', 'PAID', 'REFERRAL', 'UNKNOWN')
    ),
    is_returning BOOLEAN NOT NULL DEFAULT FALSE,
    page_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'ended')),
    PRIMARY KEY (id, project_id),
    FOREIGN KEY (visitor_id, project_id) REFERENCES visitors(id, project_id) ON DELETE CASCADE
);

-- Indexes for session queries
CREATE INDEX idx_sessions_project_id ON sessions(project_id);
CREATE INDEX idx_sessions_visitor_id ON sessions(visitor_id, project_id);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity_at);
CREATE INDEX idx_sessions_status ON sessions(project_id, status);
CREATE INDEX idx_sessions_started_at ON sessions(started_at);

-- Events table (pageviews and engagement pings)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('pageview', 'engagement')),
    path TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    time_on_page INTEGER, -- milliseconds
    title TEXT,
    viewport_width INTEGER,
    viewport_height INTEGER
);

-- Indexes for event queries
CREATE INDEX idx_events_session_id ON events(session_id, project_id);
CREATE INDEX idx_events_project_id ON events(project_id);
CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_events_path ON events(project_id, path);

-- Insights table (derived intent/friction labels)
CREATE TABLE insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    intent_label TEXT NOT NULL CHECK (
        intent_label IN (
            'DISCOVERY_CONTENT', 'EVALUATING_PRODUCT', 'EVALUATING_PRICING',
            'SIGNUP_ATTEMPT', 'HIGH_INTENT', 'BOUNCE_RISK', 'UNCLEAR'
        )
    ),
    intent_confidence DECIMAL(3,2) NOT NULL CHECK (intent_confidence >= 0 AND intent_confidence <= 1),
    intent_reason TEXT NOT NULL,
    friction_flag BOOLEAN NOT NULL DEFAULT FALSE,
    friction_type TEXT NOT NULL DEFAULT 'NONE' CHECK (
        friction_type IN ('PRICING_LOOP', 'NAV_LOOP', 'FORM_STALL', 'CTA_DROP', 'NONE')
    ),
    friction_reason TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ai_used BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes for insight queries
CREATE INDEX idx_insights_session_id ON insights(session_id, project_id);
CREATE INDEX idx_insights_project_id ON insights(project_id);
CREATE INDEX idx_insights_intent ON insights(project_id, intent_label);
CREATE INDEX idx_insights_friction ON insights(project_id, friction_flag) WHERE friction_flag = TRUE;
CREATE INDEX idx_insights_generated_at ON insights(generated_at);

-- Alert configurations table
CREATE TABLE alert_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (
        alert_type IN ('HIGH_INTENT', 'FRICTION_DETECTED', 'TRAFFIC_SPIKE', 'RETURNING_VIP')
    ),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    delivery_mode TEXT NOT NULL DEFAULT 'instant' CHECK (delivery_mode IN ('instant', 'batched')),
    threshold INTEGER, -- for traffic spike, etc.
    slack_webhook_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, alert_type)
);

CREATE INDEX idx_alert_configs_project_id ON alert_configs(project_id);

-- User visits table (for "since you last checked" feature)
CREATE TABLE user_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

CREATE INDEX idx_user_visits_user_project ON user_visits(user_id, project_id);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_visits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for visitors (through project ownership)
CREATE POLICY "Users can view visitors for their projects"
    ON visitors FOR SELECT
    USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- RLS Policies for sessions (through project ownership)
CREATE POLICY "Users can view sessions for their projects"
    ON sessions FOR SELECT
    USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- RLS Policies for events (through project ownership)
CREATE POLICY "Users can view events for their projects"
    ON events FOR SELECT
    USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- RLS Policies for insights (through project ownership)
CREATE POLICY "Users can view insights for their projects"
    ON insights FOR SELECT
    USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- RLS Policies for alert_configs
CREATE POLICY "Users can manage alert configs for their projects"
    ON alert_configs FOR ALL
    USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- RLS Policies for user_visits
CREATE POLICY "Users can manage their own visit records"
    ON user_visits FOR ALL
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_configs_updated_at
    BEFORE UPDATE ON alert_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old data (60-day retention)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete events older than 60 days
    DELETE FROM events WHERE timestamp < NOW() - INTERVAL '60 days';

    -- Delete insights for sessions that no longer have events
    DELETE FROM insights WHERE session_id NOT IN (
        SELECT DISTINCT session_id FROM events
    );

    -- Delete sessions that have no recent activity (ended and old)
    DELETE FROM sessions
    WHERE status = 'ended'
    AND last_activity_at < NOW() - INTERVAL '60 days';

    -- Delete visitors with no sessions
    DELETE FROM visitors WHERE (id, project_id) NOT IN (
        SELECT DISTINCT visitor_id, project_id FROM sessions
    );
END;
$$ language 'plpgsql';

-- Comment on tables for documentation
COMMENT ON TABLE projects IS 'Customer sites being tracked by NowWhy';
COMMENT ON TABLE visitors IS 'Anonymized visitor records (hashed IDs, no PII)';
COMMENT ON TABLE sessions IS 'Individual browsing sessions with status tracking';
COMMENT ON TABLE events IS 'Pageviews and engagement pings from tracker';
COMMENT ON TABLE insights IS 'AI/rules-derived intent and friction labels';
COMMENT ON TABLE alert_configs IS 'Per-project alert configuration';
COMMENT ON TABLE user_visits IS 'Tracks when users last checked dashboard (for "since you last checked")';
