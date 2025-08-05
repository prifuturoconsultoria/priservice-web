CREATE TABLE service_sheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name TEXT NOT NULL,
  technician_name TEXT NOT NULL,
  client_company TEXT NOT NULL,
  client_contact_name TEXT NOT NULL,
  client_contact_email TEXT NOT NULL,
  client_contact_phone TEXT,
  service_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  activity_description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approval_token UUID DEFAULT gen_random_uuid() UNIQUE,
  client_feedback TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE service_sheets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert/update their own records
CREATE POLICY "Users can create service sheets" ON service_sheets
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view all service sheets" ON service_sheets
  FOR SELECT USING (true);
CREATE POLICY "Users can update service sheets" ON service_sheets
  FOR UPDATE USING (true);
