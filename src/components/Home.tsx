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
  }) => void;
  onNavigateToPlanner?: () => void;
};

type StudyPlan = {
  id: string;
  title: string;
  subject?: string; // 科目分類（選填）
  date: string;
  startTime: string;
  endTime: string;
  reminderTime: string;
  location?: string;
  completed: boolean;
  targetMinutes?: number; // 計畫總時長（分鐘）
  completedMinutes?: number; // 已完成時長（分鐘）
  pomodoroCount?: number; // 完成的番茄鐘數量
};

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

export function Home({ user, onPointsUpdate, onGoToSettlement, onNavigateToPlanner }: HomeProps) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [initialMinutes, setInitialMinutes] = useState(25);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [hasStarted, setHasStarted] = useState(false); // 追蹤是否已經開始過計時

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pointsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityRef = useRef(true);

  const [todayPlans, setTodayPlans] = useState<StudyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [customLocation, setCustomLocation] = useState('');

  // Circular slider drag state
  const [isDragging, setIsDragging] = useState(false);
  const circleRef = useRef<SVGSVGElement>(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    type: 'suggest' | 'warning';
    message: string;
    suggestedMinutes?: number;
    planId?: string;
    originalMinutes?: number;
  }>({ show: false, type: 'suggest', message: '' });

  const todayKey = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadTodayPlans();
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
    setHasStarted(false); // 重置為未開始狀態
    const completionBonus = 50;
    const totalPoints = pointsEarned + completionBonus;
    onPointsUpdate(totalPoints);

    const linkedPlan = todayPlans.find((plan) => plan.id === selectedPlanId);

    const log: FocusLog = {
      id: `log-${Date.now()}`,
      date: todayKey,
      minutes: initialMinutes,
      timestamp: Date.now(),
      planId: linkedPlan?.id,
      planTitle: linkedPlan?.title,
      subject: linkedPlan?.subject, // 科目分類
      location: linkedPlan?.location || customLocation || undefined,
    };
    recordFocusLog(log);

    // 累積追蹤：更新計畫的完成進度
    if (linkedPlan && linkedPlan.id) {
      const raw = localStorage.getItem('studyPlans');
      if (raw) {
        try {
          let allPlans: StudyPlan[] = JSON.parse(raw);
          allPlans = allPlans.map((plan) => {
            if (plan.id === linkedPlan.id) {
              const newCompletedMinutes = (plan.completedMinutes || 0) + initialMinutes;
              const newPomodoroCount = (plan.pomodoroCount || 0) + 1;
              const shouldComplete = plan.targetMinutes && newCompletedMinutes >= plan.targetMinutes;
              return {
                ...plan,
                completedMinutes: newCompletedMinutes,
                pomodoroCount: newPomodoroCount,
                completed: shouldComplete || plan.completed, // 達到目標時長時自動完成
              };
            }
            return plan;
          });
          localStorage.setItem('studyPlans', JSON.stringify(allPlans));
          // 更新今日計畫顯示
          const updated = allPlans.filter((plan) => plan.date === todayKey);
          setTodayPlans(updated);
        } catch (error) {
          console.warn('Failed to update plan progress', error);
        }
      }
    }

    onGoToSettlement({
      sessionMinutes: initialMinutes,
      pointsEarned: totalPoints,
      planTitle: linkedPlan?.title,
    });

    setSelectedPlanId('');
    setCustomLocation('');
    resetTimer();
  };


  
