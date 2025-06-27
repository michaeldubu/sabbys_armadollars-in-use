-- Add approval status to redemptions table
ALTER TABLE redemptions 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create rewards table for admin-managed rewards
CREATE TABLE IF NOT EXISTS rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL,
    emoji VARCHAR(10),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES employees(id)
);

-- Insert default rewards
INSERT INTO rewards (name, description, cost, emoji, active) VALUES
('Free Meal', 'Enjoy a free staff meal on the house!', 50, '🍔', true),
('Pick Section', 'Choose your own section for your next shift', 100, '📍', true),
('No Back Work', 'Skip side work for one shift', 150, '🧹❌', true),
('Off Early Card', 'Get out early pass, no questions asked', 200, '🚪🏃‍♂️', true)
ON CONFLICT DO NOTHING;

-- Update existing redemptions to have pending status
UPDATE redemptions SET status = 'approved' WHERE status IS NULL;
