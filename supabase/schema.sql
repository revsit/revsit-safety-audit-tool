-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
-- Links to Supabase Auth
CREATE TYPE user_role AS ENUM ('safety_engineer', 'safety_manager', 'dept_manager');

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role user_role DEFAULT 'safety_engineer',
  dept_id UUID, -- Can link to a departments table if needed later
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FIR REPORTS TABLE
CREATE TYPE report_category AS ENUM ('near_miss', 'injury', 'illness');
CREATE TYPE report_status AS ENUM ('draft', 'submitted', 'pending_review', 'forwarded', 'resolved');

CREATE TABLE fir_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ref_no SERIAL, -- Auto-incrementing reference number
  category report_category NOT NULL,
  status report_status DEFAULT 'draft',
  created_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id), -- Could be Safety Manager or Dept Manager depending on stage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FIR DETAILS TABLE (Dynamic Form Data)
CREATE TABLE fir_details (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id UUID REFERENCES fir_reports(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  answer_value JSONB, -- Flexible storage for different answer types
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ATTACHMENTS TABLE
CREATE TABLE attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id UUID REFERENCES fir_reports(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RISK ASSESSMENTS TABLE
CREATE TABLE risk_assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id UUID REFERENCES fir_reports(id) ON DELETE CASCADE,
  severity INT CHECK (severity BETWEEN 1 AND 5),
  likelihood INT CHECK (likelihood BETWEEN 1 AND 5),
  risk_score INT GENERATED ALWAYS AS (severity * likelihood) STORED,
  mitigation_plan TEXT,
  assessed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) policies would go here
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fir_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE fir_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Examples - Need refinement based on exact requirements)
-- Profiles are viewable by everyone logged in (for name lookup)
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');

-- Safety Engineers can see their own reports
CREATE POLICY "Engineers see own reports" ON fir_reports FOR SELECT USING (auth.uid() = created_by);
-- Safety Managers can see all reports (simplification)
-- CREATE POLICY "Managers see all" ON fir_reports FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'safety_manager'));
