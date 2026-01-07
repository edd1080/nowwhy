-- Digest Preferences Migration
-- Adds email digest configuration for daily/weekly summaries

-- Digest preferences table
CREATE TABLE digest_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
    send_time TEXT NOT NULL DEFAULT '09:00', -- HH:MM format in user's timezone
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    email TEXT, -- Override email (defaults to user's auth email if null)
    last_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

-- Indexes
CREATE INDEX idx_digest_preferences_user_id ON digest_preferences(user_id);
CREATE INDEX idx_digest_preferences_project_id ON digest_preferences(project_id);
CREATE INDEX idx_digest_preferences_enabled ON digest_preferences(enabled) WHERE enabled = TRUE;

-- Enable Row Level Security
ALTER TABLE digest_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own digest preferences"
    ON digest_preferences FOR ALL
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_digest_preferences_updated_at
    BEFORE UPDATE ON digest_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE digest_preferences IS 'User preferences for email digest summaries (daily/weekly)';
