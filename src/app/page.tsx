import DashboardStats from '@/components/DashboardStats';
import WorkflowActions from '@/components/WorkflowActions';
import ActivityFeed from '@/components/ActivityFeed';

export default function Home() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          PipelinePro Commission Printer
        </h1>
        <p className="text-lg text-gray-600">
          Automated Commercial Lending Pipeline - ARF Partnership
        </p>
      </div>

      {/* Dashboard Stats */}
      <div className="mb-8">
        <DashboardStats />
      </div>

      {/* Workflow Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Workflow Actions
        </h2>
        <WorkflowActions />
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
        
        {/* Quick Stats Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Commission Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Month</span>
                <span className="font-bold text-green-600">$12,450.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <span className="font-bold text-orange-600">$8,200.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total YTD</span>
                <span className="font-bold text-blue-600">$89,750.00</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <span className="text-sm font-medium text-blue-900">
                  Add New Prospect
                </span>
              </button>
              <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <span className="text-sm font-medium text-green-900">
                  Generate Report
                </span>
              </button>
              <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <span className="text-sm font-medium text-purple-900">
                  View Analytics
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
