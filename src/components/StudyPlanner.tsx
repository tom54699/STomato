import { useEffect, useMemo, useState } from 'react';
import { Calendar, AlarmClockCheck, ListChecks, Trash2, BellRing, ChevronLeft, ChevronRight, ChevronDown, Check, MapPin } from 'lucide-react';
import { User } from '../App';
import * as Select from '@radix-ui/react-select';

type StudyPlan = {
  id: string;
  title: string;
  subject?: string; // 科目分類（選填）- NEW
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  location?: string;
  reminderTime: string; // HH:MM（給UI顯示）
  reminderDateTime: string; // YYYY-MM-DDTHH:MM:SS（完整時間戳用於檢查）
  completed: boolean;
  reminderTriggered: boolean;
  targetMinutes?: number; // 計畫總時長（分鐘）- 用於累積追蹤
  completedMinutes?: number; // 已完成時長（分鐘）
  pomodoroCount?: number; // 完成的番茄鐘數量
};

type StudyPlannerProps = {
  user: User;
};

const weekdayLabel = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function getWeekStart(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

// 時間格式轉換輔助函數
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// 計算結束時間
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  return minutesToTime(endMinutes);
}

// 建議提醒時間（用戶可以覆蓋）- 返回 HH:MM 給 UI 顯示
function suggestReminderTime(startTime: string): string {
  const startMinutes = timeToMinutes(startTime);
  const reminderMinutes = Math.max(0, startMinutes - 10); // 開始前10分鐘
  return minutesToTime(reminderMinutes);
}

// 計算完整的提醒日期時間 - 處理跨日情況
function calculateReminderDateTime(date: string, startTime: string): string {
  const startMinutes = timeToMinutes(startTime);
  let reminderMinutes = startMinutes - 10;
  let reminderDate = date;

  // 如果提醒時間變成負數，改到前一天
  if (reminderMinutes < 0) {
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 1);
    reminderDate = formatDate(prevDate);
    reminderMinutes = 24 * 60 + reminderMinutes; // 轉換為前一天的時間
  }

  const reminderTime = minutesToTime(reminderMinutes);
  return `${reminderDate}T${reminderTime}:00`;
}

