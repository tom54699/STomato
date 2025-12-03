import { useEffect, useMemo, useState } from 'react';
import { User } from '../App';
import { BarChart3, Activity, CalendarRange, Sparkles, CheckCircle2, Clock, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

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
  targetMinutes?: number;
  completedMinutes?: number;
  pomodoroCount?: number;
};

type InsightsProps = {
  user: User;
  onViewHistory?: () => void;
};

const weekdayShort = ['一', '二', '三', '四', '五', '六', '日'];

const monthlyGoalMinutes = 1800;
const monthlyGoalSessions = 60;

export function Insights({ user, onViewHistory }: InsightsProps) {
  const [mainTab, setMainTab] = useState<'focus' | 'plans'>('focus');
  const [view, setView] = useState<'week' | 'month'>('week');
  const [logs, setLogs] = useState<FocusLog[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    timeSlot: false,
    cumulative: false,
  });

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

  // 計畫分析統計
  const planStats = useMemo(() => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 6);

    // 本週計畫
    const weekPlans = plans.filter(plan => {
      const planDate = new Date(plan.date);
      return planDate >= weekAgo && planDate <= today;
    });

    const completedPlans = weekPlans.filter(p => p.completed);
    const inProgressPlans = weekPlans.filter(p => !p.completed && (p.completedMinutes || 0) > 0);
    const notStartedPlans = weekPlans.filter(p => !p.completed && !(p.completedMinutes || 0));

    const completionRate = weekPlans.length > 0 ? Math.round((completedPlans.length / weekPlans.length) * 100) : 0;

    // 科目/標題分析
    const subjectStats: { [key: string]: { minutes: number; count: number } } = {};
    logs.forEach(log => {
      if (log.planTitle) {
        if (!subjectStats[log.planTitle]) {
          subjectStats[log.planTitle] = { minutes: 0, count: 0 };
        }
        subjectStats[log.planTitle].minutes += log.minutes;
        subjectStats[log.planTitle].count += 1;
      }
    });
    const sortedSubjects = Object.entries(subjectStats)
      .sort((a, b) => b[1].minutes - a[1].minutes)
      .slice(0, 5);

    // 時段分析
    const timeSlotStats = {
      morning: { count: 0, completed: 0 },   // 6-12
      afternoon: { count: 0, completed: 0 }, // 12-18
      evening: { count: 0, completed: 0 },   // 18-24
    };
    weekPlans.forEach(plan => {
      const hour = parseInt(plan.startTime.split(':')[0]);
      let slot: 'morning' | 'afternoon' | 'evening' = 'morning';
      if (hour >= 12 && hour < 18) slot = 'afternoon';
      else if (hour >= 18) slot = 'evening';

      timeSlotStats[slot].count += 1;
      if (plan.completed) timeSlotStats[slot].completed += 1;
    });

    // 累積進度統計
    const plansWithProgress = weekPlans.filter(p => p.targetMinutes && p.targetMinutes > 0);
    const avgPomodorosPerPlan = plansWithProgress.length > 0
      ? Math.round(plansWithProgress.reduce((sum, p) => sum + (p.pomodoroCount || 0), 0) / plansWithProgress.length * 10) / 10
      : 0;
    const totalTargetMinutes = plansWithProgress.reduce((sum, p) => sum + (p.targetMinutes || 0), 0);
    const totalCompletedMinutes = plansWithProgress.reduce((sum, p) => sum + (p.completedMinutes || 0), 0);
    const overallProgress = totalTargetMinutes > 0 ? Math.round((totalCompletedMinutes / totalTargetMinutes) * 100) : 0;

    return {
      total: weekPlans.length,
      completed: completedPlans.length,
      inProgress: inProgressPlans.length,
      notStarted: notStartedPlans.length,
      completionRate,
      sortedSubjects,
      timeSlotStats,
      avgPomodorosPerPlan,
      overallProgress,
      totalTargetMinutes,
      totalCompletedMinutes,
    };
  }, [plans, logs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 space-y-5">
      <header className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-10 h-10 text-indigo-500" />
          <div>
            <p className="text-gray-500 text-sm">學習洞察</p>
            <h1 className="text-gray-800 text-xl">數據分析報告</h1>
          </div>
        </div>
        <p className="text-gray-500 mt-2 text-sm">根據最近 7 天紀錄，提供建議與成就</p>

        {/* 主分頁切換 */}
        <div className="mt-4 bg-gray-100 rounded-2xl p-1.5 flex gap-1">
          <button
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              mainTab === 'focus'
                ? 'bg-white shadow-md text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setMainTab('focus')}
          >
            📊 專注趨勢
          </button>
          <button
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              mainTab === 'plans'
                ? 'bg-white shadow-md text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setMainTab('plans')}
          >
            📅 計畫分析
          </button>
        </div>
      </header>

      {/* 專注趨勢分頁 */}
      {mainTab === 'focus' && (
        <>
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
        </>
      )}

      {/* 計畫分析分頁 */}
      {mainTab === 'plans' && (
        <>
          {/* 完成率總覽 */}
          <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h2 className="text-gray-800">本週計畫概況</h2>
            </div>

            {planStats.total === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-6 text-center">
                <p className="text-gray-500 text-sm">本週尚未建立任何計畫</p>
                <p className="text-gray-400 text-xs mt-1">前往「讀書計畫」頁面新增計畫吧！</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 rounded-2xl p-4 text-center">
                    <p className="text-green-600 text-2xl font-bold">{planStats.completed}</p>
                    <p className="text-green-600 text-xs mt-1">已完成</p>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-4 text-center">
                    <p className="text-blue-600 text-2xl font-bold">{planStats.inProgress}</p>
                    <p className="text-blue-600 text-xs mt-1">進行中</p>
                  </div>
                  <div className="bg-gray-100 rounded-2xl p-4 text-center">
                    <p className="text-gray-600 text-2xl font-bold">{planStats.notStarted}</p>
                    <p className="text-gray-600 text-xs mt-1">未開始</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-green-700 text-sm font-medium">完成率</span>
                    <span className="text-green-700 text-2xl font-bold">{planStats.completionRate}%</span>
                  </div>
                  <div className="h-3 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                      style={{ width: `${planStats.completionRate}%` }}
                    />
                  </div>
                  <p className="text-green-600 text-xs mt-2">本週共 {planStats.total} 個計畫</p>
                </div>
              </>
            )}
          </section>

          {/* 科目時間分布 */}
          {planStats.sortedSubjects.length > 0 && (
            <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <h2 className="text-gray-800">科目時間分布</h2>
              </div>
              <div className="space-y-3">
                {planStats.sortedSubjects.map(([subject, stats], index) => {
                  const maxMinutes = planStats.sortedSubjects[0][1].minutes;
                  const widthPercent = (stats.minutes / maxMinutes) * 100;
                  const colors = [
                    'from-purple-400 to-purple-500',
                    'from-blue-400 to-blue-500',
                    'from-indigo-400 to-indigo-500',
                    'from-pink-400 to-pink-500',
                    'from-orange-400 to-orange-500',
                  ];
                  return (
                    <div key={subject} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-medium truncate flex-1">{subject}</span>
                        <span className="text-gray-500 ml-2">{stats.minutes} 分鐘 ({stats.count}🍅)</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${colors[index]} transition-all duration-500`}
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-gray-400 text-xs text-center mt-2">顯示前 5 名科目/計畫</p>
            </section>
          )}

          {/* 時段分析（可展開） */}
          {planStats.total > 0 && (
            <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
              <button
                className="w-full flex items-center justify-between"
                onClick={() => setExpandedSections(prev => ({ ...prev, timeSlot: !prev.timeSlot }))}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <h2 className="text-gray-800">時段分析</h2>
                </div>
                {expandedSections.timeSlot ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {expandedSections.timeSlot && (
                <div className="space-y-3 pt-2">
                  {[
                    { key: 'morning' as const, label: '早上 (6-12點)', emoji: '🌅', color: 'orange' },
                    { key: 'afternoon' as const, label: '下午 (12-18點)', emoji: '☀️', color: 'yellow' },
                    { key: 'evening' as const, label: '晚上 (18-24點)', emoji: '🌙', color: 'indigo' },
                  ].map(({ key, label, emoji, color }) => {
                    const stats = planStats.timeSlotStats[key];
                    const rate = stats.count > 0 ? Math.round((stats.completed / stats.count) * 100) : 0;
                    return (
                      <div key={key} className={`bg-${color}-50 rounded-2xl p-4`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {emoji} {label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {stats.count} 個計畫
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-${color}-400`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-10 text-right">
                            {rate}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          完成 {stats.completed} / {stats.count}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* 累積進度統計（可展開） */}
          {planStats.totalTargetMinutes > 0 && (
            <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
              <button
                className="w-full flex items-center justify-between"
                onClick={() => setExpandedSections(prev => ({ ...prev, cumulative: !prev.cumulative }))}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <h2 className="text-gray-800">累積進度追蹤</h2>
                </div>
                {expandedSections.cumulative ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {expandedSections.cumulative && (
                <div className="space-y-4 pt-2">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-blue-700 text-sm font-medium">整體進度</span>
                      <span className="text-blue-700 text-xl font-bold">{planStats.overallProgress}%</span>
                    </div>
                    <div className="h-3 bg-white rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500"
                        style={{ width: `${planStats.overallProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-blue-600">
                      <span>{planStats.totalCompletedMinutes} 分鐘</span>
                      <span>目標 {planStats.totalTargetMinutes} 分鐘</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 rounded-2xl p-4 text-center">
                      <p className="text-purple-600 text-2xl font-bold">{planStats.avgPomodorosPerPlan}</p>
                      <p className="text-purple-600 text-xs mt-1">平均番茄鐘數/計畫</p>
                    </div>
                    <div className="bg-pink-50 rounded-2xl p-4 text-center">
                      <p className="text-pink-600 text-2xl font-bold">
                        {planStats.totalCompletedMinutes}
                      </p>
                      <p className="text-pink-600 text-xs mt-1">累積完成分鐘</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-3 text-xs text-gray-600">
                    💡 提示：長時間計畫可透過多次番茄鐘累積完成
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 提示：沒有計畫時的引導 */}
          {planStats.total === 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl p-8 text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-gray-800 font-bold mb-2">開始建立你的學習計畫</h3>
              <p className="text-gray-600 text-sm mb-4">
                建立計畫後，這裡將顯示完整的計畫分析與統計
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
