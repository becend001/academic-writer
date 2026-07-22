-- AI Academic Writer Database Schema
-- Run this in Supabase SQL Editor

-- 1. Usage logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature VARCHAR(50) NOT NULL,
  input_text TEXT,
  output_text TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Saved works table
CREATE TABLE IF NOT EXISTS saved_works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL,
  result TEXT,
  feature VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Grant projects table
CREATE TABLE IF NOT EXISTS grant_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL DEFAULT 'Untitled Project',
  field VARCHAR(100),
  keywords TEXT,
  project_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Grant proposals table
CREATE TABLE IF NOT EXISTS grant_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES grant_projects(id) ON DELETE CASCADE,
  section VARCHAR(100) NOT NULL,
  content TEXT,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Topic suggestions table
CREATE TABLE IF NOT EXISTS topic_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  field VARCHAR(100),
  keywords TEXT,
  suggestions JSONB,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_log_id UUID REFERENCES usage_logs(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_feature ON usage_logs(feature);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_saved_works_user_id ON saved_works(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_works_created_at ON saved_works(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_grant_projects_user_id ON grant_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_grant_projects_status ON grant_projects(status);
CREATE INDEX IF NOT EXISTS idx_grant_proposals_project_id ON grant_proposals(project_id);

CREATE INDEX IF NOT EXISTS idx_topic_suggestions_user_id ON topic_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

-- Enable Row Level Security
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY usage_logs_policy ON usage_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY saved_works_policy ON saved_works
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY grant_projects_policy ON grant_projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY grant_proposals_policy ON grant_proposals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM grant_projects 
      WHERE grant_projects.id = grant_proposals.project_id 
      AND grant_projects.user_id = auth.uid()
    )
  );

CREATE POLICY topic_suggestions_policy ON topic_suggestions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY feedback_policy ON feedback
  FOR ALL USING (auth.uid() = user_id);