export function StudyPlanner({ user }: StudyPlannerProps) {
  const today = formatDate(new Date());
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [form, setForm] = useState({ title: '', subject: '', date: today, start: '19:00', duration: 90, reminder: '19:50', location: '' });
  const [reminderToast, setReminderToast] = useState('');
  const [titleError, setTitleError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    planId: string;
    planTitle: string;
    hasData: boolean;
  }>({ show: false, planId: '', planTitle: '', hasData: false });

  useEffect(() => {
    const saved = localStorage.getItem('studyPlans');
    if (saved) {
      try {
        setPlans(JSON.parse(saved) as StudyPlan[]);
      } catch (error) {
        console.warn('Failed to parse study plans', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('studyPlans', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let message = '';
      setPlans((prev) =>
        prev.map((plan) => {
          if (plan.completed || plan.reminderTriggered || !plan.reminderDateTime) return plan;

          // 直接用完整的 reminderDateTime 比較，無需考慮日期
          const reminderMoment = new Date(plan.reminderDateTime);

          if (now >= reminderMoment) {
            if (!message) {
              message = `該開始 ${plan.title} 了！`;
            }
            return { ...plan, reminderTriggered: true };
          }
          return plan;
        })
      );
      if (message) {
        setReminderToast(message);
        setTimeout(() => setReminderToast(''), 4000);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return {
        label: weekdayLabel[index],
        date,
        dateString: formatDate(date),
      };
    });
  }, [weekStart]);

  const selectedPlans = useMemo(() => plans.filter((plan) => plan.date === selectedDate), [plans, selectedDate]);

  // 檢查特定時間是否與計畫衝突的通用函數
  const checkTimeConflict = (timeStr: string, duration: number, date: string) => {
    const startMinutes = timeToMinutes(timeStr);
    const endMinutes = startMinutes + duration;
    const dayPlans = plans.filter(plan => plan.date === date);

    return dayPlans.some(plan => {
      const planStart = timeToMinutes(plan.startTime);
      const planEnd = timeToMinutes(plan.endTime);
      return !(endMinutes <= planStart || startMinutes >= planEnd);
    });
  };

  // 檢查某個小時是否應該被禁用（所有分鐘選項都衝突）
  const isHourDisabled = useMemo(() => {
    const disabledHours = new Set<number>();
    const minutes = [0, 15, 30, 45];

    for (let hour = 7; hour <= 22; hour++) {
      const allMinutesConflict = minutes.every(minute => {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        return checkTimeConflict(timeStr, form.duration, form.date);
      });

      if (allMinutesConflict) {
        disabledHours.add(hour);
      }
    }

    return disabledHours;
  }, [plans, form.date, form.duration]);

  // 檢查某個分鐘是否應該被禁用
  const isMinuteDisabled = (minute: number) => {
    if (!form.start) return false;
    const hour = form.start.split(':')[0];
    const timeStr = `${hour}:${minute.toString().padStart(2, '0')}`;
    return checkTimeConflict(timeStr, form.duration, form.date);
  };

  // 檢查所選時間是否與現有計畫衝突
  const isTimeAvailable = useMemo(() => {
    if (!form.start) return false;
    return !checkTimeConflict(form.start, form.duration, form.date);
  }, [plans, form.date, form.start, form.duration]);

  // 提取歷史科目（用於 datalist 自動建議）
  const historicalSubjects = useMemo(() => {
    const subjects = new Set<string>();
    plans.forEach(plan => {
      if (plan.subject && plan.subject.trim()) {
        subjects.add(plan.subject.trim());
      }
    });
    return Array.from(subjects).sort();
  }, [plans]);

  // 當開始時間變化時，自動建議提醒時間
  useEffect(() => {
    if (form.start) {
      const suggestedReminder = suggestReminderTime(form.start);
      setForm(prev => ({ ...prev, reminder: suggestedReminder }));
    }
  }, [form.start]);

  // 清除標題錯誤當用戶開始輸入
  useEffect(() => {
    if (form.title.trim() && titleError) {
      setTitleError('');
    }
  }, [form.title, titleError]);


  const addPlan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 表單驗證
    if (!form.title.trim()) {
      setTitleError('請輸入計畫標題');
      return;
    }
    setTitleError('');

    const endTime = calculateEndTime(form.start, form.duration);
    const reminderDateTime = calculateReminderDateTime(form.date, form.start);

    const newPlan: StudyPlan = {
      id: `plan-${Date.now()}`,
      title: form.title.trim(),
      subject: form.subject.trim() || undefined, // 科目（選填）
      date: form.date,
      startTime: form.start,
      endTime: endTime,
      location: form.location.trim() || undefined,
      reminderTime: form.reminder,
      reminderDateTime: reminderDateTime,
      completed: false,
      reminderTriggered: false,
      targetMinutes: form.duration, // 計畫總時長
      completedMinutes: 0, // 已完成時長初始為0
      pomodoroCount: 0, // 番茄鐘數量初始為0
    };
    setPlans([newPlan, ...plans]);
    // 清空表單，保持日期不變，重置提醒時間
    setForm({
      title: '',
      subject: '',
      date: form.date,
      start: '19:00',
      duration: 90,
      reminder: suggestReminderTime('19:00'),
      location: ''
    });
    setSelectedDate(form.date);
  };

  const toggleCompleted = (planId: string) => {
    setPlans((prev) =>
      prev.map((plan) =>
        plan.id === planId
          ? { ...plan, completed: !plan.completed, reminderTriggered: true }
          : plan
      )
    );
  };

  const handleDeleteClick = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    // 檢查是否已完成或有執行過番茄鐘
    const hasData = plan.completed || (plan.pomodoroCount && plan.pomodoroCount > 0) || false;

    if (hasData) {
      setDeleteConfirm({
        show: true,
        planId,
        planTitle: plan.title,
        hasData: true,
      });
    } else {
      // 直接刪除
      removePlan(planId);
    }
  };

  const removePlan = (planId: string) => {
    setPlans((prev) => prev.filter((plan) => plan.id !== planId));
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    setWeekStart((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() + (direction === 'prev' ? -7 : 7));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50 p-4 space-y-5">
      <header className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-10 h-10 text-blue-500" />
          <div>
            <p className="text-gray-500 text-sm">讀書計畫</p>
            <h1 className="text-gray-800 text-xl">規劃你的專注週</h1>
          </div>
        </div>
        <p className="text-gray-500 mt-2 text-sm">{user.name} · {user.school}</p>
      </header>

      <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => changeWeek('prev')} className="p-2 rounded-full border border-gray-200">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-gray-700 font-semibold">
            {weekDays[0].date.getMonth() + 1}月 {weekDays[0].date.getDate()} 日 - {weekDays[6].date.getMonth() + 1}月 {weekDays[6].date.getDate()} 日
          </div>
          <button onClick={() => changeWeek('next')} className="p-2 rounded-full border border-gray-200">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center">
          {weekDays.map((day, index) => {
            const dayPlans = plans.filter((plan) => plan.date === day.dateString);
            const isSelected = selectedDate === day.dateString;
            return (
              <button
                key={day.dateString}
                onClick={() => setSelectedDate(day.dateString)}
                className={`rounded-2xl border px-2 py-3 space-y-1 ${
                  isSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-100'
                }`}
              >
                <p className="text-xs text-gray-500">{day.label}</p>
                <p className="text-gray-800 text-lg">{day.date.getDate()}</p>
                <p className="text-xs text-gray-400">{dayPlans.length} 項</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-indigo-500" />
          <h2 className="text-gray-800">新增計畫</h2>
        </div>
        <form className="grid gap-3" onSubmit={addPlan}>
          <div>
            <input
              className={`w-full rounded-2xl border px-4 py-3 ${
                titleError ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              placeholder="例如：英文單字第 4 節"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            />
            {titleError && (
              <p className="text-red-500 text-sm mt-1">{titleError}</p>
            )}
          </div>
          <div>
            <input
              list="subject-suggestions"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3"
              placeholder="科目（選填，例如微積分、英文）"
              value={form.subject}
              onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
            />
            <datalist id="subject-suggestions">
              {historicalSubjects.map((subject) => (
                <option key={subject} value={subject} />
              ))}
            </datalist>
            <p className="text-xs text-gray-500 mt-1">💡 填寫科目可獲得更精準的學習分析</p>
          </div>
          <input
            className="rounded-2xl border border-gray-200 px-4 py-3"
            placeholder="地點（可選，例如圖書館 3F）"
            value={form.location}
            onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
          />

          <div>
            <label className="text-sm text-gray-500">日期</label>
            <input
              type="date"
              className="w-full rounded-2xl border border-gray-200 px-3 py-2"
              value={form.date}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, date: event.target.value }));
                setSelectedDate(event.target.value);
              }}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
              <span className="text-blue-500">⏱️</span>
              學習時長
            </label>
            <Select.Root
              value={form.duration.toString()}
              onValueChange={(value) => setForm((prev) => ({ ...prev, duration: Number(value) }))}
            >
              <Select.Trigger className="flex items-center justify-between w-full rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 text-gray-800 font-medium shadow-sm hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer">
                <Select.Value />
                <Select.Icon>
                  <ChevronDown className="w-4 h-4" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="overflow-hidden bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                  <Select.Viewport className="p-1">
                    {[
                      { value: 30, label: '⏰ 30 分鐘' },
                      { value: 45, label: '⏰ 45 分鐘' },
                      { value: 60, label: '⏰ 1 小時' },
                      { value: 90, label: '⏰ 1.5 小時' },
                      { value: 120, label: '⏰ 2 小時' },
                      { value: 150, label: '⏰ 2.5 小時' },
                      { value: 180, label: '⏰ 3 小時' },
                    ].map(option => (
                      <Select.Item
                        key={option.value}
                        value={option.value.toString()}
                        className="relative flex items-center px-8 py-2 rounded-lg text-sm text-gray-800 cursor-pointer hover:bg-blue-50 focus:bg-blue-50 outline-none"
                      >
                        <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                          <Check className="w-4 h-4 text-blue-600" />
                        </Select.ItemIndicator>
                        <Select.ItemText>{option.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          {/* 開始時間：兩階段選擇 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
              <span className="text-green-500">🕐</span>
              選擇開始時間
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* 小時選擇 */}
              <Select.Root
                value={form.start ? form.start.split(':')[0] : ''}
                onValueChange={(hour) => {
                  const minute = form.start ? form.start.split(':')[1] : '00';
                  setForm((prev) => ({ ...prev, start: hour ? `${hour}:${minute}` : '' }));
                }}
              >
                <Select.Trigger className="flex items-center justify-between rounded-2xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 text-gray-800 font-medium shadow-sm hover:border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all cursor-pointer">
                  <Select.Value placeholder="小時" />
                  <Select.Icon>
                    <ChevronDown className="w-4 h-4" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="overflow-hidden bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                    <Select.Viewport className="p-1">
                      {Array.from({ length: 16 }, (_, i) => i + 7).map(hour => (
                        <Select.Item
                          key={hour}
                          value={hour.toString().padStart(2, '0')}
                          disabled={isHourDisabled.has(hour)}
                          className="relative flex items-center px-8 py-2 rounded-lg text-sm text-gray-800 cursor-pointer hover:bg-green-50 focus:bg-green-50 outline-none data-[disabled]:text-gray-400 data-[disabled]:cursor-not-allowed data-[disabled]:hover:bg-transparent"
                        >
                          <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                            <Check className="w-4 h-4 text-green-600" />
                          </Select.ItemIndicator>
                          <Select.ItemText>{hour}:00</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>

              {/* 分鐘選擇 */}
              <Select.Root
                value={form.start ? form.start.split(':')[1] : ''}
                onValueChange={(minute) => {
                  const hour = form.start ? form.start.split(':')[0] : '19';
                  setForm((prev) => ({ ...prev, start: `${hour}:${minute}` }));
                }}
                disabled={!form.start || !form.start.split(':')[0]}
              >
                <Select.Trigger className="flex items-center justify-between rounded-2xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 text-gray-800 font-medium shadow-sm hover:border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  <Select.Value placeholder="分鐘" />
                  <Select.Icon>
                    <ChevronDown className="w-4 h-4" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="overflow-hidden bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                    <Select.Viewport className="p-1">
                      {[0, 15, 30, 45].map(minute => (
                        <Select.Item
                          key={minute}
                          value={minute.toString().padStart(2, '0')}
                          disabled={isMinuteDisabled(minute)}
                          className="relative flex items-center px-8 py-2 rounded-lg text-sm text-gray-800 cursor-pointer hover:bg-green-50 focus:bg-green-50 outline-none data-[disabled]:text-gray-400 data-[disabled]:cursor-not-allowed data-[disabled]:hover:bg-transparent"
                        >
                          <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                            <Check className="w-4 h-4 text-green-600" />
                          </Select.ItemIndicator>
                          <Select.ItemText>{minute.toString().padStart(2, '0')} 分</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-500">提醒時間</label>
            <input
              type="time"
              className="w-full rounded-2xl border border-gray-200 px-3 py-2"
              value={form.reminder}
              onChange={(event) => setForm((prev) => ({ ...prev, reminder: event.target.value }))}
            />
          </div>

          {/* 計算後的時間顯示 */}
          {form.start && form.duration && (
            <div className="bg-gray-50 rounded-2xl p-3 text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <span>結束時間：</span>
                <span className="font-semibold">{calculateEndTime(form.start, form.duration)}</span>
              </div>
            </div>
          )}

          {/* 時間衝突檢查提示 */}
          {form.start && form.duration && !isTimeAvailable && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm">
              <div className="text-red-700 font-semibold">
                ⚠️ 此時段與現有計畫衝突！
              </div>
              <p className="text-red-600 text-xs mt-1">
                請選擇其他可用時段
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!form.title.trim() || !form.start || !isTimeAvailable}
            className={`py-3 rounded-2xl shadow-lg font-semibold transition-all ${
              !form.title.trim() || !form.start || !isTimeAvailable
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-xl hover:scale-105 active:scale-95'
            }`}
          >
            {!form.start ? '請選擇開始時間' : !isTimeAvailable ? '請選擇可用時段' : '加入計畫'}
          </button>
        </form>
      </section>

      <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlarmClockCheck className="w-5 h-5 text-emerald-500" />
          <h2 className="text-gray-800">{selectedDate === today ? '今日' : ''}計畫</h2>
        </div>
        {selectedPlans.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">這天還沒有任務，趕緊安排吧！</p>
        ) : (
          <div className="space-y-3">
            {selectedPlans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl p-4 transition-all ${
                  plan.completed
                    ? 'bg-green-50/50'
                    : 'bg-gray-50/50'
                } hover:shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={plan.completed}
                    onChange={() => toggleCompleted(plan.id)}
                    className="mt-0.5 w-5 h-5 rounded border-gray-300 flex-shrink-0"
                  />

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    {/* Header: Title + Subject */}
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold text-base ${plan.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {plan.title}
                        </h4>
                        {plan.subject && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium flex-shrink-0">
                            {plan.subject}
                          </span>
                        )}
                      </div>

                      {/* Time */}
                      <p className="text-sm text-gray-500">
                        {plan.startTime} - {plan.endTime}
                      </p>
                    </div>

                    {/* Additional info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      {plan.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {plan.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <BellRing className="w-3 h-3" />
                        {plan.reminderTime}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      onClick={() => {
                        const startMinutes = timeToMinutes(plan.startTime);
                        const endMinutes = timeToMinutes(plan.endTime);
                        const duration = endMinutes - startMinutes;

                        setForm((prev) => ({
                          ...prev,
                          title: plan.title,
                          subject: plan.subject || '',
                          date: plan.date,
                          start: plan.startTime,
                          duration: duration,
                          reminder: plan.reminderTime || suggestReminderTime(plan.startTime),
                          location: plan.location || ''
                        }));
                        setSelectedDate(plan.date);
                      }}
                    >
                      編輯
                    </button>
                    <button
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      onClick={() => handleDeleteClick(plan.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {reminderToast && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center">
          <div className="bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2">
            <BellRing className="w-5 h-5" />
            <span>{reminderToast}</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-6 pointer-events-none">
          <div className="bg-white rounded-2xl shadow-xl pointer-events-auto w-64 border border-gray-300">
            {/* Content */}
            <div className="p-5 text-center">
              <p className="text-gray-900 font-semibold mb-1 text-sm">
                刪除「{deleteConfirm.planTitle}」？
              </p>
              {deleteConfirm.hasData && (
                <p className="text-red-600 text-xs mt-2">
                  已有記錄將一併刪除
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 flex">
              <button
                onClick={() => {
                  setDeleteConfirm({ show: false, planId: '', planTitle: '', hasData: false });
                }}
                className="flex-1 py-3 text-gray-600 font-medium text-sm border-r border-gray-200 hover:bg-gray-50 active:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={() => {
                  removePlan(deleteConfirm.planId);
                  setDeleteConfirm({ show: false, planId: '', planTitle: '', hasData: false });
                }}
                className="flex-1 py-3 text-red-600 font-semibold text-sm hover:bg-gray-50 active:bg-gray-100"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
