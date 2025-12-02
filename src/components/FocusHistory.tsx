import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { User } from '../App';

type FocusLog = {
  id: string;
  date: string;
  minutes: number;
  timestamp: number;
  planId?: string;
  planTitle?: string;
  location?: string;
};

type FocusHistoryProps = {
  user: User;
  onBack: () => void;
};

export function FocusHistory({ user, onBack }: FocusHistoryProps) {
  const [logs, setLogs] = useState<FocusLog[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'longest'>('newest');

  useEffect(() => {
    const savedLogs = localStorage.getItem('focusLogs');
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs) as FocusLog[]);
      } catch (error) {
        console.warn('Failed to parse focusLogs', error);
      }
    }
  }, []);

  const sortedLogs = useMemo(() => {
    const result = [...logs];
    result.sort((a, b) => {
      if (sortBy === 'newest') return b.timestamp - a.timestamp;
      if (sortBy === 'oldest') return a.timestamp - b.timestamp;
      return b.minutes - a.minutes;
    });
    return result;
  }, [logs, sortBy]);

  const stats = useMemo(() => {
    return {
      total: logs.length,
      totalMinutes: logs.reduce((sum, log) => sum + log.minutes, 0),
      avgMinutes: logs.length ? Math.round(logs.reduce((sum, log) => sum + log.minutes, 0) / logs.length) : 0,
    };
  }, [logs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-indigo-600">
        <ArrowLeft className="w-5 h-5" /> 返回
      </button>

      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-8 h-8 text-indigo-500" />
          <div>
            <h1 className="text-gray-800 text-2xl">焦點時間歷史</h1>
            <p className="text-gray-600">{user.name} 的番茄鐘記錄</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-gray-500 text-sm">總會話數</p>
            <p className="text-2xl font-semibold text-indigo-600">{stats.total}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">總分鐘</p>
            <p className="text-2xl font-semibold text-indigo-600">{stats.totalMinutes}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">平均分鐘</p>
            <p className="text-2xl font-semibold text-indigo-600">{stats.avgMinutes}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-4 flex gap-3 mb-4">
        {(
          [
            { id: 'newest', label: '最新' },
            { id: 'oldest', label: '最舊' },
            { id: 'longest', label: '最久' },
          ] as const
        ).map((option) => (
          <button
            key={option.id}
            onClick={() => setSortBy(option.id)}
            className={`flex-1 py-2 rounded-2xl text-sm ${
              sortBy === option.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {sortedLogs.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg p-6 text-center text-gray-500">
          尚未記錄任何番茄鐘。
        </div>
      ) : (
        <div className="space-y-3">
          {sortedLogs.map((log) => (
            <div key={log.id} className="bg-white rounded-3xl shadow p-4">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>{new Date(log.timestamp).toLocaleString()}</span>
                <span>{log.minutes} 分鐘</span>
              </div>
              <p className="text-gray-800 font-medium">{log.planTitle ?? '自由番茄鐘'}</p>
              <p className="text-xs text-gray-400">{log.location ?? '未指定地點'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
