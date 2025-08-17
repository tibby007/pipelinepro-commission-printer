'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  BoltIcon, 
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  DocumentCheckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Discovery', href: '/discovery', icon: MagnifyingGlassIcon },
  { name: 'Pipeline', href: '/pipeline', icon: BoltIcon },
  { name: 'AI Conversations', href: '/conversations', icon: ChatBubbleLeftRightIcon },
  { name: 'Voice Applications', href: '/applications', icon: MicrophoneIcon },
  { name: 'ARF Submissions', href: '/submissions', icon: DocumentCheckIcon },
  { name: 'Commission Analytics', href: '/analytics', icon: ChartBarIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex flex-col h-0 flex-1">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-blue-600">
          <h1 className="text-white font-bold text-lg">PipelinePro</h1>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    }
                  `}
                >
                  <item.icon
                    className={`
                      mr-3 flex-shrink-0 h-6 w-6
                      ${isActive 
                        ? 'text-blue-500 dark:text-blue-300' 
                        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                      }
                    `}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}