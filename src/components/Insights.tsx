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
  note?: string;
  completionPercent?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  difficultyBonus?: number;
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
};

const weekdayShort = ['一', '二', '三', '四', '五', '六', '日'];

const monthlyGoalMinutes = 1800;
const monthlyGoalSessions = 60;

export function Insights({ user }: InsightsProps) {
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

  const planStats = useMemo(() => {
    const today = new Date();
    const weekStart = new Date();
    weekStart.setDate(today.getDate() - 6);
    const filtered = plans.filter((plan) => {
      const date = new Date(plan.date);
      return date >= weekStart && date <= today;
    });
    const completed = filtered.filter((plan) => plan.completed).length;
    return {
      total: filtered.length,
      completed,
      percent: filtered.length ? Math.round((completed / filtered.length) * 100) : 0,
    };
  }, [plans]);

  const progressPercent = Math.min(100, Math.round((weekStats.totalMinutes / monthlyGoalMinutes) * 100));
  const sessionPercent = Math.min(100, Math.round((weekStats.totalSessions / monthlyGoalSessions) * 100));

  const completionStats = useMemo(() => {
    const logsWithCompletion = logs.filter((log) => log.completionPercent !== undefined);
    if (logsWithCompletion.length === 0) {
      return {
        avgCompletion: 0,
        perfectCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        total: 0,
      };
    }
    const avgCompletion = Math.round(
      logsWithCompletion.reduce((sum, log) => sum + (log.completionPercent || 0), 0) / logsWithCompletion.length
    );
    const perfectCount = logsWithCompletion.filter((log) => log.completionPercent === 100).length;
    const highCount = logsWithCompletion.filter((log) => (log.completionPercent || 0) >= 80 && (log.completionPercent || 0) < 100).length;
    const mediumCount = logsWithCompletion.filter((log) => (log.completionPercent || 0) >= 50 && (log.completionPercent || 0) < 80).length;
    const lowCount = logsWithCompletion.filter((log) => (log.completionPercent || 0) < 50).length;

    return {
      avgCompletion,
      perfectCount,
      highCount,
      mediumCount,
      lowCount,
      total: logsWithCompletion.length,
    };
  }, [logs]);

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
          <div className="bg-gray-100 rounded-full p-1">
            <button
              className={`px-3 py-1 rounded-full text-sm ${view === 'week' ? 'bg-white shadow text-orange-500' : 'text-gray-500'}`}
              onClick={() => setView('week')}
            >
              週
            </button>
            <button
              className={`px-3 py-1 rounded-full text-sm ${view === 'month' ? 'bg-white shadow text-orange-500' : 'text-gray-500'}`}
              onClick={() => setView('month')}
            >
              月
            </button>
          </div>
        </div>
        {view === 'week' ? (
          <div className="grid grid-cols-7 gap-3">
            {weekStats.weekly.map((record) => (
              <div key={record.dateStr} className="text-center">
                <div className="h-24 w-10 mx-auto bg-gray-100 rounded-full flex flex-col-reverse overflow-hidden">
                  <div
                    className="bg-gradient-to-t from-orange-400 to-pink-400"
                    style={{ height: `${Math.min(100, (record.minutes / 180) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">週{record.label}</p>
              </div>
            ))}
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
          <Activity className="w-5 h-5 text-teal-500" />
          <h2 className="text-gray-800">完成度分析</h2>
        </div>
        {completionStats.total > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-teal-50 rounded-2xl p-4">
                <p className="text-teal-600 text-sm">平均完成度</p>
                <p className="text-4xl font-bold text-teal-700">{completionStats.avgCompletion}%</p>
              </div>
              <div className="bg-blue-50 rounded-2xl p-4">
                <p className="text-blue-600 text-sm">統計番茄鐘</p>
                <p className="text-4xl font-bold text-blue-700">{completionStats.total}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  <span className="text-gray-600">完美完成 (100%)</span>
                </div>
                <span className="font-bold text-gray-800">{completionStats.perfectCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌟</span>
                  <span className="text-gray-600">高完成度 (80-99%)</span>
                </div>
                <span className="font-bold text-gray-800">{completionStats.highCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💪</span>
                  <span className="text-gray-600">中等完成度 (50-79%)</span>
                </div>
                <span className="font-bold text-gray-800">{completionStats.mediumCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📈</span>
                  <span className="text-gray-600">需要改進 (&lt;50%)</span>
                </div>
                <span className="font-bold text-gray-800">{completionStats.lowCount}</span>
              </div>
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-sm text-teal-700">
              你已記錄 {completionStats.total} 次番茄鐘的完成度。持續紀錄能幫助你了解學習效率。
            </div>
          </>
        ) : (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center text-gray-500 text-sm">
            <p>還沒有完成度紀錄</p>
            <p className="text-xs text-gray-400 mt-1">完成番茄鐘並在結算頁面記錄完成度後就會顯示分析</p>
          </div>
        )}
      </section>

      <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <h2 className="text-gray-800">近期學習備註</h2>
        </div>
        {logs.filter((log) => log.note).length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {logs
              .filter((log) => log.note)
              .slice(0, 10)
              .map((log) => (
                <div key={log.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{log.planTitle || '自由番茄鐘'}</p>
                      <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                    <span className="bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                      {log.completionPercent || 100}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{log.note}</p>
                </div>
              ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center text-gray-500 text-sm">
            <p>還沒有學習備註</p>
            <p className="text-xs text-gray-400 mt-1">完成番茄鐘並在結算頁面添加備註，記錄你的學習心得</p>
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
          <li>．維持每週至少 {planStats.total || 3} 項讀書計畫，已完成 {planStats.percent}%</li>
          <li>．設定新的每月目標（例如 70 次番茄鐘），洞察頁會持續紀錄進度</li>
        </ul>
      </section>

      <section className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-green-500" />
          <h2 className="text-gray-800">成就徽章</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className={`rounded-2xl p-4 ${weekStats.totalSessions >= 5 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
            <div className="text-3xl mb-2">{weekStats.totalSessions >= 5 ? '✨' : '🔒'}</div>
            <p className="text-xs">本週連續專注</p>
          </div>
          <div className={`rounded-2xl p-4 ${planStats.percent >= 80 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
            <div className="text-3xl mb-2">{planStats.percent >= 80 ? '🏅' : '🔒'}</div>
            <p className="text-xs">計畫達成率 80%</p>
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
