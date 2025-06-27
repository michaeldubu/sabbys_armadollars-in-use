-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS task_completions CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- Create employees table with password field
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password TEXT NOT NULL DEFAULT 'admin123',
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
CREATE TABLE tasks (
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
CREATE TABLE schedules (
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
CREATE TABLE task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  armadollars_earned INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, task_id, DATE(completed_at))
);

-- Create achievements table
CREATE TABLE achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  armadollars_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial users with passwords
INSERT INTO employees (name, email, password, role, armadollars, streak, phone, emergency_contact, emergency_phone) 
VALUES 
  ('admin', 'admin@armadollars.app', 'admin123', 'admin', 100000, 500, '555-123-4567', 'Michael Wofford', '555-987-6543'),
  ('Sabrina Wofford', 'sabrina@armadollars.app', 'admin123', 'admin', 100000, 500, '555-123-4567', 'Michael Wofford', '555-987-6543'),
  ('Vicktoria Jergenson', 'vicktoria@armadollars.app', 'manager123', 'manager', 75, 3, '555-234-5678', 'Emergency Contact', '555-876-5432'),
  ('Test User', 'test@armadollars.app', 'test123', 'server', 150, 7, '555-345-6789', 'Test Contact', '555-765-4321'),
  ('Alice Williams', 'alice@armadollars.app', 'alice123', 'server', 200, 10, '555-456-7890', 'Alice Emergency', '555-654-3210');

-- Insert some initial tasks
INSERT INTO tasks (name, description, category, armadollars) VALUES
('Greet customers warmly', 'Welcome every guest with a smile and friendly greeting', 'service', 5),
('Upsell appetizers', 'Suggest appetizers to increase sales and enhance guest experience', 'sales', 10),
('Clean tables thoroughly', 'Ensure all tables are spotless and properly set', 'cleaning', 3),
('Help team member', 'Assist a colleague with their tasks', 'teamwork', 8),
('Perfect order accuracy', 'Take and deliver orders with 100% accuracy', 'service', 15),
('Prep work completion', 'Complete assigned prep work tasks efficiently', 'prep', 7);

-- Verify the data was inserted
SELECT 'Employees created:' as info, count(*) as count FROM employees;
SELECT 'Tasks created:' as info, count(*) as count FROM tasks;
SELECT 'Login credentials:' as info, name || ' / ' || password as credentials FROM employees ORDER BY role DESC;
