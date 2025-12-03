-- Optional: Create download logs table for analytics
-- Run this SQL in your Supabase SQL Editor if you want download tracking

CREATE TABLE IF NOT EXISTS download_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on download_logs table
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for download_logs
CREATE POLICY "Users can view their own download logs" ON download_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS download_logs_file_id_idx ON download_logs(file_id);
CREATE INDEX IF NOT EXISTS download_logs_user_id_idx ON download_logs(user_id);
CREATE INDEX IF NOT EXISTS download_logs_downloaded_at_idx ON download_logs(downloaded_at);

-- Optional: Create a view for download analytics
CREATE OR REPLACE VIEW file_download_stats AS
SELECT 
  f.id AS file_id,
  f.filename,
  f.user_id,
  COUNT(dl.id) AS download_count,
  MAX(dl.downloaded_at) AS last_downloaded,
  MIN(dl.downloaded_at) AS first_downloaded
FROM files f
LEFT JOIN download_logs dl ON f.id = dl.file_id
GROUP BY f.id, f.filename, f.user_id;

-- Grant access to the view
GRANT SELECT ON file_download_stats TO authenticated;