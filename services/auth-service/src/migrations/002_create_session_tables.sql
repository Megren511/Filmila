-- Create user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token UUID NOT NULL,
    device_type VARCHAR(50),
    device_name VARCHAR(255),
    ip_address VARCHAR(45),
    last_active TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    CONSTRAINT unique_refresh_token UNIQUE (refresh_token)
);

-- Create session events table for auditing
CREATE TABLE IF NOT EXISTS session_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES user_sessions(session_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_session_events_session ON session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_session_events_type ON session_events(event_type);

-- Add function to log session events
CREATE OR REPLACE FUNCTION log_session_event()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO session_events (session_id, event_type, ip_address)
        VALUES (NEW.session_id, 'created', NEW.ip_address);
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO session_events (session_id, event_type, ip_address)
        VALUES (OLD.session_id, 'terminated', OLD.ip_address);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for session event logging
CREATE TRIGGER log_session_creation
    AFTER INSERT ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION log_session_event();

CREATE TRIGGER log_session_termination
    AFTER DELETE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION log_session_event();

-- Create function to clean expired sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean expired sessions (runs every hour)
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('0 * * * *', 'SELECT clean_expired_sessions();');
