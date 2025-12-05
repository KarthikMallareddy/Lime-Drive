-- Create shares table for file sharing functionality
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  share_type TEXT NOT NULL DEFAULT 'public' CHECK (share_type IN ('public', 'password', 'private')),
  password_hash TEXT, -- For password-protected shares (Phase 2)
  permissions TEXT NOT NULL DEFAULT 'download' CHECK (permissions IN ('view', 'download', 'edit')),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL means no expiration
  download_limit INTEGER, -- NULL means unlimited
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure either file_id or folder_id is set, but not both
  CONSTRAINT shares_file_or_folder_check CHECK (
    (file_id IS NOT NULL AND folder_id IS NULL) OR 
    (file_id IS NULL AND folder_id IS NOT NULL)
  )
);

-- Enable RLS on shares table
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- RLS policies for shares table
CREATE POLICY "Users can view their own shares" ON shares
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own shares" ON shares
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own shares" ON shares
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own shares" ON shares
  FOR DELETE USING (auth.uid() = owner_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS shares_owner_id_idx ON shares(owner_id);
CREATE INDEX IF NOT EXISTS shares_share_token_idx ON shares(share_token);
CREATE INDEX IF NOT EXISTS shares_file_id_idx ON shares(file_id);
CREATE INDEX IF NOT EXISTS shares_folder_id_idx ON shares(folder_id);
CREATE INDEX IF NOT EXISTS shares_active_idx ON shares(is_active);
CREATE INDEX IF NOT EXISTS shares_expires_at_idx ON shares(expires_at);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for shares table
CREATE TRIGGER update_shares_updated_at BEFORE UPDATE ON shares
    FOR EACH ROW EXECUTE FUNCTION update_shares_updated_at();

-- Create a view for share analytics
CREATE OR REPLACE VIEW share_analytics AS
SELECT 
  s.id,
  s.share_token,
  s.owner_id,
  s.file_id,
  s.folder_id,
  COALESCE(f.filename, fold.name) AS item_name,
  CASE WHEN s.file_id IS NOT NULL THEN 'file' ELSE 'folder' END AS item_type,
  s.share_type,
  s.permissions,
  s.view_count,
  s.download_count,
  s.expires_at,
  s.is_active,
  s.created_at
FROM shares s
LEFT JOIN files f ON s.file_id = f.id
LEFT JOIN folders fold ON s.folder_id = fold.id
WHERE s.is_active = true;

-- Grant access to the view
GRANT SELECT ON share_analytics TO authenticated;