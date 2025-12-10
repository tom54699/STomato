import { useState, useEffect } from 'react';
import { Calendar, Plus, X, ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';
import * as Select from '@radix-ui/react-select';

type ClassItem = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  location: string;
  day: number;
  color: string;
  type: 'class';
};

type TodoItem = {
  id: string;
  title: string;
  courseId?: string; // 關聯課程 ID
  courseName?: string; // 關聯的課程名稱（來自課表）
  date: string; // YYYY-MM-DD
  todoType: 'homework' | 'exam' | 'memo';
  completed: boolean;
  type: 'todo';
};

type CalendarItem = ClassItem | TodoItem;

const WEEKDAYS = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
const WEEKDAYS_SHORT = ['一', '二', '三', '四', '五', '六', '日'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];
const COLORS = [
  'bg-red-400',
  'bg-orange-400',
  'bg-amber-400',
  'bg-yellow-400',
  'bg-lime-400',
  'bg-green-400',
  'bg-teal-400',
  'bg-cyan-400',
  'bg-blue-400', 
  'bg-indigo-400',
  'bg-purple-400',
  'bg-pink-400',
];

const TODO_COLORS = {
  homework: 'bg-blue-500',
  exam: 'bg-red-500',
  memo: 'bg-green-500',
};

const TODO_LABELS = {
  homework: '作業',
  exam: '考試',
  memo: '備忘',
};

const DEFAULT_CLASSES: ClassItem[] = [
  {
    id: '1',
    name: '微積分',
    startTime: '08:00',
    endTime: '10:00',
    location: '普通教室 101',
    day: 0,
    color: 'bg-blue-400',
    type: 'class'
  },
  {
    id: '2',
    name: '英文',
    startTime: '10:00',
    endTime: '12:00',
    location: '語言教室 205',
    day: 0,
    color: 'bg-green-400',
    type: 'class'
  },
  {
    id: '3',
    name: '物理',
    startTime: '13:00',
    endTime: '15:00',
    location: '實驗室 A',
    day: 1,
    color: 'bg-red-400',
    type: 'class'
  },
  {
    id: '4',
    name: '程式設計',
    startTime: '09:00',
    endTime: '12:00',
    location: '電腦教室 B',
    day: 3,
    color: 'bg-purple-400',
    type: 'class'
  },
  {
    id: '5',
    name: '體育',
    startTime: '14:00',
    endTime: '16:00',
    location: '體育館',
    day: 4,
    color: 'bg-red-400',
    type: 'class'
  },
];

const DEFAULT_TODOS: TodoItem[] = [
  { id: 't1', title: '微積分習題 3-5', date: '2025-11-30', todoType: 'homework', completed: false, type: 'todo', courseName: '微積分', courseId: '1' },
  { id: 't2', title: '物理期中考', date: '2025-12-05', todoType: 'exam', completed: false, type: 'todo', courseName: '物理', courseId: '3' },
  { id: 't3', title: '準備專題報告', date: '2025-12-01', todoType: 'memo', completed: false, type: 'todo', courseName: '程式設計', courseId: '4' },
];

