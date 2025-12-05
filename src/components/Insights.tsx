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
  subject?: string; // 科目分類
  location?: string;
};

type StudyPlan = {
  id: string;
  title: string;
  subject?: string; // 科目分類（選填）
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

export function Insights({ user, onViewHistory }: InsightsProps) {
  const [mainTab, setMainTab] = useState<'focus' | 'plans'>('focus');
  const [view, setView] = useState<'week' | 'month'>('week');
  const [logs, setLogs] = useState<FocusLog[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    timeSlot: false,
    cumulative: false,
    quality: false,
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

  const monthStats = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Build daily map for heatmap
    const dailyData = Array.from({ length: daysInMonth }).map((_, idx) => {
      const dateObj = new Date(year, month, idx + 1);
      const dateStr = dateObj.toISOString().split('T')[0];
      const dailyLogs = logs.filter(log => log.date === dateStr);
      return {
        date: dateStr,
        day: idx + 1,
        minutes: dailyLogs.reduce((sum, log) => sum + log.minutes, 0),
        sessions: dailyLogs.length,
      };
    });

    const totalMinutes = dailyData.reduce((sum, d) => sum + d.minutes, 0);
    const totalPomodoros = dailyData.reduce((sum, d) => sum + d.sessions, 0);
    const activeDays = dailyData.filter(d => d.sessions > 0).length;
    const dailyAverage = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;

    const bestDay = dailyData.reduce((best, current) =>
      current.minutes > best.minutes ? current : best, dailyData[0]
    );

    return {
      totalMinutes,
      totalPomodoros,
      activeDays,
      dailyAverage,
      bestDay,
      dailyData,
      daysInMonth,
    };
  }, [logs]);

  const lifetimeStats = useMemo(() => {
    const totalPomodoros = logs.length;
    const totalMinutes = logs.reduce((sum, log) => sum + log.minutes, 0);

    // Streak calculation
    const dateSet = new Set(logs.map(log => log.date));
    const sortedDates = Array.from(dateSet).sort();

    let longestStreak = 0;
    let currentStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, currentStreak);
    }

    // Best single day
    const dailyMap: { [date: string]: { minutes: number; sessions: number } } = {};
    logs.forEach(log => {
      if (!dailyMap[log.date]) {
        dailyMap[log.date] = { minutes: 0, sessions: 0 };
      }
      dailyMap[log.date].minutes += log.minutes;
      dailyMap[log.date].sessions += 1;
    });

    const bestDay = Object.entries(dailyMap).reduce((best, [date, stats]) => {
      return stats.minutes > best.minutes ? { date, ...stats } : best;
    }, { date: '', minutes: 0, sessions: 0 });

    // Best week (7-day rolling window)
    let bestWeekMinutes = 0;
    let bestWeekStart = '';

    for (let i = 0; i < sortedDates.length; i++) {
      const weekEnd = new Date(sortedDates[i]);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);

      const weekLogs = logs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= weekStart && logDate <= weekEnd;
      });
      const weekMinutes = weekLogs.reduce((sum, log) => sum + log.minutes, 0);

      if (weekMinutes > bestWeekMinutes) {
        bestWeekMinutes = weekMinutes;
        bestWeekStart = weekStart.toISOString().split('T')[0];
      }
    }

    return {
      totalPomodoros,
      totalMinutes,
      longestStreak,
      bestDay,
      bestWeekMinutes,
      bestWeekStart,
    };
  }, [logs]);

  const weekComparison = useMemo(() => {
    const today = new Date();

    // Current week (last 7 days)
    const currentWeekLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      const diffDays = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays < 7;
    });

    // Previous week (days 7-13 ago)
    const prevWeekLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      const diffDays = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 7 && diffDays < 14;
    });

    const currentMinutes = currentWeekLogs.reduce((sum, log) => sum + log.minutes, 0);
    const currentSessions = currentWeekLogs.length;
    const prevMinutes = prevWeekLogs.reduce((sum, log) => sum + log.minutes, 0);
    const prevSessions = prevWeekLogs.length;

    const minutesDelta = prevMinutes > 0
      ? Math.round(((currentMinutes - prevMinutes) / prevMinutes) * 100)
      : (currentMinutes > 0 ? 100 : 0);

    const sessionsDelta = prevSessions > 0
      ? Math.round(((currentSessions - prevSessions) / prevSessions) * 100)
      : (currentSessions > 0 ? 100 : 0);

    const activeDays = new Set(currentWeekLogs.map(log => log.date)).size;

    return {
      currentMinutes,
      currentSessions,
      minutesDelta,
      sessionsDelta,
      activeDays,
    };
  }, [logs]);

  const qualityStats = useMemo(() => {
    if (logs.length === 0) {
      return {
        avgDuration: 0,
        completionRate: 0,
        interruptionRate: 0,
        shortSessions: 0,
        standardSessions: 0,
        longSessions: 0,
      };
    }

    const totalSessions = logs.length;
    const avgDuration = Math.round(logs.reduce((sum, log) => sum + log.minutes, 0) / totalSessions);

    const shortSessions = logs.filter(log => log.minutes < 20).length;
    const standardSessions = logs.filter(log => log.minutes >= 20 && log.minutes <= 30).length;
    const longSessions = logs.filter(log => log.minutes > 30).length;

    const completionRate = Math.round(((standardSessions + longSessions) / totalSessions) * 100);
    const interruptionRate = Math.round((shortSessions / totalSessions) * 100);

    return {
      avgDuration,
      completionRate,
      interruptionRate,
      shortSessions,
      standardSessions,
      longSessions,
    };
  }, [logs]);

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

    // 科目/標題分析（優先使用 subject，沒有則使用 planTitle）
    const subjectStats: { [key: string]: { minutes: number; count: number } } = {};
    logs.forEach(log => {
      const key = log.subject || log.planTitle;
      if (key) {
        if (!subjectStats[key]) {
          subjectStats[key] = { minutes: 0, count: 0 };
        }
        subjectStats[key].minutes += log.minutes;
        subjectStats[key].count += 1;
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

  const dynamicSuggestions = useMemo(() => {
    const suggestions: string[] = [];

    if (logs.length === 0) {
      return ['完成 1 個番茄鐘來解鎖個人化建議'];
    }

    // Current streak
    const today = new Date().toISOString().split('T')[0];
    const sortedDates = Array.from(new Set(logs.map(log => log.date))).sort().reverse();
    let currentStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateStr = checkDate.toISOString().split('T')[0];

      if (sortedDates.includes(checkDateStr)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Streak-based suggestion
    if (currentStreak === 0) {
      suggestions.push('今天還沒有紀錄，開始一個番茄鐘延續學習習慣！');
    } else if (currentStreak >= 3 && currentStreak < 7) {
      suggestions.push(`🔥 已連續 ${currentStreak} 天！再堅持 ${7 - currentStreak} 天達成一週連續目標`);
    } else if (currentStreak >= 7) {
      suggestions.push(`🏆 太棒了！已連續 ${currentStreak} 天，保持這個勢頭！`);
    }

    // Active days ratio this month
    const monthActiveDays = monthStats.activeDays;
    const daysInMonth = monthStats.daysInMonth;
    const todayDate = new Date().getDate();
    const activeRatio = monthActiveDays / todayDate;

    if (activeRatio < 0.5 && monthActiveDays > 0) {
      suggestions.push(`本月活躍天數僅 ${Math.round(activeRatio * 100)}%，試著每天至少完成 1 個番茄鐘`);
    } else if (activeRatio >= 0.8) {
      suggestions.push(`🌟 本月活躍度極高（${Math.round(activeRatio * 100)}%），繼續保持！`);
    }

    // Time slot completion rate
    const timeSlots = planStats.timeSlotStats;
    const morningRate = timeSlots.morning.count > 0 ? timeSlots.morning.completed / timeSlots.morning.count : 0;
    const afternoonRate = timeSlots.afternoon.count > 0 ? timeSlots.afternoon.completed / timeSlots.afternoon.count : 0;
    const eveningRate = timeSlots.evening.count > 0 ? timeSlots.evening.completed / timeSlots.evening.count : 0;

    const bestSlot =
      morningRate >= afternoonRate && morningRate >= eveningRate ? '早上' :
      afternoonRate >= eveningRate ? '下午' : '晚上';

    const bestSlotRate = Math.max(morningRate, afternoonRate, eveningRate);

    if (bestSlotRate > 0.7) {
      suggestions.push(`你在${bestSlot}的完成率最高（${Math.round(bestSlotRate * 100)}%），建議優先安排重要任務`);
    }

    // Quality suggestion
    if (qualityStats.interruptionRate > 30 && logs.length >= 5) {
      suggestions.push(`最近中斷率較高（${qualityStats.interruptionRate}%），試著減少外部干擾或調整番茄鐘時長`);
    }

    return suggestions.slice(0, 3);
  }, [logs, monthStats, planStats, qualityStats]);

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
          {/* Empty State */}
          {logs.length === 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-3xl p-8 text-center">
              <div className="text-6xl mb-4">🍅</div>
              <h3 className="text-gray-800 font-bold mb-2">開始你的第一個番茄鐘</h3>
              <p className="text-gray-600 text-sm mb-4">
                完成番茄鐘後，這裡會顯示詳細的統計與分析
              </p>
            </div>
          )}

          <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          <h2 className="text-gray-800">本週概況</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-indigo-50 rounded-2xl p-4">
            <p className="text-indigo-500 text-sm">專注分鐘</p>
            <p className="text-3xl text-indigo-700">{weekComparison.currentMinutes}</p>
            <p className={`text-xs mt-1 ${weekComparison.minutesDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {weekComparison.minutesDelta >= 0 ? '↑' : '↓'} {Math.abs(weekComparison.minutesDelta)}% vs 上週
            </p>
          </div>
          <div className="bg-purple-50 rounded-2xl p-4">
            <p className="text-purple-500 text-sm">番茄鐘數</p>
            <p className="text-3xl text-purple-700">{weekComparison.currentSessions}</p>
            <p className={`text-xs mt-1 ${weekComparison.sessionsDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {weekComparison.sessionsDelta >= 0 ? '↑' : '↓'} {Math.abs(weekComparison.sessionsDelta)}% vs 上週
            </p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-2xl p-3 text-sm text-gray-600">
          <p>本週活躍天數：{weekComparison.activeDays} / 7 天</p>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-orange-500" />
          <h2 className="text-gray-800">本月統計</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 rounded-2xl p-4">
            <p className="text-orange-500 text-sm">累積番茄鐘</p>
            <p className="text-3xl text-orange-700">{monthStats.totalPomodoros}</p>
          </div>
          <div className="bg-purple-50 rounded-2xl p-4">
            <p className="text-purple-500 text-sm">累積分鐘</p>
            <p className="text-3xl text-purple-700">{monthStats.totalMinutes}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-3 text-sm">
          <p className="text-gray-600">日均時長：{monthStats.dailyAverage} 分鐘</p>
          <p className="text-gray-600">
            最佳單日：{monthStats.bestDay.day}號 ({monthStats.bestDay.minutes} 分鐘)
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">本月活躍熱力圖</p>
          <div className="grid grid-cols-7 gap-1">
            {monthStats.dailyData.map((day) => {
              const intensity = day.sessions === 0 ? 0 :
                day.sessions <= 2 ? 1 :
                day.sessions <= 4 ? 2 : 3;
              const colors = [
                'bg-gray-100',
                'bg-orange-200',
                'bg-orange-400',
                'bg-orange-600',
              ];
              return (
                <div
                  key={day.date}
                  className={`h-8 rounded ${colors[intensity]} flex items-center justify-center text-xs text-gray-700 font-medium`}
                  title={`${day.date}: ${day.sessions} 次, ${day.minutes} 分`}
                >
                  {day.day}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-lg p-6 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <h2 className="text-gray-800">全歷程統計</h2>
        </div>

        {lifetimeStats.totalPomodoros === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <p className="text-gray-500 text-sm">尚無歷史紀錄</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 rounded-2xl p-4">
                <p className="text-indigo-500 text-sm">總番茄鐘</p>
                <p className="text-3xl text-indigo-700">{lifetimeStats.totalPomodoros}</p>
              </div>
              <div className="bg-purple-50 rounded-2xl p-4">
                <p className="text-purple-500 text-sm">總分鐘</p>
                <p className="text-3xl text-purple-700">{lifetimeStats.totalMinutes}</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-200">
              <p className="text-green-700 text-sm mb-1">🔥 最長連續天數</p>
              <p className="text-2xl text-green-700 font-bold">{lifetimeStats.longestStreak} 天</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-yellow-50 rounded-2xl p-3">
                <p className="text-yellow-700 text-xs">最佳單日</p>
                <p className="text-lg text-yellow-800 font-semibold">
                  {lifetimeStats.bestDay.minutes} 分
                </p>
              </div>
              <div className="bg-pink-50 rounded-2xl p-3">
                <p className="text-pink-700 text-xs">最佳單週</p>
                <p className="text-lg text-pink-800 font-semibold">
                  {lifetimeStats.bestWeekMinutes} 分
                </p>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-gray-800">智慧建議</h2>
        </div>

        {dynamicSuggestions.length === 1 && dynamicSuggestions[0].includes('完成 1 個番茄鐘') ? (
          <div className="bg-amber-50 rounded-2xl p-6 text-center">
            <p className="text-amber-700 text-sm">{dynamicSuggestions[0]}</p>
          </div>
        ) : (
          <ul className="space-y-3 text-gray-600 text-sm">
            {dynamicSuggestions.map((suggestion, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-amber-500">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        )}
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

          {/* 完成品質分析 */}
          <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setExpandedSections(prev => ({ ...prev, quality: !prev.quality }))}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <h2 className="text-gray-800">完成品質分析</h2>
              </div>
              {expandedSections.quality ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.quality && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 rounded-2xl p-4 text-center">
                    <p className="text-green-600 text-2xl font-bold">{qualityStats.completionRate}%</p>
                    <p className="text-green-600 text-xs mt-1">完成率</p>
                  </div>
                  <div className="bg-orange-50 rounded-2xl p-4 text-center">
                    <p className="text-orange-600 text-2xl font-bold">{qualityStats.interruptionRate}%</p>
                    <p className="text-orange-600 text-xs mt-1">中斷率</p>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-4 text-center">
                    <p className="text-blue-600 text-2xl font-bold">{qualityStats.avgDuration}</p>
                    <p className="text-blue-600 text-xs mt-1">平均時長(分)</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-sm text-gray-700 mb-2">時長分布</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>短期 (&lt;20分)</span>
                      <span>{qualityStats.shortSessions} 次</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>標準 (20-30分)</span>
                      <span>{qualityStats.standardSessions} 次</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>長期 (&gt;30分)</span>
                      <span>{qualityStats.longSessions} 次</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 科目時間分布 */}
          {planStats.sortedSubjects.length > 0 && (
            <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <h2 className="text-gray-800">最投入科目 Top 5</h2>
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
              <p className="text-gray-400 text-xs text-center mt-2">顯示學習時長最多的科目</p>
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
