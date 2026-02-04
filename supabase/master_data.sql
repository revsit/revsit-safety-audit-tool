-- 1. Master Sites
CREATE TABLE IF NOT EXISTS master_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    region TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Master Departments
CREATE TABLE IF NOT EXISTS master_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    site_id UUID REFERENCES master_sites(id) ON DELETE CASCADE,
    head_employee_code TEXT, -- FK added after employees table creation
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Master Areas
CREATE TABLE IF NOT EXISTS master_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    department_id UUID REFERENCES master_departments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Master Equipments
CREATE TABLE IF NOT EXISTS master_equipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id TEXT NOT NULL UNIQUE, -- Business ID e.g. EQ-101
    name TEXT NOT NULL,
    area_id UUID REFERENCES master_areas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Master Employees
CREATE TABLE IF NOT EXISTS master_employees (
    employee_code TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    contact_no TEXT,
    department_id UUID REFERENCES master_departments(id),
    designation TEXT,
    reporting_manager_code TEXT REFERENCES master_employees(employee_code),
    site_id UUID REFERENCES master_sites(id),
    create_login BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Circular FK for Department Head
ALTER TABLE master_departments 
ADD CONSTRAINT fk_dept_head 
FOREIGN KEY (head_employee_code) 
REFERENCES master_employees(employee_code);

-- 6. Link Profiles to Employees
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS employee_code TEXT REFERENCES master_employees(employee_code);

-- 7. Link Reports to Master Data
ALTER TABLE fir_reports 
ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES master_sites(id),
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES master_departments(id),
ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES master_areas(id),
ADD COLUMN IF NOT EXISTS equipment_id UUID REFERENCES master_equipments(id);

-- 8. RLS Policies
-- Enable RLS
ALTER TABLE master_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_employees ENABLE ROW LEVEL SECURITY;

-- Read Access (Authenticated Users can read all master data)
CREATE POLICY "Authenticated users can read sites" ON master_sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read departments" ON master_departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read areas" ON master_areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read equipments" ON master_equipments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read employees" ON master_employees FOR SELECT TO authenticated USING (true);

-- Write Access (Service Role Only for now, or Admin in future)
-- Implicitly allowed for service_role, no specific policy needed for broad write yet unless we have an Admin UI.
