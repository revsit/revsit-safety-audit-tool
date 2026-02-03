-- 1. Profiles: Everyone can see all profiles (to show names in dropdowns/tables)
DROP POLICY IF EXISTS "Public profiles" ON profiles;
CREATE POLICY "Profiles are viewable by authenticated users" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- 2. FIR Reports
-- Engineers can INSERT
CREATE POLICY "Engineers can create reports" 
ON fir_reports FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

-- Engineers can SELECT their own
DROP POLICY IF EXISTS "Engineers see own reports" ON fir_reports;
CREATE POLICY "Engineers see own reports" 
ON fir_reports FOR SELECT 
TO authenticated 
USING (auth.uid() = created_by);

-- Managers and Heads can SELECT all
CREATE POLICY "Managers and Heads see all reports" 
ON fir_reports FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('safety_manager', 'dept_manager')
  )
);

-- Managers and Heads can UPDATE status
CREATE POLICY "Managers and Heads can update reports" 
ON fir_reports FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('safety_manager', 'dept_manager')
  )
);

-- 3. FIR Details
-- Anyone can insert details if they own the report
CREATE POLICY "Authenticated users can insert details" 
ON fir_details FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM fir_reports 
    WHERE id = report_id AND created_by = auth.uid()
  )
);

-- Viewable if user can see the parent report
CREATE POLICY "View details if can see report" 
ON fir_details FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM fir_reports 
    WHERE id = report_id
  )
);

-- 4. Attachments
CREATE POLICY "Authenticated users can insert attachments" 
ON attachments FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM fir_reports 
    WHERE id = report_id AND created_by = auth.uid()
  )
);

CREATE POLICY "View attachments if can see report" 
ON attachments FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM fir_reports 
    WHERE id = report_id
  )
);

-- 5. Risk Assessments
CREATE POLICY "Managers can insert assessments" 
ON risk_assessments FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'safety_manager'
  )
);

CREATE POLICY "View assessments if can see report" 
ON risk_assessments FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM fir_reports 
    WHERE id = report_id
  )
);
