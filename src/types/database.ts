export interface Database {
  public: {
    Tables: {
      prospects: {
        Row: {
          id: string;
          business_name: string;
          industry: string;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          estimated_revenue: number | null;
          status: 'new' | 'contacted' | 'qualified' | 'application' | 'submitted' | 'funded' | 'declined';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_name: string;
          industry: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          estimated_revenue?: number | null;
          status?: 'new' | 'contacted' | 'qualified' | 'application' | 'submitted' | 'funded' | 'declined';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_name?: string;
          industry?: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          estimated_revenue?: number | null;
          status?: 'new' | 'contacted' | 'qualified' | 'application' | 'submitted' | 'funded' | 'declined';
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          prospect_id: string | null;
          channel: 'email' | 'phone' | 'linkedin' | 'website' | 'referral';
          messages: any;
          qualification_score: number | null;
          qualified: boolean | null;
          last_contact: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          prospect_id?: string | null;
          channel: 'email' | 'phone' | 'linkedin' | 'website' | 'referral';
          messages?: any;
          qualification_score?: number | null;
          qualified?: boolean | null;
          last_contact?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          prospect_id?: string | null;
          channel?: 'email' | 'phone' | 'linkedin' | 'website' | 'referral';
          messages?: any;
          qualification_score?: number | null;
          qualified?: boolean | null;
          last_contact?: string;
          created_at?: string;
        };
      };
      applications: {
        Row: {
          id: string;
          prospect_id: string | null;
          application_data: any;
          documents_uploaded: boolean | null;
          submitted_to_arf: boolean | null;
          commission_amount: number | null;
          loan_amount: number | null;
          commission_rate: number | null;
          arf_submission_date: string | null;
          funding_date: string | null;
          status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'funded' | 'declined';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          prospect_id?: string | null;
          application_data?: any;
          documents_uploaded?: boolean | null;
          submitted_to_arf?: boolean | null;
          commission_amount?: number | null;
          loan_amount?: number | null;
          commission_rate?: number | null;
          arf_submission_date?: string | null;
          funding_date?: string | null;
          status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'funded' | 'declined';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          prospect_id?: string | null;
          application_data?: any;
          documents_uploaded?: boolean | null;
          submitted_to_arf?: boolean | null;
          commission_amount?: number | null;
          loan_amount?: number | null;
          commission_rate?: number | null;
          arf_submission_date?: string | null;
          funding_date?: string | null;
          status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'funded' | 'declined';
          created_at?: string;
          updated_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          entity_type: 'prospect' | 'conversation' | 'application';
          entity_id: string;
          action: string;
          description: string | null;
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: 'prospect' | 'conversation' | 'application';
          entity_id: string;
          action: string;
          description?: string | null;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: 'prospect' | 'conversation' | 'application';
          entity_id?: string;
          action?: string;
          description?: string | null;
          metadata?: any;
          created_at?: string;
        };
      };
    };
  };
}

export type Prospect = Database['public']['Tables']['prospects']['Row'];
export type ProspectInsert = Database['public']['Tables']['prospects']['Insert'];
export type ProspectUpdate = Database['public']['Tables']['prospects']['Update'];

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update'];

export type Application = Database['public']['Tables']['applications']['Row'];
export type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];
export type ApplicationUpdate = Database['public']['Tables']['applications']['Update'];

export type ActivityLog = Database['public']['Tables']['activity_log']['Row'];
export type ActivityLogInsert = Database['public']['Tables']['activity_log']['Insert'];