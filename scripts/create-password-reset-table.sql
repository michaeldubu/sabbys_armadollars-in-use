-- Create password reset requests table for forgot password functionality
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    admin_notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES employees(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_employee_id ON password_reset_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_status ON password_reset_requests(status);

-- Insert some sample data for testing
INSERT INTO password_reset_requests (employee_id, employee_name, status, admin_notes) 
SELECT id, name, 'pending', 'Test password reset request'
FROM employees 
WHERE name ILIKE '%test%' 
LIMIT 1
ON CONFLICT DO NOTHING;
