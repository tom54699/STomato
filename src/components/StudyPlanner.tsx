import { useEffect, useMemo, useState } from 'react';
import { Calendar, AlarmClockCheck, ListChecks, Trash2, BellRing, ChevronLeft, ChevronRight } from 'lucide-react';
import { User } from '../App';

type StudyPlan = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  location?: string;
  reminderTime: string; // HH:MM（給UI顯示）
  reminderDateTime: string; // YYYY-MM-DDTHH:MM:SS（完整時間戳用於檢查）
  completed: boolean;
  reminderTriggered: boolean;
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

// 生成建議的開始時間選項（排除被占用的時段）
function generateAvailableTimeSlots(plans: StudyPlan[], date: string, durationMinutes: number): string[] {
  const dayPlans = plans.filter(plan => plan.date === date);
  const availableSlots: string[] = [];

  // 從早上7點到晚上10點，每15分鐘一個時段
  for (let hour = 7; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = startMinutes + durationMinutes;

      // 檢查是否超過一天
      if (endMinutes >= 24 * 60) continue;

      // 檢查是否與現有計畫衝突
      let hasConflict = false;
      for (const plan of dayPlans) {
        const planStart = timeToMinutes(plan.startTime);
        const planEnd = timeToMinutes(plan.endTime);

        if (!(endMinutes <= planStart || startMinutes >= planEnd)) {
          hasConflict = true;
          break;
        }
      }

      if (!hasConflict) {
        availableSlots.push(startTime);
      }
    }
  }

  return availableSlots;
}

// 生成時間表以顯示該天的時間段狀態
function generateTimeSlotStatus(plans: StudyPlan[], date: string, durationMinutes: number) {
  const dayPlans = plans.filter(plan => plan.date === date);
  const timeSlots = [];

  // 從早上7點到晚上10點，每15分鐘一個時段
  for (let hour = 7; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = startMinutes + durationMinutes;

      // 檢查是否超過一天
      if (endMinutes >= 24 * 60) {
        continue;
      }

      // 找衝突的計畫
      let conflictingPlan: StudyPlan | null = null;
      for (const plan of dayPlans) {
        const planStart = timeToMinutes(plan.startTime);
        const planEnd = timeToMinutes(plan.endTime);

        if (!(endMinutes <= planStart || startMinutes >= planEnd)) {
          conflictingPlan = plan;
          break;
        }
      }

      timeSlots.push({
        time: startTime,
        available: !conflictingPlan,
        conflictingPlan: conflictingPlan,
      });
    }
  }

  return timeSlots;
}


export function StudyPlanner({ user }: StudyPlannerProps) {
  const today = formatDate(new Date());
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [form, setForm] = useState({ title: '', date: today, start: '19:00', duration: 90, reminder: '19:50', location: '' });
  const [reminderToast, setReminderToast] = useState('');
  const [titleError, setTitleError] = useState('');

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

  // 獲取可用的時間段（僅用於檢測衝突）
  const availableTimeSlots = useMemo(() =>
    generateAvailableTimeSlots(plans, form.date, form.duration),
    [plans, form.date, form.duration]
  );

  // 獲取時間表狀態（用於視覺化顯示）
  const timeSlotStatus = useMemo(() =>
    generateTimeSlotStatus(plans, form.date, form.duration),
    [plans, form.date, form.duration]
  );

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
      date: form.date,
      startTime: form.start,
      endTime: endTime,
      location: form.location.trim() || undefined,
      reminderTime: form.reminder,
      reminderDateTime: reminderDateTime,
      completed: false,
      reminderTriggered: false,
    };
    setPlans([newPlan, ...plans]);
    // 清空表單，保持日期不變，重置提醒時間
    setForm({
      title: '',
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
            <label className="text-sm text-gray-500">學習時長</label>
            <select
              className="w-full rounded-2xl border border-gray-200 px-3 py-2"
              value={form.duration}
              onChange={(event) => setForm((prev) => ({ ...prev, duration: Number(event.target.value) }))}
            >
              <option value={30}>30分鐘</option>
              <option value={45}>45分鐘</option>
              <option value={60}>1小時</option>
              <option value={90}>1.5小時</option>
              <option value={120}>2小時</option>
              <option value={150}>2.5小時</option>
              <option value={180}>3小時</option>
            </select>
          </div>

          {/* 開始時間下拉選單 */}
          <div>
            <label className="text-sm text-gray-500">選擇開始時間</label>
            <select
              className="w-full rounded-2xl border border-gray-200 px-3 py-2"
              value={form.start}
              onChange={(event) => setForm((prev) => ({ ...prev, start: event.target.value }))}
            >
              <option value="">-- 請選擇開始時間 --</option>
              {timeSlotStatus.map((slot) => (
                <option key={slot.time} value={slot.time} disabled={!slot.available}>
                  {slot.time}
                  {!slot.available && ` (與${slot.conflictingPlan?.title}衝突)`}
                </option>
              ))}
            </select>
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
          {form.start && form.duration && !availableTimeSlots.includes(form.start) && (
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
            disabled={!form.title.trim() || !form.start || !availableTimeSlots.includes(form.start)}
            className={`py-3 rounded-2xl shadow-lg font-semibold transition-all ${
              !form.title.trim() || !form.start || !availableTimeSlots.includes(form.start)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-xl hover:scale-105 active:scale-95'
            }`}
          >
            {!form.start ? '請選擇開始時間' : !availableTimeSlots.includes(form.start) ? '請選擇可用時段' : '加入計畫'}
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
          selectedPlans.map((plan) => (
            <div key={plan.id} className="flex gap-4 items-stretch">
              <div className="flex flex-col items-center w-16">
                <span className="text-xs text-gray-500">{plan.startTime}</span>
                <div className="flex-1 w-px bg-gray-200 my-2"></div>
                <span className="text-xs text-gray-500">{plan.endTime}</span>
              </div>
              <article
                className={`flex-1 border rounded-2xl p-4 flex items-center gap-3 ${
                  plan.completed ? 'border-green-200 bg-green-50' : 'border-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={plan.completed}
                  onChange={() => toggleCompleted(plan.id)}
                  className="w-5 h-5"
                />
                <div className="flex-1">
                  <h4 className={`font-semibold ${plan.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {plan.title}
                  </h4>
                <p className="text-sm text-gray-500">
                    {plan.startTime} - {plan.endTime}
                    {plan.location ? ` · ${plan.location}` : ''} · 提醒 {plan.reminderTime}
                </p>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <button
                    className="text-blue-500"
                    onClick={() => {
                      // 計算時長
                      const startMinutes = timeToMinutes(plan.startTime);
                      const endMinutes = timeToMinutes(plan.endTime);
                      const duration = endMinutes - startMinutes;

                      setForm((prev) => ({
                        ...prev,
                        title: plan.title,
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
                  <button className="text-gray-400" onClick={() => removePlan(plan.id)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </article>
            </div>
          ))
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
    </div>
  );
}
