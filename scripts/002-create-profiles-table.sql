CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'technician' CHECK (role IN ('technician', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
