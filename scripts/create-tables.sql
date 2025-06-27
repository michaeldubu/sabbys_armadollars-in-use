-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('server', 'manager', 'admin', 'key')),
  phone TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  armadollars INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  armadollars INTEGER NOT NULL CHECK (armadollars > 0),
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('lunch', 'dinner', 'double')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, date, shift_type)
);

-- Create task_completions table
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  armadollars_earned INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, task_id, DATE(completed_at))
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  armadollars_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial admin user
INSERT INTO employees (name, email, role, armadollars, streak, phone, emergency_contact, emergency_phone) 
VALUES (
  'Sabrina Wofford', 
  'admin@armadollars.app', 
  'admin', 
  100000, 
  500,
  '555-123-4567',
  'Michael Wofford',
  '555-987-6543'
) ON CONFLICT (name) DO NOTHING;

-- Insert some initial tasks
INSERT INTO tasks (name, description, category, armadollars) VALUES
('Greet customers warmly', 'Welcome every guest with a smile and friendly greeting', 'service', 5),
('Upsell appetizers', 'Suggest appetizers to increase sales and enhance guest experience', 'sales', 10),
('Clean tables thoroughly', 'Ensure all tables are spotless and properly set', 'cleaning', 3),
('Help team member', 'Assist a colleague with their tasks', 'teamwork', 8),
('Perfect order accuracy', 'Take and deliver orders with 100% accuracy', 'service', 15),
('Prep work completion', 'Complete assigned prep work tasks efficiently', 'prep', 7)
ON CONFLICT DO NOTHING;
