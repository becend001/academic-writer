-- V1.1 Migration: User Data Accumulation Features
-- Run this in Supabase SQL Editor

-- 1. User Academic Profile Table
CREATE TABLE IF NOT EXISTS user_academic_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  research_fields TEXT[] DEFAULT '{}',
  publications_count INTEGER DEFAULT 0,
  grants_count INTEGER DEFAULT 0,
  writing_style JSONB DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Paper Timeline Table
CREATE TABLE IF NOT EXISTS paper_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_title TEXT NOT NULL,
  status TEXT CHECK (status IN ('选题', '写作', '修改', '投稿', '审稿', '修回', '录用', '拒稿', '发表')) DEFAULT '选题',
  milestones JSONB DEFAULT '[]',
  target_journal TEXT,
  submission_date DATE,
  decision_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Writing Activity Log Table
CREATE TABLE IF NOT EXISTS writing_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT CHECK (activity_type IN (
    'polish', 'translate', 'abstract', 'grant', 
    'literature', 'journal_search', 'cover_letter',
    'format_check', 'rebuttal', 'grant_score'
  )),
  paper_id UUID REFERENCES paper_timeline(id),
  content_snapshot TEXT,
  ai_result TEXT,
  token_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_academic_profile_user_id ON user_academic_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_timeline_user_id ON paper_timeline(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_timeline_status ON paper_timeline(status);
CREATE INDEX IF NOT EXISTS idx_writing_activity_log_user_id ON writing_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_activity_log_type ON writing_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_writing_activity_log_created_at ON writing_activity_log(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_academic_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY user_academic_profile_policy ON user_academic_profile
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY paper_timeline_policy ON paper_timeline
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY writing_activity_log_policy ON writing_activity_log
  FOR ALL USING (auth.uid() = user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_user_academic_profile_updated_at
  BEFORE UPDATE ON user_academic_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paper_timeline_updated_at
  BEFORE UPDATE ON paper_timeline
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