const toggleTimer = () => {
    if (!isRunning && minutes === initialMinutes && seconds === 0) {
      setPointsEarned(0);
      visibilityRef.current = true;
      setHasStarted(true); // 標記為已開始
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMinutes(initialMinutes);
    setSeconds(0);
    setPointsEarned(0);
    setHasStarted(false); // 重置為未開始狀態
    visibilityRef.current = true;
  };

  const setCustomTime = (mins: number) => {
    if (!isRunning && !hasStarted) {
      setMinutes(mins);
      setSeconds(0);
      setInitialMinutes(mins);
      setPointsEarned(0);
    }
  };

  // Start timer with a specific plan
  const startTimerWithPlan = (planId: string, mins: number) => {
    if (isRunning) return; // Don't allow starting if already running

    setSelectedPlanId(planId);
    setMinutes(mins);
    setSeconds(0);
    setInitialMinutes(mins);
    setPointsEarned(0);
    setHasStarted(true); // 標記為已開始
    visibilityRef.current = true;
    setIsRunning(true);
  };

  // Quick start - directly start timer with current time setting
  const handleQuickStart = () => {
    if (isRunning) return;

    setSelectedPlanId(''); // Quick start doesn't link to a plan
    setPointsEarned(0);
    setHasStarted(true); // 標記為已開始
    visibilityRef.current = true;
    setIsRunning(true);
  };

  // Calculate time from angle
  const calculateTimeFromAngle = (clientX: number, clientY: number) => {
    if (!circleRef.current) return;

    const rect = circleRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate angle from center
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    // Adjust angle to start from top (0 degrees at top)
    angle = (angle + 90 + 360) % 360;

    // Map angle (0-360) to time (1-60 minutes), 1 minute intervals
    const minTime = 1;
    const maxTime = 60;
    const timeRange = maxTime - minTime;
    const newTime = Math.round((angle / 360) * timeRange) + minTime;

    // Clamp between min and max
    const clampedTime = Math.max(minTime, Math.min(maxTime, newTime));

    setCustomTime(clampedTime);
  };

  // Mouse/Touch event handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isRunning || hasStarted) return; // 運行中或已開始過都不允許拖動
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    calculateTimeFromAngle(clientX, clientY);
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    calculateTimeFromAngle(clientX, clientY);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Add global mouse/touch event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove, { passive: false });
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);

      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

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

  const togglePlanCompletion = (planId: string): void => {
    const raw = localStorage.getItem('studyPlans');
    if (!raw) return;
    let nextPlans: StudyPlan[] = [];
    try {
      nextPlans = JSON.parse(raw);
    } catch (error) {
      console.warn('Failed to parse studyPlans', error);
      return;
    }
    const updated = nextPlans.map((plan) =>
      plan.id === planId ? { ...plan, completed: !plan.completed } : plan
    );
    localStorage.setItem('studyPlans', JSON.stringify(updated));
    const filtered = updated.filter((plan) => plan.date === todayKey);
    setTodayPlans(filtered);
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
  };

  // Calculate progress
  const progress = isRunning
    ? ((initialMinutes * 60 - (minutes * 60 + seconds)) / (initialMinutes * 60)) * 100
    : (() => {
        // When not running, show progress based on current time setting (1-60 minutes)
        const minTime = 1;
        const maxTime = 60;
        const timeRange = maxTime - minTime;
        return ((minutes - minTime) / timeRange) * 100;
      })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-4 space-y-6">
      {/* User Info Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-gray-800 text-xl font-bold">哈囉，{user.name}</h2>
            <p className="text-gray-500 text-sm">{user.school}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs">總積分</p>
            <p className="text-orange-500 text-2xl font-bold">{user.totalPoints}</p>
          </div>
        </div>
      </div>

      {/* Quick Start & New Plan Buttons - Only show when not running */}
      {!isRunning && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleQuickStart}
            className="bg-gradient-to-r from-orange-400 to-pink-500 text-white p-6 rounded-3xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            <div className="flex flex-col items-center gap-2">
              <Zap className="w-8 h-8" />
              <span className="font-bold text-lg">快速開始</span>
              <span className="text-xs opacity-90">{initialMinutes} 分鐘</span>
            </div>
          </button>
          <button
            onClick={() => onNavigateToPlanner?.()}
            className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white p-6 rounded-3xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            <div className="flex flex-col items-center gap-2">
              <Target className="w-8 h-8" />
              <span className="font-bold text-lg">新建計畫</span>
              <span className="text-xs opacity-90">規劃學習</span>
            </div>
          </button>
        </div>
      )}

      {/* Timer Section - Always visible */}
      <div className="bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <Timer className="w-12 h-12 text-orange-500 mx-auto mb-2" />
          <h3 className="text-gray-700 font-semibold">
            {isRunning ? '專注中...' : '番茄鐘計時器'}
          </h3>
          {selectedPlanId && (
            <p className="text-sm text-indigo-600 mt-2">
              📚 {todayPlans.find((p) => p.id === selectedPlanId)?.title}
            </p>
          )}
        </div>
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg
            ref={circleRef}
            className="w-full h-full transform -rotate-90"
            style={{ touchAction: 'none', cursor: !isRunning && !hasStarted ? 'grab' : 'default' }}
            onMouseDown={!isRunning && !hasStarted ? handleDragStart : undefined}
            onTouchStart={!isRunning && !hasStarted ? handleDragStart : undefined}
          >
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="gradientBright" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#db2777" />
              </linearGradient>
            </defs>


            {/* Background circle */}
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="#fee2e2"
              strokeWidth="12"
              fill="none"
            />

            {/* Progress circle - conditional rendering to avoid CSS conflicts */}
            {isDragging ? (
              /* Dragging state: orange, same thickness */
              <circle
                key="dragging"
                cx="128"
                cy="128"
                r="120"
                fill="none"
                stroke="#f97316"
                strokeWidth={12}
                strokeDasharray={2 * Math.PI * 120}
                strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                strokeLinecap="round"
              />
            ) : (
              <circle
                key="normal"
                cx="128"
                cy="128"
                r="120"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth={12}
                strokeDasharray={2 * Math.PI * 120}
                strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                strokeLinecap="round"
                className={isRunning ? "transition-all duration-1000" : ""}
              />
            )}

            {/* Interactive overlay - larger area for easier dragging */}
            {!isRunning && !hasStarted && (
              <circle
                cx="128"
                cy="128"
                r="130"
                fill="transparent"
                stroke="transparent"
                strokeWidth="30"
                style={{ cursor: isDragging ? 'grabbing' : 'grab', pointerEvents: 'all' }}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
              />
            )}

            {/* Time display using SVG text - no pointer events blocking */}
            <g transform="rotate(90, 128, 128)" style={{ pointerEvents: 'none' }}>
              {/* Main time display */}
              {!isRunning ? (
                <>
                  {/* Only show minutes when not running */}
                  <text
                    x="128"
                    y="115"
                    textAnchor="middle"
                    fontSize="56"
                    fontWeight="bold"
                    fill={isDragging ? "#f97316" : "#1f2937"}
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  >
                    {minutes}
                  </text>
                  <text
                    x="128"
                    y="140"
                    textAnchor="middle"
                    fontSize="16"
                    fill="#6b7280"
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  >
                    分鐘
                  </text>
                  <text
                    x="128"
                    y="158"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#9ca3af"
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  >
                    {isDragging ? '拖動中...' : '拖動圓環調整'}
                  </text>
                </>
              ) : (
                <>
                  {/* Show minutes:seconds when running */}
                  <text
                    x="128"
                    y="120"
                    textAnchor="middle"
                    fontSize="48"
                    fontWeight="bold"
                    fill="#1f2937"
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  >
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                  </text>
                  {/* Points when running */}
                  <text
                    x="128"
                    y="145"
                    textAnchor="middle"
                    fontSize="18"
                    fill="#16a34a"
                    fontWeight="600"
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  >
                    +{pointsEarned}
                  </text>
                </>
              )}
            </g>
          </svg>
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
      </div>

      {/* Today's Plans Section - Moved to bottom */}
      {todayPlans.length > 0 && (
        <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-500" />
              <h3 className="text-gray-800 text-lg font-bold">今日計畫</h3>
            </div>
            <span className="text-sm text-gray-500 bg-indigo-50 px-3 py-1 rounded-full">
              完成 {computePlanPercent(todayPlans)}%
            </span>
          </div>
          <div className="space-y-3">
            {todayPlans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl p-4 border-2 transition-all ${
                  plan.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Manual completion checkbox */}
                  <input
                    type="checkbox"
                    checked={plan.completed}
                    onChange={() => togglePlanCompletion(plan.id)}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-indigo-600 font-semibold">
                        {plan.startTime} - {plan.endTime}
                      </span>
                      {/* 顯示累積進度 */}
                      {plan.targetMinutes && plan.targetMinutes > 0 && (
                        <span className="text-xs text-orange-600 font-semibold">
                          已完成 {plan.completedMinutes || 0}/{plan.targetMinutes} 分鐘
                          {plan.pomodoroCount && plan.pomodoroCount > 0 ? ` (${plan.pomodoroCount}🍅)` : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.subject && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                          {plan.subject}
                        </span>
                      )}
                      <p className={`font-medium ${plan.completed ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                        {plan.title}
                      </p>
                    </div>
                    {plan.location && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{plan.location}</span>
                      </div>
                    )}
                  </div>
                  {!plan.completed && !isRunning && (() => {
                    // 如果計畫有設定目標時長，檢查剩餘時長
                    if (plan.targetMinutes && plan.targetMinutes > 0) {
                      const completedMinutes = plan.completedMinutes || 0;
                      const remainingMinutes = plan.targetMinutes - completedMinutes;

                      // 如果已達成目標時長，不顯示按鈕（應該已自動完成）
                      if (remainingMinutes <= 0) {
                        return null;
                      }

                      // 情況 1：計畫本身剩餘 ≤ 10 分鐘，讓使用者自己決定
                      if (remainingMinutes <= 10) {
                        const isExceeding = minutes > remainingMinutes;
                        return (
                          <button
                            onClick={() => {
                              if (isExceeding) {
                                setConfirmDialog({
                                  show: true,
                                  type: 'warning',
                                  message: `計畫只剩 ${remainingMinutes} 分鐘，確定要啟動 ${minutes} 分鐘的番茄鐘嗎？`,
                                  planId: plan.id,
                                  originalMinutes: minutes,
                                });
                              } else {
                                startTimerWithPlan(plan.id, minutes);
                              }
                            }}
                            className="group relative bg-white border-2 border-indigo-300 hover:border-indigo-500 text-indigo-600 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 px-4 py-2 rounded-full font-medium shadow-md hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
                            title={`開始 ${minutes} 分鐘番茄鐘（計畫剩餘 ${remainingMinutes} 分鐘）`}
                          >
                            <Play className="w-4 h-4" />
                            <span className="text-sm font-bold">{minutes}</span>
                          </button>
                        );
                      }

                      // 情況 2：剩餘 > 10 分鐘，檢查是否會剩下零頭
                      const remainingAfter = remainingMinutes - minutes;

                      // 如果完成後會剩餘 < 10 分鐘（但 > 0），建議一次完成
                      if (remainingAfter > 0 && remainingAfter < 10) {
                        return (
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                show: true,
                                type: 'suggest',
                                message: `完成 ${minutes} 分鐘後會剩 ${remainingAfter} 分鐘零頭，建議一次完成全部 ${remainingMinutes} 分鐘？`,
                                suggestedMinutes: remainingMinutes,
                                planId: plan.id,
                                originalMinutes: minutes,
                              });
                            }}
                            className="group relative bg-white border-2 border-indigo-300 hover:border-indigo-500 text-indigo-600 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 px-4 py-2 rounded-full font-medium shadow-md hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
                            title={`點擊查看建議`}
                          >
                            <Play className="w-4 h-4" />
                            <span className="text-sm font-bold">{minutes}</span>
                          </button>
                        );
                      }

                      // 情況 3：正常情況或會超過很多
                      const isExceeding = minutes > remainingMinutes;
                      return (
                        <button
                          onClick={() => {
                            if (isExceeding) {
                              setConfirmDialog({
                                show: true,
                                type: 'warning',
                                message: `計畫剩餘 ${remainingMinutes} 分鐘，確定要啟動 ${minutes} 分鐘的番茄鐘嗎？`,
                                planId: plan.id,
                                originalMinutes: minutes,
                              });
                            } else {
                              startTimerWithPlan(plan.id, minutes);
                            }
                          }}
                          className="group relative bg-white border-2 border-indigo-300 hover:border-indigo-500 text-indigo-600 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 px-4 py-2 rounded-full font-medium shadow-md hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
                          title={`開始 ${minutes} 分鐘番茄鐘（計畫剩餘 ${remainingMinutes} 分鐘）`}
                        >
                          <Play className="w-4 h-4" />
                          <span className="text-sm font-bold">{minutes}</span>
                        </button>
                      );
                    }

                    // 沒有設定目標時長的計畫：顯示正常按鈕
                    return (
                      <button
                        onClick={() => startTimerWithPlan(plan.id, minutes)}
                        className="group relative bg-white border-2 border-indigo-300 hover:border-indigo-500 text-indigo-600 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 px-4 py-2 rounded-full font-medium shadow-md hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
                        title={`開始 ${minutes} 分鐘番茄鐘（可在上方圓環調整）`}
                      >
                        <Play className="w-4 h-4" />
                        <span className="text-sm font-bold">{minutes}</span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xs w-full pointer-events-auto border-2 border-gray-200">
            {/* Icon & Title */}
            <div className="p-5 text-center">
              <div className="text-4xl mb-2">
                {confirmDialog.type === 'suggest' ? '💡' : '⚠️'}
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-2">
                {confirmDialog.type === 'suggest' ? '建議' : '提醒'}
              </h3>
              <p className="text-gray-600 text-xs leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 flex gap-2">
              {confirmDialog.type === 'suggest' ? (
                <>
                  <button
                    onClick={() => {
                      if (confirmDialog.planId && confirmDialog.suggestedMinutes) {
                        startTimerWithPlan(confirmDialog.planId, confirmDialog.suggestedMinutes);
                      }
                      setConfirmDialog({ show: false, type: 'suggest', message: '' });
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg active:scale-95 transition-all"
                  >
                    {confirmDialog.suggestedMinutes} 分鐘
                  </button>
                  <button
                    onClick={() => {
                      if (confirmDialog.planId && confirmDialog.originalMinutes) {
                        startTimerWithPlan(confirmDialog.planId, confirmDialog.originalMinutes);
                      }
                      setConfirmDialog({ show: false, type: 'suggest', message: '' });
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 active:scale-95 transition-all"
                  >
                    {confirmDialog.originalMinutes} 分鐘
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setConfirmDialog({ show: false, type: 'warning', message: '' });
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 active:scale-95 transition-all"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      if (confirmDialog.planId && confirmDialog.originalMinutes) {
                        startTimerWithPlan(confirmDialog.planId, confirmDialog.originalMinutes);
                      }
                      setConfirmDialog({ show: false, type: 'warning', message: '' });
                    }}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg active:scale-95 transition-all"
                  >
                    確定
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
