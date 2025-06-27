-- Create password reset requests table for forgot password functionality
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    requested_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending',
    processed_at TIMESTAMP,
    processed_by UUID REFERENCES employees(id),
    admin_notes TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_employee_id ON password_reset_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_status ON password_reset_requests(status);
