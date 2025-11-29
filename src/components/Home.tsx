import { useEffect, useRef, useState } from 'react';
import { Timer, Play, Pause, RotateCcw, Award, Target, MapPin, Zap } from 'lucide-react';
import { User } from '../App';

type HomeProps = {
  user: User;
  onPointsUpdate: (points: number) => void;
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
};

export function Home({ user, onPointsUpdate }: HomeProps) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [initialMinutes, setInitialMinutes] = useState(25);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [rewardStats, setRewardStats] = useState<{ planPercent: number } | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState<FocusLog | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({ note: '', percent: 100 });
  const [recentLogs, setRecentLogs] = useState<FocusLog[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pointsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityRef = useRef(true);

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
    setPointsEarned(totalPoints);
    onPointsUpdate(totalPoints);

    const linkedPlan = todayPlans.find((plan) => plan.id === selectedPlanId);
    setRewardStats({ planPercent: computePlanPercent(todayPlans) });
    setFeedbackDraft({
      id: `draft-${Date.now()}`,
      date: todayKey,
      minutes: initialMinutes,
      timestamp: Date.now(),
      planId: selectedPlanId || undefined,
      planTitle: linkedPlan?.title,
      location: linkedPlan?.location || customLocation || undefined,
    });
    setFeedbackForm({ note: '', percent: linkedPlan?.completed ? 100 : 100 });
    setShowReward(true);
    setSelectedPlanId('');
    setCustomLocation('');
  };

  const finalizeFeedback = (shouldSave: boolean) => {
    if (!feedbackDraft) {
      resetAfterFeedback();
      return;
    }
    if (shouldSave) {
      recordFocusLog({ ...feedbackDraft, note: feedbackForm.note.trim() || undefined, completionPercent: feedbackForm.percent });
      if (feedbackDraft.planId) {
        updatePlanCompletion(feedbackDraft.planId, feedbackForm.percent);
      }
    } else {
      recordFocusLog(feedbackDraft);
    }
    resetAfterFeedback();
  };

  const resetAfterFeedback = () => {
    setShowReward(false);
    setRewardStats(null);
    setFeedbackDraft(null);
    setFeedbackForm({ note: '', percent: 100 });
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

      {showReward && feedbackDraft && (
        <div className="fixed inset-0 bg-gradient-to-br from-orange-400 to-pink-500 z-50 flex flex-col">
          {/* 頂部慶祝區域 */}
          <div className="flex-1 flex flex-col items-center justify-center text-white relative">
            {/* 背景裝飾 */}
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-10 right-8 w-20 h-20 bg-white/20 rounded-full"></div>
            <div className="absolute top-32 left-6 w-12 h-12 bg-white/15 rounded-full"></div>
            <div className="absolute bottom-40 right-12 w-16 h-16 bg-white/10 rounded-full"></div>

            <div className="relative z-10 text-center">
              <div className="text-8xl mb-6 animate-bounce">🎉</div>
              <h1 className="text-4xl font-bold mb-4">完成！</h1>
              <p className="text-xl text-orange-100 mb-8">{initialMinutes}分鐘專注時間</p>

              {/* 積分顯示 */}
              <div className="bg-white/20 backdrop-blur-sm rounded-3xl px-8 py-4 mb-6">
                <div className="text-3xl font-bold">+{pointsEarned}</div>
                <div className="text-orange-100">積分獲得</div>
              </div>

              {/* 今日進度 */}
              {rewardStats && todayPlans.length > 0 && (
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-3 mb-4">
                  <div className="text-sm text-orange-100 mb-1">今日計畫完成</div>
                  <div className="text-2xl font-bold">{rewardStats.planPercent}%</div>
                </div>
              )}
            </div>
          </div>

          {/* 底部操作區 */}
          <div className="bg-white rounded-t-3xl p-6 space-y-4 flex-shrink-0">
            {/* 完成度評分 */}
            <div className="text-center mb-4">
              <div className="text-lg font-semibold text-gray-800 mb-2">專注程度</div>
              <div className="flex justify-center gap-2 mb-2">
                {[20, 40, 60, 80, 100].map((score) => (
                  <button
                    key={score}
                    onClick={() => setFeedbackForm(prev => ({ ...prev, percent: score }))}
                    className={`w-12 h-12 rounded-full border-2 transition-all ${
                      feedbackForm.percent === score
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 px-2">
                <span>需要加油</span>
                <span>表現完美</span>
              </div>
            </div>

            {/* 心得記錄 */}
            <textarea
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm resize-none h-20"
              placeholder="記錄學習心得..."
              value={feedbackForm.note}
              onChange={(event) => setFeedbackForm((prev) => ({ ...prev, note: event.target.value }))}
            />

            {/* 底部按鈕 */}
            <div className="flex gap-3">
              <button
                className="flex-1 py-4 rounded-2xl border border-gray-300 text-gray-600 font-medium"
                onClick={() => finalizeFeedback(false)}
              >
                跳過
              </button>
              <button
                className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-medium"
                onClick={() => finalizeFeedback(true)}
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
