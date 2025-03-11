-- Create video events table for analytics
CREATE TABLE IF NOT EXISTS video_events (
    id SERIAL PRIMARY KEY,
    video_id UUID NOT NULL,
    user_id UUID NOT NULL,
    quality VARCHAR(10),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(20) NOT NULL,
    position INTEGER,
    duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Event types: play, pause, seek, progress, quality_change, end
    CONSTRAINT valid_event_type CHECK (
        event_type IN ('play', 'pause', 'seek', 'progress', 'quality_change', 'end')
    ),
    
    -- Quality values: 1080p, 720p, 480p, auto
    CONSTRAINT valid_quality CHECK (
        quality IN ('1080p', '720p', '480p', 'auto')
    )
);

-- Create indexes for better query performance
CREATE INDEX idx_video_events_video_id ON video_events(video_id);
CREATE INDEX idx_video_events_user_id ON video_events(user_id);
CREATE INDEX idx_video_events_timestamp ON video_events(timestamp);
CREATE INDEX idx_video_events_type ON video_events(event_type);

-- Create view for hourly analytics
CREATE MATERIALIZED VIEW hourly_video_analytics AS
SELECT 
    video_id,
    date_trunc('hour', timestamp) as hour,
    event_type,
    quality,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_viewers,
    AVG(position) as avg_position
FROM video_events
GROUP BY video_id, date_trunc('hour', timestamp), event_type, quality;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_hourly_analytics_composite 
ON hourly_video_analytics(video_id, hour, event_type, quality);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_hourly_analytics()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY hourly_video_analytics;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh materialized view every hour
CREATE TRIGGER refresh_hourly_analytics_trigger
AFTER INSERT OR UPDATE ON video_events
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_hourly_analytics();
