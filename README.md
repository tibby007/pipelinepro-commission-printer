# PipelinePro Commission Printer

A complete commercial lending pipeline automation system for managing ARF lending deals and generating commissions.

## Features

- **Prospect Discovery**: Add and manage potential clients
- **Pipeline Management**: Track prospects through the lending process
- **AI Conversations**: Monitor AI-driven prospect conversations and qualification
- **Voice Applications**: Track voice application submissions and document collection
- **ARF Submissions**: Manage submissions to ARF and track commission earnings
- **Commission Analytics**: Comprehensive analytics and performance tracking

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Integration**: Webhook endpoints for n8n automation

## Database Schema

### Prospects
- Business information and contact details
- Industry classification and estimated revenue
- Status tracking through the pipeline

### Conversations
- AI conversation tracking and qualification scoring
- Multi-channel communication (email, phone, LinkedIn, etc.)
- Message history and qualification status

### Applications
- Voice application data and document tracking
- Loan amounts and commission calculations
- ARF submission status and dates

### Activity Log
- Complete audit trail of all system activity
- Automated logging with metadata
- Performance tracking and analytics

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

3. Set up the database:
```bash
# Apply migrations
supabase db push

# Add sample data (optional)
supabase db seed
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## API Endpoints

### Webhook Endpoints (for n8n integration)

- `POST /api/webhooks/start-outreach` - Trigger automated outreach campaigns
- `POST /api/webhooks/conversation-update` - Update conversation progress and qualification
- `POST /api/webhooks/application-completed` - Process completed voice applications
- `POST /api/webhooks/arf-submission` - Handle ARF submissions and status updates
- `PUT /api/webhooks/arf-submission` - Update ARF status (funded, approved, declined)

## Usage

### Dashboard
The main dashboard provides:
- Real-time statistics (prospects, conversations, applications, submissions)
- Workflow action buttons for common tasks
- Activity feed with commission tracking
- Quick access to all major functions

### Commission Tracking
The system automatically calculates commissions based on:
- Loan amount × Commission rate (default 2%)
- Tracks pending vs. funded commissions
- Provides detailed analytics and reporting
- Activity logging for audit trails

## Deployment

Deploy to Vercel:
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically with git push

---

**PipelinePro Commission Printer** - Automated Commercial Lending Pipeline Management
