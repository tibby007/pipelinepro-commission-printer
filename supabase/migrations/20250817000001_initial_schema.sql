-- Initial schema for PipelinePro Commission Printer
-- Commercial lending pipeline automation system

-- Prospects table
CREATE TABLE prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  estimated_revenue INTEGER,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'application', 'submitted', 'funded', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'phone', 'linkedin', 'website', 'referral')),
  messages JSONB DEFAULT '[]'::jsonb,
  qualification_score INTEGER DEFAULT 0 CHECK (qualification_score >= 0 AND qualification_score <= 100),
  qualified BOOLEAN DEFAULT false,
  last_contact TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  application_data JSONB DEFAULT '{}'::jsonb,
  documents_uploaded BOOLEAN DEFAULT false,
  submitted_to_arf BOOLEAN DEFAULT false,
  commission_amount DECIMAL(10,2),
  loan_amount DECIMAL(15,2),
  commission_rate DECIMAL(5,4) DEFAULT 0.02, -- Default 2% commission
  arf_submission_date TIMESTAMP WITH TIME ZONE,
  funding_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'funded', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log table for tracking all system activity
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('prospect', 'conversation', 'application')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_prospects_status ON prospects(status);
CREATE INDEX idx_prospects_created_at ON prospects(created_at DESC);
CREATE INDEX idx_conversations_prospect_id ON conversations(prospect_id);
CREATE INDEX idx_conversations_qualified ON conversations(qualified);
CREATE INDEX idx_applications_prospect_id ON applications(prospect_id);
CREATE INDEX idx_applications_submitted_to_arf ON applications(submitted_to_arf);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prospects_updated_at 
  BEFORE UPDATE ON prospects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at 
  BEFORE UPDATE ON applications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically calculate commission amount
CREATE OR REPLACE FUNCTION calculate_commission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.loan_amount IS NOT NULL AND NEW.commission_rate IS NOT NULL THEN
    NEW.commission_amount = NEW.loan_amount * NEW.commission_rate;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_application_commission
  BEFORE INSERT OR UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION calculate_commission();

-- Function to log activity automatically
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_log (entity_type, entity_id, action, description)
    VALUES (TG_TABLE_NAME::TEXT, NEW.id, 'created', 'New ' || TG_TABLE_NAME || ' created');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO activity_log (entity_type, entity_id, action, description)
    VALUES (TG_TABLE_NAME::TEXT, NEW.id, 'updated', TG_TABLE_NAME || ' updated');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO activity_log (entity_type, entity_id, action, description)
    VALUES (TG_TABLE_NAME::TEXT, OLD.id, 'deleted', TG_TABLE_NAME || ' deleted');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create activity logging triggers
CREATE TRIGGER log_prospect_activity
  AFTER INSERT OR UPDATE OR DELETE ON prospects
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_conversation_activity
  AFTER INSERT OR UPDATE OR DELETE ON conversations
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_application_activity
  AFTER INSERT OR UPDATE OR DELETE ON applications
  FOR EACH ROW EXECUTE FUNCTION log_activity();