export function Schedule() {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<'class' | 'todo'>('class');
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  const [newClass, setNewClass] = useState({
    name: '',
    startTime: '08:00',
    endTime: '10:00',
    location: '',
    day: 0,
    color: COLORS[0],
  });

  const [newTodo, setNewTodo] = useState({
    title: '',
    courseId: '',
    courseName: '',
    date: '',
    todoType: 'homework' as 'homework' | 'exam' | 'memo',
  });

  // 初始化和持久化
  useEffect(() => {
    const savedClasses = localStorage.getItem('scheduleClasses');
    const savedTodos = localStorage.getItem('scheduleTodos');

    if (savedClasses) {
      try {
        const loadedClasses = JSON.parse(savedClasses);
        setClasses(loadedClasses);
      } catch (error) {
        console.warn('Failed to parse scheduleClasses', error);
        setClasses(DEFAULT_CLASSES);
      }
    } else {
      setClasses([]);
    }

    if (savedTodos) {
      try {
        setTodos(JSON.parse(savedTodos));
      } catch (error) {
        console.warn('Failed to parse scheduleTodos', error);
        setTodos(DEFAULT_TODOS);
      }
    } else {
      setTodos([]);
    }
  }, []);

  // 保存課程到 localStorage
  useEffect(() => {
    if (classes.length > 0) {
      localStorage.setItem('scheduleClasses', JSON.stringify(classes));
    }
  }, [classes]);

  // 保存待辦事項到 localStorage
  useEffect(() => {
    if (todos.length > 0) {
      localStorage.setItem('scheduleTodos', JSON.stringify(todos));
    }
  }, [todos]);

  // 獲取當週的日期範圍
  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? -6 : 1 - day; // 調整為週一開始
    startOfWeek.setDate(startOfWeek.getDate() + diff);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // 獲取當月的日期網格
  const getMonthDates = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const dates = [];
    
    // 填充上月日期
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(firstDay);
      date.setDate(date.getDate() - i - 1);
      dates.push({ date, isCurrentMonth: false });
    }
    
    // 當月日期
    for (let i = 1; i <= lastDay.getDate(); i++) {
      dates.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // 填充下月日期
    const remaining = 42 - dates.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(lastDay);
      date.setDate(lastDay.getDate() + i);
      dates.push({ date, isCurrentMonth: false });
    }
    
    return dates;
  };

  const handleAddClass = () => {
    if (!newClass.name || !newClass.location) return;
    if (newClass.startTime >= newClass.endTime) {
      alert('結束時間必須晚於開始時間');
      return;
    }
    if (classes.some(cls => cls.name === newClass.name)) {
      alert('已有同名課程，請更換名稱或直接編輯既有課程');
      return;
    }
    const tempClass: ClassItem = {
      id: 'temp',
      name: newClass.name,
      startTime: newClass.startTime,
      endTime: newClass.endTime,
      location: newClass.location,
      day: newClass.day,
      color: '',
      type: 'class',
    };
    if (isClassConflict(tempClass)) {
      alert('同一天已有重疊時段的課程，請調整時間');
      return;
    }
    const classItem: ClassItem = {
      id: Date.now().toString(),
      ...newClass,
      color: newClass.color,
      type: 'class',
    };
    setClasses([...classes, classItem]);
    setNewClass({ name: '', startTime: '08:00', endTime: '10:00', location: '', day: 0, color: newClass.color });
    setShowAddForm(false);
  };

  const handleAddTodo = () => {
    if (!newTodo.title || !newTodo.date) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(newTodo.date);
    targetDate.setHours(0, 0, 0, 0);
    if (targetDate.getTime() < today.getTime()) {
      alert('待辦日期不可早於今天');
      return;
    }
    const todoItem: TodoItem = {
      id: Date.now().toString(),
      ...newTodo,
      completed: false,
      type: 'todo',
    };
    setTodos([...todos, todoItem]);
    setNewTodo({ title: '', courseId: '', courseName: '', date: '', todoType: 'homework' });
    setShowAddForm(false);
  };

  const handleDelete = (item: CalendarItem) => {
    if (item.type === 'class') {
      setClasses(classes.filter((c) => c.id !== item.id));
    } else {
      setTodos(todos.filter((t) => t.id !== item.id));
    }
    setSelectedItem(null);
    setEditingClass(null);
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const getTodosForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return todos.filter((t) => t.date === dateStr);
  };

  const getClassPosition = (classItem: ClassItem) => {
    const startHour = parseInt(classItem.startTime.split(':')[0]);
    const startMinute = parseInt(classItem.startTime.split(':')[1]);
    const endHour = parseInt(classItem.endTime.split(':')[0]);
    const endMinute = parseInt(classItem.endTime.split(':')[1]);

    const startTotalMinutes = (startHour - 8) * 60 + startMinute;
    const endTotalMinutes = (endHour - 8) * 60 + endMinute;
    const duration = endTotalMinutes - startTotalMinutes;

    const SLOT_HEIGHT = 56; // h-14 = 56px

    return {
      top: (startTotalMinutes / 60) * SLOT_HEIGHT,
      height: (duration / 60) * SLOT_HEIGHT,
    };
  };

  const getDaysUntil = (dateStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const createStudyPlanFromTodo = (todo: TodoItem) => {
    // 創建 StudyPlan 數據並導航到 StudyPlanner 頁面
    const planData = {
      title: todo.title,
      courseId: todo.courseId || '',
      courseName: todo.courseName || '',
      date: todo.date,
      todoType: todo.todoType,
    };
    // 將數據存儲到 localStorage，供 StudyPlanner 讀取
    localStorage.setItem('pendingStudyPlan', JSON.stringify(planData));
    localStorage.setItem('navigateToPlanner', '1');
    window.dispatchEvent(new Event('navigateToPlanner'));
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const updateClassColor = (classId: string, color: string) => {
    setClasses((prev) => {
      const next = prev.map((cls) =>
        cls.id === classId ? { ...cls, color } : cls
      );
      localStorage.setItem('scheduleClasses', JSON.stringify(next));
      const updatedClass = next.find(c => c.id === classId);
      if (updatedClass) propagateCourseEdit(updatedClass);
      // 同步更新 selectedItem
      if (selectedItem && selectedItem.type === 'class' && selectedItem.id === classId) {
        setSelectedItem({ ...selectedItem, color });
      }
      return next;
    });
  };

  const closeModal = () => {
    setSelectedItem(null);
    setEditingClass(null);
  };

  const propagateCourseEdit = (updated: ClassItem) => {
    // 更新待辦的 courseName/courseId
    setTodos((prev) => {
      const next = prev.map((t) =>
        t.courseId === updated.id ? { ...t, courseName: updated.name } : t
      );
      localStorage.setItem('scheduleTodos', JSON.stringify(next));
      return next;
    });
    // 標記需同步到計畫/洞察的暫存
    const pending = {
      id: updated.id,
      name: updated.name,
    };
    localStorage.setItem('pendingCourseUpdate', JSON.stringify(pending));
  };

  // 工具：時間字串轉分鐘
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const isClassConflict = (candidate: ClassItem, excludeId?: string) => {
    return classes.some((cls) => {
      if (excludeId && cls.id === excludeId) return false;
      if (cls.day !== candidate.day) return false;
      const start = timeToMinutes(candidate.startTime);
      const end = timeToMinutes(candidate.endTime);
      const cStart = timeToMinutes(cls.startTime);
      const cEnd = timeToMinutes(cls.endTime);
      return start < cEnd && end > cStart;
    });
  };

  const loadSampleData = () => {
    setClasses(DEFAULT_CLASSES);
    setTodos(DEFAULT_TODOS);
    localStorage.setItem('scheduleClasses', JSON.stringify(DEFAULT_CLASSES));
    localStorage.setItem('scheduleTodos', JSON.stringify(DEFAULT_TODOS));
  };

  const clearScheduleData = () => {
    setClasses([]);
    setTodos([]);
    localStorage.removeItem('scheduleClasses');
    localStorage.removeItem('scheduleTodos');
  };

  const saveEditingClass = () => {
    if (!editingClass) return;
    if (!editingClass.name || !editingClass.location) {
      alert('請填寫課程名稱與地點');
      return;
    }
    if (editingClass.startTime >= editingClass.endTime) {
      alert('結束時間必須晚於開始時間');
      return;
    }
    if (isClassConflict(editingClass, editingClass.id)) {
      alert('與其他課程時段重疊，請調整時間');
      return;
    }
    if (classes.some(cls => cls.id !== editingClass.id && cls.name === editingClass.name)) {
      alert('已有同名課程，請更換名稱');
      return;
    }
    setClasses((prev) => {
      const next = prev.map((cls) => (cls.id === editingClass.id ? editingClass : cls));
      localStorage.setItem('scheduleClasses', JSON.stringify(next));
      propagateCourseEdit(editingClass);
      return next;
    });
    setSelectedItem(editingClass);
    setEditingClass(null);
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      {/* 標題 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-gray-800">行事曆</h1>
              <p className="text-gray-600">課表與待辦事項</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            新增
          </button>
        </div>

        {/* 視圖切換 */}
        <div className="flex gap-2 items-center">
          <div className="flex-1 grid grid-cols-2 gap-2">
            <button
              onClick={() => setView('week')}
              className={`py-2 rounded-xl transition-all ${
                view === 'week'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              週視圖
            </button>
            <button
              onClick={() => setView('month')}
              className={`py-2 rounded-xl transition-all ${
                view === 'month'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              月視圖
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadSampleData}
              className="px-3 py-2 rounded-lg text-xs bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100"
            >
              載入示例
            </button>
            <button
              onClick={clearScheduleData}
              className="px-3 py-2 rounded-lg text-xs bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
            >
              清空
            </button>
          </div>
        </div>

        {(classes.length === 0 && todos.length === 0) && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
            尚未建立課程或待辦，可使用上方「載入示例」快速體驗。
          </div>
        )}
      </div>

      {/* 週視圖 */}
      {view === 'week' && (
        <>
          {/* 週導航 */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-4 flex items-center justify-between">
            <button
              onClick={() => changeWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="text-center">
              <p className="text-gray-800">
                {weekDates[0].getMonth() + 1}月{weekDates[0].getDate()}日 - {weekDates[6].getMonth() + 1}月{weekDates[6].getDate()}日
              </p>
              <p className="text-gray-500 text-sm">{weekDates[0].getFullYear()}年</p>
            </div>
            <button
              onClick={() => changeWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* 星期標題行 */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                  <div className="w-12 flex-shrink-0 p-2 text-center text-gray-500 text-xs sticky left-0 bg-gray-50 z-10">
                    時間
                  </div>
                  <div className="flex-1 grid grid-cols-7">
                  {weekDates.map((date, index) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={index}
                        className={`p-2 text-center ${isToday ? 'bg-blue-100' : ''}`}
                      >
                        <p className={`text-xs ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                          {WEEKDAYS_SHORT[index]}
                        </p>
                        <p className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                          {date.getDate()}
                        </p>
                      </div>
                    );
                  })}
                  </div>
                </div>

                {/* 時間軸和課程網格 */}
                <div className="relative flex">
                  <div className="w-12 flex-shrink-0 bg-gray-50 z-10">
                    {TIME_SLOTS.map((time) => (
                      <div
                        key={time}
                        className="h-14 border-b border-gray-200 flex items-center justify-center text-gray-500 text-xs"
                      >
                        {time}
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 grid grid-cols-7 relative">
                      {weekDates.map((date, dayIndex) => {
                        const isToday = date.toDateString() === new Date().toDateString();
                        return (
                          <div key={dayIndex} className="relative">
                            {TIME_SLOTS.map((time) => (
                              <div
                                key={`${dayIndex}-${time}`}
                                className={`h-14 border-b border-r border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors ${
                                  isToday ? 'bg-blue-50 bg-opacity-30' : ''
                                }`}
                                onClick={() => {
                                  setNewClass({ ...newClass, day: dayIndex, startTime: time });
                                  setAddType('class');
                                  setShowAddForm(true);
                                }}
                              />
                            ))}

                            {/* 渲染該天的課程 */}
                            {classes
                              .filter((c) => c.day === dayIndex)
                              .map((classItem) => {
                                const position = getClassPosition(classItem);
                                return (
                                  <div
                                    key={classItem.id}
                                    className={`absolute left-0.5 right-0.5 ${classItem.color} text-white rounded p-1 shadow-sm hover:shadow-md cursor-pointer transition-all overflow-hidden z-20`}
                                    style={{
                                      top: `${position.top}px`,
                                      height: `${position.height}px`,
                                    }}
                                    onClick={() => {
                                      setSelectedItem(classItem);
                                    }}
                                  >
                                    <p className="font-semibold text-[10px] leading-tight truncate">{classItem.name}</p>
                                    {position.height > 40 && (
                                      <>
                                        <p className="text-[9px] opacity-90 truncate">
                                          {classItem.startTime}-{classItem.endTime}
                                        </p>
                                        <p className="text-[9px] opacity-80 truncate">
                                          {classItem.location}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

            {/* 週視圖下方的待辦事項 */}
            <div className="border-t-4 border-gray-100 p-4">
              <h3 className="text-gray-700 mb-3 flex items-center gap-2">
                <span>📝</span>
                本週待辦事項
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {todos
                  .filter((t) => {
                    const todoDate = new Date(t.date);
                    return todoDate >= weekDates[0] && todoDate <= weekDates[6];
                  })
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((todo) => {
                    const daysUntil = getDaysUntil(todo.date);
                    const isUrgent = daysUntil >= 0 && daysUntil <= 3;
                    return (
                      <div
                        key={todo.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100"
                      >
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => toggleTodo(todo.id)}
                          className="w-5 h-5 rounded accent-blue-500 mt-0.5"
                        />
                        <div className="flex-1">
                          <p className={`text-gray-800 ${todo.completed ? 'line-through opacity-50' : ''}`}>
                            {todo.title}
                          </p>
                          <div className="flex items-center flex-wrap gap-2 mt-1">
                            <span className={`${TODO_COLORS[todo.todoType]} text-white px-2 py-0.5 rounded text-xs`}>
                              {TODO_LABELS[todo.todoType]}
                            </span>
                            <span className="text-xs text-gray-500">{todo.date}</span>
                            {!todo.completed && (
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                daysUntil < 0 ? 'bg-red-100 text-red-600' :
                                isUrgent ? 'bg-orange-100 text-orange-600' :
                                'bg-blue-100 text-blue-600'
                              }`}>
                                {daysUntil < 0 ? `已逾期 ${Math.abs(daysUntil)} 天` :
                                 daysUntil === 0 ? '今天' :
                                 daysUntil === 1 ? '明天' :
                                 `還有 ${daysUntil} 天`}
                              </span>
                            )}
                            {todo.courseName && (
                              <span className="text-xs text-gray-600 flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />
                                {todo.courseName}
                              </span>
                            )}
                          </div>
                          {!todo.completed && (todo.todoType === 'homework' || todo.todoType === 'exam') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                createStudyPlanFromTodo(todo);
                              }}
                              className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                            >
                              <Calendar className="w-3 h-3" />
                              建立學習計畫
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {todos.filter((t) => {
                  const todoDate = new Date(t.date);
                  return todoDate >= weekDates[0] && todoDate <= weekDates[6];
                }).length === 0 && (
                  <p className="text-center text-gray-400 py-4">本週沒有待辦事項</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 月視圖 */}
      {view === 'month' && (
        <>
          {/* 月導航 */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-4 flex items-center justify-between">
            <button
              onClick={() => changeMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="text-center">
              <p className="text-gray-800">
                {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
              </p>
            </div>
            <button
              onClick={() => changeMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* 星期標題 */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {WEEKDAYS_SHORT.map((day) => (
                <div key={day} className="p-3 text-center text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* 日期網格 */}
            <div className="grid grid-cols-7">
              {getMonthDates().map(({ date, isCurrentMonth }, index) => {
                const isToday = date.toDateString() === new Date().toDateString();
                const dayTodos = getTodosForDate(date);
                const dayOfWeek = (date.getDay() + 6) % 7; // 調整為週一=0
                const dayClasses = classes.filter((c) => c.day === dayOfWeek);

                return (
                  <div
                    key={index}
                    className={`min-h-24 border-b border-r border-gray-200 p-2 ${
                      !isCurrentMonth ? 'bg-gray-50' : ''
                    } ${isToday ? 'bg-blue-50' : ''} hover:bg-blue-50 cursor-pointer transition-colors`}
                    onClick={() => {
                      setNewTodo({ ...newTodo, date: date.toISOString().split('T')[0] });
                      setAddType('todo');
                      setShowAddForm(true);
                    }}
                  >
                    <div
                      className={`text-sm mb-1 ${
                        !isCurrentMonth ? 'text-gray-400' : 'text-gray-700'
                      } ${isToday ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}`}
                    >
                      {date.getDate()}
                    </div>

                    {/* 課程小點與計數 */}
                    {isCurrentMonth && dayClasses.length > 0 && (
                      <div className="flex items-center gap-1 mb-1 flex-wrap">
                        {dayClasses.slice(0, 3).map((c) => (
                          <div key={c.id} className={`w-2 h-2 rounded-full ${c.color}`} />
                        ))}
                        {dayClasses.length > 3 && (
                          <span className="text-[10px] text-gray-500">+{dayClasses.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* 待辦事項 */}
                    <div className="space-y-1">
                      {dayTodos.slice(0, 2).map((todo) => (
                        <div
                          key={todo.id}
                          className={`${TODO_COLORS[todo.todoType]} text-white text-xs px-2 py-1 rounded truncate ${
                            todo.completed ? 'opacity-50 line-through' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(todo);
                            setEditingClass(null);
                          }}
                        >
                          {todo.title}
                        </div>
                      ))}
                      {dayTodos.length > 2 && (
                        <div className="text-xs text-gray-500">+{dayTodos.length - 2}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* 詳情彈窗 */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6">
            {selectedItem.type === 'class' ? (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div className={`${selectedItem.color} text-white px-4 py-2 rounded-xl`}>
                    課程
                  </div>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-6">{editingClass?.name ?? selectedItem.name}</h2>
                {editingClass && editingClass.id === selectedItem.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">名稱</p>
                        <input
                          className="w-full rounded-xl border px-3 py-2 border-gray-200"
                          value={editingClass.name}
                          onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">星期</p>
                        <Select.Root
                          value={editingClass.day.toString()}
                          onValueChange={(value) => setEditingClass({ ...editingClass, day: parseInt(value) })}
                        >
                          <Select.Trigger className="flex items-center justify-between w-full px-3 py-2 rounded-xl border border-gray-200 bg-white">
                            <Select.Value />
                            <Select.Icon>
                              <ChevronDown className="w-4 h-4" />
                            </Select.Icon>
                          </Select.Trigger>
                          <Select.Portal>
                            <Select.Content className="overflow-hidden bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                              <Select.Viewport>
                                {WEEKDAYS.map((label, idx) => (
                                  <Select.Item key={idx} value={idx.toString()} className="relative flex items-center px-6 py-2 text-sm text-gray-800 cursor-pointer hover:bg-blue-50 focus:bg-blue-50 outline-none">
                                    <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                                      <Check className="w-4 h-4 text-blue-600" />
                                    </Select.ItemIndicator>
                                    <Select.ItemText>{label}</Select.ItemText>
                                  </Select.Item>
                                ))}
                              </Select.Viewport>
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">開始時間</p>
                        <Select.Root
                          value={editingClass.startTime}
                          onValueChange={(value) => setEditingClass({ ...editingClass, startTime: value })}
                        >
                          <Select.Trigger className="flex items-center justify-between w-full px-3 py-2 rounded-xl border border-gray-200 bg-white">
                            <Select.Value />
                            <Select.Icon>
                              <ChevronDown className="w-4 h-4" />
                            </Select.Icon>
                          </Select.Trigger>
                          <Select.Portal>
                            <Select.Content className="overflow-hidden bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-56">
                              <Select.Viewport className="p-1">
                                {TIME_SLOTS.map((time) => (
                                  <Select.Item key={time} value={time} className="relative flex items-center px-6 py-2 text-sm text-gray-800 cursor-pointer hover:bg-blue-50 focus:bg-blue-50 outline-none">
                                    <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                                      <Check className="w-4 h-4 text-blue-600" />
                                    </Select.ItemIndicator>
                                    <Select.ItemText>{time}</Select.ItemText>
                                  </Select.Item>
                                ))}
                              </Select.Viewport>
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">結束時間</p>
                        <Select.Root
                          value={editingClass.endTime}
                          onValueChange={(value) => setEditingClass({ ...editingClass, endTime: value })}
                        >
                          <Select.Trigger className="flex items-center justify-between w-full px-3 py-2 rounded-xl border border-gray-200 bg-white">
                            <Select.Value />
                            <Select.Icon>
                              <ChevronDown className="w-4 h-4" />
                            </Select.Icon>
                          </Select.Trigger>
                          <Select.Portal>
                            <Select.Content className="overflow-hidden bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-56">
                              <Select.Viewport className="p-1">
                                {TIME_SLOTS.map((time) => (
                                  <Select.Item key={time} value={time} className="relative flex items-center px-6 py-2 text-sm text-gray-800 cursor-pointer hover:bg-blue-50 focus:bg-blue-50 outline-none">
                                    <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                                      <Check className="w-4 h-4 text-blue-600" />
                                    </Select.ItemIndicator>
                                    <Select.ItemText>{time}</Select.ItemText>
                                  </Select.Item>
                                ))}
                              </Select.Viewport>
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">上課地點</p>
                      <input
                        className="w-full rounded-xl border px-3 py-2 border-gray-200"
                        value={editingClass.location}
                        onChange={(e) => setEditingClass({ ...editingClass, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">顏色</p>
                      <div className="flex flex-wrap gap-2">
                        {COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setEditingClass({ ...editingClass, color })}
                            className={`w-8 h-8 rounded-full border-2 ${color} ${
                              editingClass.color === color ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400' : 'border-white shadow'
                            }`}
                            aria-label={`選擇顏色 ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                      <button
                        onClick={saveEditingClass}
                        className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                      >
                        儲存變更
                      </button>
                      <button
                        onClick={() => setEditingClass(null)}
                        className="px-8 py-3.5 rounded-2xl bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-5 mb-8">
                      <div className="flex items-center gap-4 text-gray-600">
                        <span className="text-3xl">📅</span>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">每週</p>
                          <p className="font-semibold text-gray-800 text-base">{WEEKDAYS[selectedItem.day]}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-gray-600">
                        <span className="text-3xl">⏰</span>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">上課時間</p>
                          <p className="font-semibold text-gray-800 text-base">{selectedItem.startTime} - {selectedItem.endTime}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-gray-600">
                        <span className="text-3xl">📍</span>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">上課地點</p>
                          <p className="font-semibold text-gray-800 text-base">{selectedItem.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-gray-600">
                        <span className="text-3xl">🎨</span>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">課程顏色</p>
                          <div className={`w-10 h-10 rounded-xl ${selectedItem.color} border-2 border-white shadow-lg mt-1`}></div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-6 border-t border-gray-200">
                      <button
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                        onClick={() => setEditingClass(selectedItem)}
                      >
                        編輯課程
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div className={`${TODO_COLORS[selectedItem.todoType]} text-white px-4 py-2 rounded-xl`}>
                    {TODO_LABELS[selectedItem.todoType]}
                  </div>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <h2 className="text-gray-800 mb-4">{selectedItem.title}</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-gray-600">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="text-sm text-gray-500">日期</p>
                      <p>{selectedItem.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedItem.completed}
                      onChange={() => toggleTodo(selectedItem.id)}
                      className="w-6 h-6 rounded accent-blue-500"
                    />
                    <span className="text-gray-700">
                      {selectedItem.completed ? '已完成' : '未完成'}
                    </span>
                  </div>
                </div>
              </>
            )}
            <button
              onClick={() => handleDelete(selectedItem)}
              className="w-full bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition-colors"
            >
              刪除
            </button>
          </div>
        </div>
      )}

      {/* 新增表單 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-gray-800">新增項目</h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewClass({ name: '', startTime: '08:00', endTime: '10:00', location: '', day: 0 });
                  setNewTodo({ title: '', date: '', todoType: 'homework' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 類型選擇 */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setAddType('class')}
                className={`flex-1 py-3 rounded-xl transition-all ${
                  addType === 'class' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                📚 課程
              </button>
              <button
                onClick={() => setAddType('todo')}
                className={`flex-1 py-3 rounded-xl transition-all ${
                  addType === 'todo' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                ✅ 待辦
              </button>
            </div>

            {addType === 'class' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">課程名稱</label>
                  <input
                    type="text"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none"
                    placeholder="例如：微積分"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">星期</label>
                  <div className="grid grid-cols-7 gap-1">
                    {WEEKDAYS_SHORT.map((day, index) => (
                      <button
                        key={day}
                        onClick={() => setNewClass({ ...newClass, day: index })}
                        className={`py-2 rounded-xl text-sm transition-all ${
                          newClass.day === index ? 'bg-blue-500 text-white font-semibold' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 mb-2">開始時間</label>
                    <Select.Root
                      value={newClass.startTime}
                      onValueChange={(value) => setNewClass({ ...newClass, startTime: value })}
                    >
                      <Select.Trigger className="flex items-center justify-between w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none bg-white">
                        <Select.Value />
                        <Select.Icon>
                          <ChevronDown className="w-4 h-4" />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="overflow-hidden bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-60">
                          <Select.Viewport className="p-1">
                            {TIME_SLOTS.map((time) => (
                              <Select.Item
                                key={time}
                                value={time}
                                className="relative flex items-center px-8 py-2 rounded-lg text-sm text-gray-800 cursor-pointer hover:bg-blue-50 focus:bg-blue-50 outline-none"
                              >
                                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                                  <Check className="w-4 h-4 text-blue-600" />
                                </Select.ItemIndicator>
                                <Select.ItemText>{time}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">結束時間</label>
                    <Select.Root
                      value={newClass.endTime}
                      onValueChange={(value) => setNewClass({ ...newClass, endTime: value })}
                    >
                      <Select.Trigger className="flex items-center justify-between w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none bg-white">
                        <Select.Value />
                        <Select.Icon>
                          <ChevronDown className="w-4 h-4" />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="overflow-hidden bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-60">
                          <Select.Viewport className="p-1">
                            {TIME_SLOTS.map((time) => (
                              <Select.Item
                                key={time}
                                value={time}
                                className="relative flex items-center px-8 py-2 rounded-lg text-sm text-gray-800 cursor-pointer hover:bg-blue-50 focus:bg-blue-50 outline-none"
                              >
                                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                                  <Check className="w-4 h-4 text-blue-600" />
                                </Select.ItemIndicator>
                                <Select.ItemText>{time}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">上課地點</label>
                  <input
                    type="text"
                    value={newClass.location}
                    onChange={(e) => setNewClass({ ...newClass, location: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none"
                    placeholder="例如：普通教室 101"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">課程顏色</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewClass({ ...newClass, color })}
                        className={`w-8 h-8 rounded-full border-2 ${
                          newClass.color === color ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400' : 'border-white shadow'
                        } ${color}`}
                        aria-label={`選擇顏色 ${color}`}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleAddClass}
                  disabled={!newClass.name || !newClass.location}
                  className="w-full bg-gradient-to-r from-blue-400 to-indigo-500 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  新增課程
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">類型</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(TODO_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setNewTodo({ ...newTodo, todoType: key as any })}
                        className={`py-3 rounded-xl transition-all ${
                          newTodo.todoType === key
                            ? `${TODO_COLORS[key as keyof typeof TODO_COLORS]} text-white`
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">標題</label>
                  <input
                    type="text"
                    value={newTodo.title}
                    onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none"
                    placeholder="例如：微積分作業"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">關聯課程（選填）</label>
                  <Select.Root
                    value={newTodo.courseId || "__none__"}
                    onValueChange={(value) => {
                      if (value === "__none__") {
                        setNewTodo({ ...newTodo, courseId: '', courseName: '' });
                      } else {
                        const selected = classes.find(c => c.id === value);
                        setNewTodo({ ...newTodo, courseId: value, courseName: selected?.name || '' });
                      }
                    }}
                  >
                    <Select.Trigger className="flex items-center justify-between w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none bg-white">
                      <Select.Value placeholder="選擇課表上的課程" />
                      <Select.Icon>
                        <ChevronDown className="w-4 h-4" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="overflow-hidden bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-60">
                        <Select.Viewport className="p-1">
                        <Select.Item
                          value="__none__"
                          className="relative flex items-center px-8 py-2 rounded-lg text-sm text-gray-500 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 outline-none"
                        >
                          <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                            <Check className="w-4 h-4 text-green-600" />
                          </Select.ItemIndicator>
                          <Select.ItemText>不選課程（獨立任務）</Select.ItemText>
                        </Select.Item>
                          {classes.map((classItem) => (
                            <Select.Item
                              key={classItem.id}
                              value={classItem.id}
                              className="relative flex items-center px-8 py-2 rounded-lg text-sm text-gray-800 cursor-pointer hover:bg-green-50 focus:bg-green-50 outline-none"
                            >
                              <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                                <Check className="w-4 h-4 text-green-600" />
                              </Select.ItemIndicator>
                              <Select.ItemText>
                                <span className="flex items-center gap-2">
                                  <span className={`w-3 h-3 rounded-full ${classItem.color}`}></span>
                                  {classItem.name}
                                </span>
                              </Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                  <p className="text-xs text-gray-500 mt-1">從課表選擇相關課程</p>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">日期</label>
                  <input
                    type="date"
                    value={newTodo.date}
                    onChange={(e) => setNewTodo({ ...newTodo, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleAddTodo}
                  disabled={!newTodo.title || !newTodo.date}
                  className="w-full bg-gradient-to-r from-green-400 to-teal-500 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  新增待辦
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
