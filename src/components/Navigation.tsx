import { Home, Notebook, BookOpen, Trophy, User, LineChart } from 'lucide-react';

type NavigationProps = {
  currentPage: 'home' | 'planner' | 'schedule' | 'insights' | 'leaderboard' | 'profile' | 'courses';
  onPageChange: (page: 'home' | 'planner' | 'schedule' | 'insights' | 'leaderboard' | 'profile' | 'courses') => void;
};

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const navItems = [
    { id: 'home' as const, icon: Home, label: '首頁' },
    { id: 'planner' as const, icon: Notebook, label: '讀書計畫' },
    { id: 'schedule' as const, icon: BookOpen, label: '課表' },
    { id: 'insights' as const, icon: LineChart, label: '洞察' },
    { id: 'leaderboard' as const, icon: Trophy, label: '排行' },
    { id: 'profile' as const, icon: User, label: '我的' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-around items-center h-20">
          {navItems.map(({ id, icon: Icon, label }) => {
            const isActive = currentPage === id;
            return (
              <button
                key={id}
                onClick={() => onPageChange(id)}
                className={`flex flex-col items-center justify-center flex-1 transition-all ${
                  isActive ? 'text-orange-500' : 'text-gray-400'
                }`}
              >
                <div
                  className={`p-2 rounded-2xl transition-all ${
                    isActive ? 'bg-orange-100' : ''
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''}`} />
                </div>
                <span className={`text-xs mt-1 ${isActive ? '' : ''}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
