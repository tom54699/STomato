import { useEffect, useMemo, useState } from 'react';
import { User } from '../App';
import { BarChart3, Activity, CalendarRange, Sparkles } from 'lucide-react';

type FocusLog = {
  id: string;
  date: string;
  minutes: number;
  timestamp: number;
  planId?: string;
  planTitle?: string;
  location?: string;
};

type StudyPlan = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  reminderTime: string;
  completed: boolean;
};

type InsightsProps = {
  user: User;
  onViewHistory?: () => void;
};

const weekdayShort = ['一', '二', '三', '四', '五', '六', '日'];

const monthlyGoalMinutes = 1800;
const monthlyGoalSessions = 60;

export function Insights({ user, onViewHistory }: InsightsProps) {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [logs, setLogs] = useState<FocusLog[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);

  useEffect(() => {
    const savedLogs = localStorage.getItem('focusLogs');
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs) as FocusLog[]);
      } catch (error) {
        console.warn('Failed to parse focusLogs', error);
      }
    }
    const savedPlans = localStorage.getItem('studyPlans');
    if (savedPlans) {
      try {
        setPlans(JSON.parse(savedPlans) as StudyPlan[]);
      } catch (error) {
        console.warn('Failed to parse studyPlans', error);
      }
    }
  }, []);

  const weekStats = useMemo(() => {
    const today = new Date();
    const result = Array.from({ length: 7 }).map((_, idx) => {
      const day = new Date();
      day.setDate(today.getDate() - (6 - idx));
      const dateStr = day.toISOString().split('T')[0];
      const dailyLogs = logs.filter((log) => log.date === dateStr);
      return {
        label: weekdayShort[idx],
        minutes: dailyLogs.reduce((sum, log) => sum + log.minutes, 0),
        sessions: dailyLogs.length,
        dateStr,
      };
    });
    const totalMinutes = result.reduce((sum, record) => sum + record.minutes, 0);
    const totalSessions = result.reduce((sum, record) => sum + record.sessions, 0);
    const bestDay = result.reduce((best, current) => (current.minutes > best.minutes ? current : best), result[0]);
    return { weekly: result, totalMinutes, totalSessions, bestDay };
  }, [logs]);

  const progressPercent = Math.min(100, Math.round((weekStats.totalMinutes / monthlyGoalMinutes) * 100));
  const sessionPercent = Math.min(100, Math.round((weekStats.totalSessions / monthlyGoalSessions) * 100));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 space-y-5">
      <header className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-10 h-10 text-indigo-500" />
          <div>
            <p className="text-gray-500 text-sm">學習洞察</p>
            <h1 className="text-gray-800 text-xl">專注趨勢報告</h1>
          </div>
        </div>
        <p className="text-gray-500 mt-2 text-sm">根據最近 7 天紀錄，提供建議與成就</p>
      </header>

      <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          <h2 className="text-gray-800">累積概況</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-indigo-50 rounded-2xl p-4">
            <p className="text-indigo-500 text-sm">本週專注分鐘</p>
            <p className="text-3xl text-indigo-700">{weekStats.totalMinutes}</p>
          </div>
          <div className="bg-purple-50 rounded-2xl p-4">
            <p className="text-purple-500 text-sm">完成番茄鐘</p>
            <p className="text-3xl text-purple-700">{weekStats.totalSessions}</p>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-600">
          {weekStats.bestDay ? (
            <>本週最佳表現日：週{weekStats.bestDay.label}，共 {weekStats.bestDay.minutes} 分鐘。</>
          ) : (
            <>本週尚未紀錄任何番茄鐘。</>
          )}
          <span className="block text-gray-400 text-xs">與讀書計畫搭配使用可提高穩定度</span>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-lg p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-orange-500" />
            <h2 className="text-gray-800">進度追蹤</h2>
          </div>
          <div className="bg-gray-100 rounded-full p-1.5 flex gap-1">
            <button
              className={`w-16 py-2 rounded-full text-sm font-medium transition-all ${view === 'week' ? 'bg-white shadow-md text-orange-500' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setView('week')}
            >
              週
            </button>
            <button
              className={`w-16 py-2 rounded-full text-sm font-medium transition-all ${view === 'month' ? 'bg-white shadow-md text-orange-500' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setView('month')}
            >
              月
            </button>
          </div>
        </div>
        {view === 'week' ? (
          <div className="grid grid-cols-7 gap-4 py-2">
            {weekStats.weekly.map((record, index) => {
              const barHeight = record.minutes > 0 ? Math.max(15, (record.minutes / 180) * 100) : 3;
              return (
                <div key={record.dateStr} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#f97316', marginBottom: '6px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {record.minutes > 0 ? record.minutes : ''}
                  </div>
                  <div
                    style={{
                      width: '32px',
                      height: '80px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: `${barHeight}%`,
                        background: 'linear-gradient(to top, #fb923c, #f97316)',
                        borderRadius: '0 0 4px 4px'
                      }}
                    ></div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px', fontWeight: '500', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>週{record.label}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>分鐘目標</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>番茄鐘目標</span>
                <span>{sessionPercent}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-blue-500" style={{ width: `${sessionPercent}%` }}></div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-gray-800">下一步建議</h2>
        </div>
        <ul className="space-y-3 text-gray-600 text-sm">
          <li>．固定在最佳表現日（週{weekStats.bestDay.label}）的時間帶進行進階任務</li>
          <li>．維持每週穩定的讀書計畫，幫助建立學習習慣</li>
          <li>．設定新的每月目標（例如 70 次番茄鐘），洞察頁會持續紀錄進度</li>
        </ul>
      </section>

      <section className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-green-500" />
          <h2 className="text-gray-800">成就徽章</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className={`rounded-2xl p-4 ${weekStats.totalSessions >= 5 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
            <div className="text-3xl mb-2">{weekStats.totalSessions >= 5 ? '✨' : '🔒'}</div>
            <p className="text-xs">本週連續專注</p>
          </div>
          <div className={`rounded-2xl p-4 ${weekStats.totalMinutes >= 300 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
            <div className="text-3xl mb-2">{weekStats.totalMinutes >= 300 ? '🔥' : '🔒'}</div>
            <p className="text-xs">累積 300 分鐘</p>
          </div>
        </div>
      </section>
    </div>
  );
}
