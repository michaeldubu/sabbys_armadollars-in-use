-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS task_completions CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS redemptions CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
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

-- Create redemptions table for the Cash Out system
CREATE TABLE redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reward_name TEXT NOT NULL,
  cost INTEGER NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create complaints table for employee feedback (employees submit, admins receive)
CREATE TABLE complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'workplace', 'scheduling', 'equipment', 'training', 'safety', 'suggestion')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial users with passwords
INSERT INTO employees (name, email, password, role, armadollars, streak, phone, emergency_contact, emergency_phone) 
VALUES 
  ('admin', 'admin@armadollars.app', 'admin123', 'admin', 100000, 500, '555-123-4567', 'Michael Wofford', '555-987-6543'),
  ('Sabrina Wofford', 'sabrina@armadollars.app', 'admin123', 'admin', 100000, 500, '555-123-4567', 'Michael Wofford', '555-987-6543'),
  ('Vicktoria Jergenson', 'vicktoria@armadollars.app', 'manager123', 'manager', 75, 3, '555-234-5678', 'Emergency Contact', '555-876-5432'),
  ('Test User', 'test@armadollars.app', 'test123', 'server', 150, 7, '555-345-6789', 'Test Contact', '555-765-4321'),
  ('Alice Williams', 'alice@armadollars.app', 'alice123', 'server', 200, 10, '555-456-7890', 'Alice Emergency', '555-654-3210'),
  ('John Smith', 'john@armadollars.app', 'server123', 'server', 85, 2, '555-111-2222', 'Jane Smith', '555-333-4444'),
  ('Maria Garcia', 'maria@armadollars.app', 'server123', 'server', 120, 5, '555-555-6666', 'Carlos Garcia', '555-777-8888');

-- Insert some initial tasks with H.E.A.R.T. Service Model
INSERT INTO tasks (name, description, category, armadollars) VALUES
-- H - Howdy Tasks
('Greet guest within 15 seconds', 'Welcome guests with energy, friendliness, and fun within 15-45 seconds', 'howdy', 10),
('Enthusiastic greeting', 'Give an energetic and memorable first impression', 'howdy', 5),
('Fun interaction with guest', 'Make guests smile during initial greeting', 'howdy', 8),

-- E - Engage Tasks  
('Take drink order within 2 minutes', 'Serve drinks and take orders within 2-3 minutes with knowledge and passion', 'engage', 15),
('Showcase menu knowledge', 'Demonstrate expertise about menu items and specials', 'engage', 12),
('Passionate food recommendation', 'Show genuine care in helping guests choose their meal', 'engage', 10),

-- A - Arrive Tasks
('Deliver appetizers in 6-8 minutes', 'Ensure appetizers arrive hot and fresh within timing standards', 'arrive', 20),
('Deliver salads in 5 minutes', 'Get fresh salads to the table quickly', 'arrive', 15),
('Deliver entrées in 12-15 minutes', 'Ensure main courses arrive perfectly timed and presented', 'arrive', 25),
('Attentive table presence', 'Show pride and attentiveness during food delivery', 'arrive', 8),

-- R - Respond Tasks
('Fulfill guest request promptly', 'Handle guest needs with kindness, courtesy, and respect', 'respond', 12),
('Maintain clean table area', 'Keep tables organized and presentable throughout service', 'respond', 8),
('Refill drinks without being asked', 'Anticipate guest needs proactively', 'respond', 10),
('Handle complaint with grace', 'Turn a negative experience into a positive one', 'respond', 30),

-- T - Thank You Tasks
('Memorable farewell', 'End the dining experience with genuine gratitude', 'thankyou', 10),
('Invite guests to return', 'Make guests feel welcome to come back', 'thankyou', 8),
('Walk guests to door', 'Go above and beyond in showing appreciation', 'thankyou', 15),

-- Texas Roadhouse Signature Tasks
('Hand-cut steak perfection', 'Ensure steak is cooked exactly to guest preference', 'signature', 25),
('Fresh bread delivery', 'Serve warm, fresh-baked bread with cinnamon butter', 'signature', 5),
('Legendary margarita service', 'Craft and serve our famous margaritas', 'signature', 15),
('Fall-off-the-bone ribs', 'Ensure ribs meet our legendary standards', 'signature', 20),
('Ice-cold beer service', 'Serve beer at perfect temperature', 'signature', 8),
('Made-from-scratch sides', 'Prepare and serve our signature side dishes', 'signature', 12),

-- Additional high-value tasks
('Perfect table setup', 'Ensure table is perfectly set with all necessary items', 'service', 5),
('Upsell appetizers successfully', 'Successfully recommend and sell appetizers', 'sales', 20),
('Clean restroom check', 'Complete thorough restroom cleaning and restocking', 'cleaning', 15),
('Help train new employee', 'Assist in training a new team member', 'teamwork', 50),
('Resolve guest complaint', 'Successfully handle and resolve a guest complaint', 'service', 40),
('Prep work excellence', 'Complete all assigned prep work to standard', 'prep', 10)

ON CONFLICT (name) DO NOTHING;

-- Verify the data was inserted
SELECT 'Employees created:' as info, count(*) as count FROM employees;
SELECT 'Tasks created:' as info, count(*) as count FROM tasks;
SELECT 'Login credentials:' as info, name || ' / ' || password as credentials FROM employees ORDER BY role DESC;
