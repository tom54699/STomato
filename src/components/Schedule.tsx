import { useState, useEffect } from 'react';
import { Calendar, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
  'bg-blue-400', 
  'bg-green-400',
  'bg-yellow-400',
  'bg-purple-400',
  'bg-pink-400',
  'bg-indigo-400',
  'bg-teal-400',
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
    color: 'bg-purple-400',
    type: 'class'
  },
  {
    id: '4',
    name: '程式設計',
    startTime: '09:00',
    endTime: '12:00',
    location: '電腦教室 B',
    day: 3,
    color: 'bg-yellow-400',
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
  { id: 't1', title: '微積分習題 3-5', date: '2025-11-30', todoType: 'homework', completed: false, type: 'todo' },
  { id: 't2', title: '物理期中考', date: '2025-12-05', todoType: 'exam', completed: false, type: 'todo' },
  { id: 't3', title: '準備專題報告', date: '2025-12-01', todoType: 'memo', completed: false, type: 'todo' },
];

export function Schedule() {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<'class' | 'todo'>('class');
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  
  const [newClass, setNewClass] = useState({
    name: '',
    startTime: '08:00',
    endTime: '10:00',
    location: '',
    day: 0,
  });

  const [newTodo, setNewTodo] = useState({
    title: '',
    date: '',
    todoType: 'homework' as 'homework' | 'exam' | 'memo',
  });

  // 初始化和持久化
  useEffect(() => {
    const savedClasses = localStorage.getItem('scheduleClasses');
    const savedTodos = localStorage.getItem('scheduleTodos');

    if (savedClasses) {
      try {
        setClasses(JSON.parse(savedClasses));
      } catch (error) {
        console.warn('Failed to parse scheduleClasses', error);
        setClasses(DEFAULT_CLASSES);
      }
    } else {
      setClasses(DEFAULT_CLASSES);
    }

    if (savedTodos) {
      try {
        setTodos(JSON.parse(savedTodos));
      } catch (error) {
        console.warn('Failed to parse scheduleTodos', error);
        setTodos(DEFAULT_TODOS);
      }
    } else {
      setTodos(DEFAULT_TODOS);
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
    if (newClass.name && newClass.location) {
      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      const classItem: ClassItem = {
        id: Date.now().toString(),
        ...newClass,
        color: randomColor,
        type: 'class',
      };
      setClasses([...classes, classItem]);
      setNewClass({ name: '', startTime: '08:00', endTime: '10:00', location: '', day: 0 });
      setShowAddForm(false);
    }
  };

  const handleAddTodo = () => {
    if (newTodo.title && newTodo.date) {
      const todoItem: TodoItem = {
        id: Date.now().toString(),
        ...newTodo,
        completed: false,
        type: 'todo',
      };
      setTodos([...todos, todoItem]);
      setNewTodo({ title: '', date: '', todoType: 'homework' });
      setShowAddForm(false);
    }
  };

  const handleDelete = (item: CalendarItem) => {
    if (item.type === 'class') {
      setClasses(classes.filter((c) => c.id !== item.id));
    } else {
      setTodos(todos.filter((t) => t.id !== item.id));
    }
    setSelectedItem(null);
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
    
    return {
      top: (startTotalMinutes / 60) * 64,
      height: (duration / 60) * 64,
    };
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
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
        <div className="flex gap-2">
          <button
            onClick={() => setView('week')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              view === 'week'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            週視圖
          </button>
          <button
            onClick={() => setView('month')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              view === 'month'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            月視圖
          </button>
        </div>
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
              <div className="min-w-[800px]">
                {/* 星期標題行 */}
                <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
                  <div className="p-3 text-center text-gray-500 text-sm sticky left-0 bg-gray-50 z-10">
                    時間
                  </div>
                  {weekDates.map((date, index) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={index}
                        className={`p-3 text-center ${isToday ? 'bg-blue-100' : ''}`}
                      >
                        <p className={`text-sm ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                          {WEEKDAYS[index]}
                        </p>
                        <p className={`${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                          {date.getDate()}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* 時間軸和課程網格 */}
                <div className="relative">
                  <div className="absolute left-0 top-0 w-[12.5%] bg-gray-50 z-10">
                    {TIME_SLOTS.map((time) => (
                      <div
                        key={time}
                        className="h-16 border-b border-gray-200 flex items-center justify-center text-gray-500 text-sm"
                      >
                        {time}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-8 ml-[12.5%]">
                    <div className="col-span-7 grid grid-cols-7 relative">
                      {weekDates.map((date, dayIndex) => {
                        const isToday = date.toDateString() === new Date().toDateString();
                        return (
                          <div key={dayIndex} className="relative">
                            {TIME_SLOTS.map((time) => (
                              <div
                                key={`${dayIndex}-${time}`}
                                className={`h-16 border-b border-r border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors ${
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
                                    className={`absolute left-1 right-1 ${classItem.color} text-white rounded-lg p-2 shadow-md hover:shadow-lg cursor-pointer transition-all overflow-hidden z-20`}
                                    style={{
                                      top: `${position.top}px`,
                                      height: `${position.height}px`,
                                    }}
                                    onClick={() => setSelectedItem(classItem)}
                                  >
                                    <p className="text-sm truncate">{classItem.name}</p>
                                    <p className="text-xs text-white text-opacity-90 truncate">
                                      {classItem.startTime}-{classItem.endTime}
                                    </p>
                                    <p className="text-xs text-white text-opacity-80 truncate">
                                      {classItem.location}
                                    </p>
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
                  .map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer"
                      onClick={() => setSelectedItem(todo)}
                    >
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded accent-blue-500"
                      />
                      <div className="flex-1">
                        <p className={`text-gray-800 ${todo.completed ? 'line-through opacity-50' : ''}`}>
                          {todo.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`${TODO_COLORS[todo.todoType]} text-white px-2 py-0.5 rounded text-xs`}>
                            {TODO_LABELS[todo.todoType]}
                          </span>
                          <span className="text-xs text-gray-500">{todo.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
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

                    {/* 課程小點 */}
                    {isCurrentMonth && dayClasses.length > 0 && (
                      <div className="flex gap-1 mb-1">
                        {dayClasses.slice(0, 3).map((c) => (
                          <div key={c.id} className={`w-2 h-2 rounded-full ${c.color}`} />
                        ))}
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
                  <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <h2 className="text-gray-800 mb-4">{selectedItem.name}</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-gray-600">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="text-sm text-gray-500">每週</p>
                      <p>{WEEKDAYS[selectedItem.day]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <span className="text-2xl">⏰</span>
                    <div>
                      <p className="text-sm text-gray-500">上課時間</p>
                      <p>{selectedItem.startTime} - {selectedItem.endTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="text-sm text-gray-500">上課地點</p>
                      <p>{selectedItem.location}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div className={`${TODO_COLORS[selectedItem.todoType]} text-white px-4 py-2 rounded-xl`}>
                    {TODO_LABELS[selectedItem.todoType]}
                  </div>
                  <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600">
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
                  <div className="grid grid-cols-4 gap-2">
                    {WEEKDAYS.map((day, index) => (
                      <button
                        key={day}
                        onClick={() => setNewClass({ ...newClass, day: index })}
                        className={`py-2 rounded-xl transition-all ${
                          newClass.day === index ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
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
                    <select
                      value={newClass.startTime}
                      onChange={(e) => setNewClass({ ...newClass, startTime: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none"
                    >
                      {TIME_SLOTS.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">結束時間</label>
                    <select
                      value={newClass.endTime}
                      onChange={(e) => setNewClass({ ...newClass, endTime: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none"
                    >
                      {TIME_SLOTS.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
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
