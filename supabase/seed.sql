-- Sample data for PipelinePro Commission Printer

-- Insert sample prospects
INSERT INTO prospects (business_name, industry, contact_name, email, phone, estimated_revenue, status) VALUES
('TechStart Solutions', 'Technology', 'John Smith', 'john@techstart.com', '555-0101', 500000, 'new'),
('Metro Restaurant Group', 'Food Service', 'Sarah Johnson', 'sarah@metrorest.com', '555-0102', 750000, 'contacted'),
('BuildRight Construction', 'Construction', 'Mike Wilson', 'mike@buildright.com', '555-0103', 1200000, 'qualified'),
('QuickShip Logistics', 'Transportation', 'Lisa Brown', 'lisa@quickship.com', '555-0104', 800000, 'application'),
('GreenEnergy Corp', 'Renewable Energy', 'David Lee', 'david@greenenergy.com', '555-0105', 2000000, 'submitted'),
('RetailMax Stores', 'Retail', 'Amanda Davis', 'amanda@retailmax.com', '555-0106', 950000, 'new'),
('MedEquip Supply', 'Healthcare', 'Robert Taylor', 'robert@medequip.com', '555-0107', 600000, 'contacted'),
('AutoParts Plus', 'Automotive', 'Jennifer White', 'jennifer@autoparts.com', '555-0108', 450000, 'qualified');

-- Insert sample conversations
INSERT INTO conversations (prospect_id, channel, messages, qualification_score, qualified) 
SELECT 
  p.id,
  (ARRAY['email', 'phone', 'linkedin'])[floor(random() * 3) + 1],
  '[{"timestamp": "2024-08-15T10:00:00Z", "type": "outbound", "content": "Initial outreach message"}, {"timestamp": "2024-08-15T14:30:00Z", "type": "inbound", "content": "Response from prospect"}]'::jsonb,
  floor(random() * 100),
  random() > 0.5
FROM prospects p
WHERE p.status IN ('contacted', 'qualified', 'application');

-- Insert sample applications
INSERT INTO applications (prospect_id, application_data, documents_uploaded, submitted_to_arf, loan_amount, commission_rate, status)
SELECT 
  p.id,
  '{"business_info": {"years_in_business": 5, "annual_revenue": ' || p.estimated_revenue || '}, "loan_purpose": "Equipment financing", "requested_amount": ' || (p.estimated_revenue * 0.3)::int || '}'::jsonb,
  random() > 0.3,
  random() > 0.6,
  p.estimated_revenue * 0.3,
  0.02,
  CASE 
    WHEN p.status = 'application' THEN 'draft'
    WHEN p.status = 'submitted' THEN 'submitted'
    ELSE 'draft'
  END
FROM prospects p
WHERE p.status IN ('application', 'submitted');

-- Update ARF submission dates for submitted applications
UPDATE applications 
SET arf_submission_date = NOW() - INTERVAL '3 days'
WHERE submitted_to_arf = true;