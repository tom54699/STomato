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
  reminderTime: string; // HH:MM
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

// 計算結束時間和提醒時間
function calculateTimes(startTime: string, durationMinutes: number): { endTime: string; reminderTime: string } {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  const reminderMinutes = Math.max(startMinutes, endMinutes - 10); // 提前10分鐘提醒，但不早於開始時間

  return {
    endTime: minutesToTime(endMinutes),
    reminderTime: minutesToTime(reminderMinutes)
  };
}

// 檢查時間衝突
function checkTimeConflicts(plans: StudyPlan[], date: string, startTime: string, durationMinutes: number): string[] {
  const conflicts: string[] = [];
  const dayPlans = plans.filter(plan => plan.date === date);

  const newStart = timeToMinutes(startTime);
  const newEnd = newStart + durationMinutes;

  dayPlans.forEach(plan => {
    const planStart = timeToMinutes(plan.startTime);
    const planEnd = timeToMinutes(plan.endTime);

    // 檢查是否有重疊
    if (!(newEnd <= planStart || newStart >= planEnd)) {
      conflicts.push(`與「${plan.title}」(${plan.startTime}-${plan.endTime}) 時間重疊`);
    }
  });

  return conflicts;
}


export function StudyPlanner({ user }: StudyPlannerProps) {
  const today = formatDate(new Date());
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [form, setForm] = useState({ title: '', date: today, start: '19:00', duration: 90, location: '' });
  const [reminderToast, setReminderToast] = useState('');
  const [timeConflicts, setTimeConflicts] = useState<string[]>([]);

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
          if (plan.completed || plan.reminderTriggered || !plan.reminderTime) return plan;
          if (plan.date !== formatDate(now)) return plan;
          const reminderMoment = new Date(`${plan.date}T${plan.reminderTime}`);
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

  // 檢查時間衝突
  useEffect(() => {
    if (form.start && form.duration && form.date) {
      const conflicts = checkTimeConflicts(plans, form.date, form.start, form.duration);
      setTimeConflicts(conflicts);
    }
  }, [plans, form.start, form.duration, form.date]);


  const addPlan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || timeConflicts.length > 0) return;

    const { endTime, reminderTime } = calculateTimes(form.start, form.duration);

    const newPlan: StudyPlan = {
      id: `plan-${Date.now()}`,
      title: form.title.trim(),
      date: form.date,
      startTime: form.start,
      endTime: endTime,
      location: form.location.trim() || undefined,
      reminderTime: reminderTime,
      completed: false,
      reminderTriggered: false,
    };
    setPlans([newPlan, ...plans]);
    // 清空表單，保持日期不變
    setForm({ title: '', date: form.date, start: '19:00', duration: 90, location: '' });
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
          <input
            className="rounded-2xl border border-gray-200 px-4 py-3"
            placeholder="例如：英文單字第 4 節"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          />
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

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="text-sm text-gray-500">開始時間</label>
              <input
                type="time"
                className={`w-full rounded-2xl border px-3 py-2 ${
                  timeConflicts.length > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
                value={form.start}
                onChange={(event) => setForm((prev) => ({ ...prev, start: event.target.value }))}
              />
            </div>
          </div>

          {/* 計算後的時間顯示 */}
          {form.start && form.duration && (
            <div className="bg-gray-50 rounded-2xl p-3 text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <span>結束時間：</span>
                <span className="font-semibold">{calculateTimes(form.start, form.duration).endTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>提醒時間：</span>
                <span className="font-semibold">{calculateTimes(form.start, form.duration).reminderTime}</span>
              </div>
            </div>
          )}

          {/* 時間衝突警告 */}
          {timeConflicts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <span className="text-sm font-semibold">⚠️ 時間衝突</span>
              </div>
              {timeConflicts.map((conflict, index) => (
                <p key={index} className="text-sm text-red-600">{conflict}</p>
              ))}
              <p className="text-xs text-red-500 mt-2">請調整開始時間或學習時長</p>
            </div>
          )}

          <button
            type="submit"
            disabled={timeConflicts.length > 0}
            className={`py-3 rounded-2xl shadow-lg font-semibold transition-all ${
              timeConflicts.length > 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-xl'
            }`}
          >
            {timeConflicts.length > 0 ? '請先解決時間衝突' : '加入計畫'}
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
                        location: plan.location || ''
                      }));
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
