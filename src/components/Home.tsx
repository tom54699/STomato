import { useEffect, useRef, useState } from 'react';
import { Timer, Play, Pause, RotateCcw, Award, Target, MapPin, Zap } from 'lucide-react';
import { User } from '../App';

type HomeProps = {
  user: User;
  onPointsUpdate: (points: number) => void;
  onGoToSettlement: (data: {
    sessionMinutes: number;
    pointsEarned: number;
    planTitle?: string;
    planPercent?: number;
  }) => void;
};

type StudyPlan = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  reminderTime: string;
  location?: string;
  completed: boolean;
};

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

export function Home({ user, onPointsUpdate, onGoToSettlement }: HomeProps) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [initialMinutes, setInitialMinutes] = useState(25);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [recentLogs, setRecentLogs] = useState<FocusLog[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pointsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityRef = useRef(true);
  const touchStartRef = useRef(0);

  const [todayPlans, setTodayPlans] = useState<StudyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [customLocation, setCustomLocation] = useState('');

  const todayKey = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadTodayPlans();
    loadRecentLogs();
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev === 0) {
            setMinutes((m) => {
              if (m === 0) {
                handleComplete();
                return 0;
              }
              return m - 1;
            });
            return 59;
          }
          return prev - 1;
        });
      }, 1000);

      pointsIntervalRef.current = setInterval(() => {
        if (visibilityRef.current) {
          setPointsEarned((prev) => prev + 10);
        }
      }, 60000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (pointsIntervalRef.current) clearInterval(pointsIntervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (pointsIntervalRef.current) clearInterval(pointsIntervalRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    const handler = () => {
      if (document.hidden && isRunning) {
        visibilityRef.current = false;
        const penalty = Math.min(50, pointsEarned);
        setPointsEarned((prev) => Math.max(0, prev - penalty));
      } else if (!document.hidden && isRunning) {
        visibilityRef.current = true;
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [isRunning, pointsEarned]);

  const handleComplete = () => {
    setIsRunning(false);
    const completionBonus = 50;
    const totalPoints = pointsEarned + completionBonus;
    onPointsUpdate(totalPoints);

    const linkedPlan = todayPlans.find((plan) => plan.id === selectedPlanId);
    const planPercent = computePlanPercent(todayPlans);

    // 記錄焦點日誌
    const focusLog: FocusLog = {
      id: `log-${Date.now()}`,
      date: todayKey,
      minutes: initialMinutes,
      timestamp: Date.now(),
      planId: selectedPlanId || undefined,
      planTitle: linkedPlan?.title,
      location: linkedPlan?.location || customLocation || undefined,
      completionPercent: 100,
    };
    recordFocusLog(focusLog);

    // 更新計畫完成狀態
    if (selectedPlanId) {
      updatePlanCompletion(selectedPlanId, 100);
    }

    // 導航到結算頁面
    onGoToSettlement({
      sessionMinutes: initialMinutes,
      pointsEarned: totalPoints,
      planTitle: linkedPlan?.title,
      planPercent: planPercent,
    });

    // 重置計時器
    setSelectedPlanId('');
    setCustomLocation('');
    resetTimer();
  };


  const toggleTimer = () => {
    if (!isRunning && minutes === initialMinutes && seconds === 0) {
      setPointsEarned(0);
      visibilityRef.current = true;
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMinutes(initialMinutes);
    setSeconds(0);
    setPointsEarned(0);
    visibilityRef.current = true;
  };

  const setCustomTime = (mins: number) => {
    if (!isRunning) {
      setMinutes(mins);
      setSeconds(0);
      setInitialMinutes(mins);
      setPointsEarned(0);
    }
  };

  const loadTodayPlans = () => {
    const raw = localStorage.getItem('studyPlans');
    if (!raw) {
      setTodayPlans([]);
      return;
    }
    try {
      const allPlans = JSON.parse(raw) as StudyPlan[];
      setTodayPlans(allPlans.filter((plan) => plan.date === todayKey));
    } catch (error) {
      console.warn('Failed to parse studyPlans', error);
      setTodayPlans([]);
    }
  };

  const loadRecentLogs = () => {
    const raw = localStorage.getItem('focusLogs');
    if (!raw) {
      setRecentLogs([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as FocusLog[];
      setRecentLogs(parsed.slice(0, 5));
    } catch (error) {
      console.warn('Failed to parse focusLogs', error);
      setRecentLogs([]);
    }
  };

  const updatePlanCompletion = (planId?: string, percent = 100): number => {
    if (!planId) {
      const refreshed = todayPlans;
      return computePlanPercent(refreshed);
    }
    const raw = localStorage.getItem('studyPlans');
    if (!raw) return 0;
    let nextPlans: StudyPlan[] = [];
    try {
      nextPlans = JSON.parse(raw);
    } catch (error) {
      console.warn('Failed to parse studyPlans', error);
      return 0;
    }
    const updated = nextPlans.map((plan) =>
      plan.id === planId ? { ...plan, completed: percent >= 80 } : plan
    );
    localStorage.setItem('studyPlans', JSON.stringify(updated));
    const filtered = updated.filter((plan) => plan.date === todayKey);
    setTodayPlans(filtered);
    return computePlanPercent(filtered);
  };

  const computePlanPercent = (plans: StudyPlan[]): number => {
    if (!plans.length) return 0;
    const completed = plans.filter((plan) => plan.completed).length;
    return Math.round((completed / plans.length) * 100);
  };

  const recordFocusLog = (log: FocusLog) => {
    const raw = localStorage.getItem('focusLogs');
    let logs: FocusLog[] = [];
    if (raw) {
      try {
        logs = JSON.parse(raw);
      } catch (error) {
        console.warn('Failed to parse focus logs', error);
      }
    }
    const newLog = { ...log, id: `log-${Date.now()}` };
    const nextLogs = [newLog, ...logs].slice(0, 200);
    localStorage.setItem('focusLogs', JSON.stringify(nextLogs));
    setRecentLogs(nextLogs.slice(0, 5));
  };

  const progress = ((initialMinutes * 60 - (minutes * 60 + seconds)) / (initialMinutes * 60)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-4 space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-gray-800">哈囉，{user.name}</h2>
            <p className="text-gray-500">{user.school}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">總積分</p>
            <p className="text-orange-500">{user.totalPoints}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <Timer className="w-12 h-12 text-orange-500 mx-auto mb-2" />
          <h3 className="text-gray-700">專注時間</h3>
        </div>
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="128" cy="128" r="120" stroke="#fee2e2" strokeWidth="12" fill="none" />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-gray-800 mb-2">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="text-green-600 flex items-center gap-1">
              <Award className="w-5 h-5" />
              <span>+{pointsEarned}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={toggleTimer}
            className="bg-gradient-to-r from-orange-400 to-pink-500 text-white p-6 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all"
          >
            {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </button>
          <button
            onClick={resetTimer}
            className="bg-gray-200 text-gray-700 p-6 rounded-full shadow-lg hover:shadow-xl hover:bg-gray-300 transform hover:scale-110 transition-all"
          >
            <RotateCcw className="w-8 h-8" />
          </button>
          <button
            onClick={handleComplete}
            className="bg-yellow-100 text-yellow-600 p-6 rounded-full border border-yellow-300 shadow hover:shadow-md transform hover:scale-105 transition-all"
            title="快速完成一次番茄鐘（Demo 專用）"
          >
            <Zap className="w-8 h-8" />
          </button>
        </div>
        <div className="flex justify-center gap-3">
          {[15, 25, 45, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => setCustomTime(mins)}
              disabled={isRunning}
              className={`px-4 py-2 rounded-xl transition-all ${
                initialMinutes === mins && !isRunning ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
              } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {mins}分
            </button>
          ))}
        </div>
      </div>

      {todayPlans.length > 0 && (
        <div className="bg-white rounded-3xl shadow-lg p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" />
            <h3 className="text-gray-800">今日計畫</h3>
            <span className="text-sm text-gray-500">完成 {computePlanPercent(todayPlans)}%</span>
          </div>
          <select
            className="w-full rounded-2xl border border-gray-200 px-4 py-3"
            value={selectedPlanId}
            onChange={(event) => setSelectedPlanId(event.target.value)}
          >
            <option value="">不指定，純番茄鐘</option>
            {todayPlans.map((plan) => (
              <option key={plan.id} value={plan.id} disabled={plan.completed}>
                {plan.completed ? `✅ ${plan.title}` : `${plan.startTime} - ${plan.endTime} · ${plan.title}`}
              </option>
            ))}
          </select>
          {!selectedPlanId && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <input
                className="flex-1 rounded-2xl border border-gray-200 px-3 py-2"
                placeholder="地點（可選，例如 圖書館3F）"
                value={customLocation}
                onChange={(event) => setCustomLocation(event.target.value)}
              />
            </div>
          )}
          <p className="text-xs text-gray-400">選定計畫後完成番茄鐘會自動紀錄到洞察。</p>
        </div>
      )}

      {recentLogs.length > 0 && (
        <div className="bg-white rounded-3xl shadow-lg p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-800">近期紀錄</h3>
            <span className="text-xs text-gray-400">最近 {recentLogs.length} 次</span>
          </div>
          {recentLogs.map((log) => (
            <div key={log.id} className="border border-gray-100 rounded-2xl p-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>{log.planTitle ?? '自由番茄鐘'}</span>
                <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-xs text-gray-400">
                {log.minutes} 分鐘 · {log.location ?? '未指定'}
                {log.completionPercent !== undefined ? ` · 完成度 ${log.completionPercent}%` : ''}
              </p>
              {log.note && <p className="text-gray-600 mt-1">{log.note}</p>}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
