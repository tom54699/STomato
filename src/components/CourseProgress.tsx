import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, Book, ChevronDown, ChevronUp, Edit2, Trash2, CheckCircle, Circle } from 'lucide-react';
import { User } from '../App';

type Chapter = {
  id: string;
  name: string;
  completion: number; // 0-100
  notes?: string;
};

type Course = {
  id: string;
  name: string;
  color: string;
  chapters: Chapter[];
  createdAt: number;
};

type CourseProgressProps = {
  user: User;
  onBack: () => void;
};

const COLORS = [
  'bg-blue-100 border-blue-300',
  'bg-green-100 border-green-300',
  'bg-purple-100 border-purple-300',
  'bg-yellow-100 border-yellow-300',
  'bg-red-100 border-red-300',
  'bg-pink-100 border-pink-300',
  'bg-indigo-100 border-indigo-300',
  'bg-teal-100 border-teal-300',
];

const COLOR_THEMES = {
  'bg-blue-100 border-blue-300': { bg: 'bg-blue-500', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  'bg-green-100 border-green-300': { bg: 'bg-green-500', text: 'text-green-600', badge: 'bg-green-100 text-green-700' },
  'bg-purple-100 border-purple-300': { bg: 'bg-purple-500', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
  'bg-yellow-100 border-yellow-300': { bg: 'bg-yellow-500', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
  'bg-red-100 border-red-300': { bg: 'bg-red-500', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  'bg-pink-100 border-pink-300': { bg: 'bg-pink-500', text: 'text-pink-600', badge: 'bg-pink-100 text-pink-700' },
  'bg-indigo-100 border-indigo-300': { bg: 'bg-indigo-500', text: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700' },
  'bg-teal-100 border-teal-300': { bg: 'bg-teal-500', text: 'text-teal-600', badge: 'bg-teal-100 text-teal-700' },
};

export function CourseProgress({ user, onBack }: CourseProgressProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState<string | null>(null);
  const [editingChapter, setEditingChapter] = useState<{ courseId: string; chapterId: string } | null>(null);

  const [newCourseName, setNewCourseName] = useState('');
  const [newChapterName, setNewChapterName] = useState('');
  const [chapterCompletion, setChapterCompletion] = useState(0);
  const [chapterNotes, setChapterNotes] = useState('');

  // 加載課程數據
  useEffect(() => {
    const savedCourses = localStorage.getItem('courses');
    if (savedCourses) {
      try {
        setCourses(JSON.parse(savedCourses) as Course[]);
      } catch (error) {
        console.warn('Failed to parse courses', error);
      }
    }
  }, []);

  // 保存課程數據
  useEffect(() => {
    if (courses.length > 0) {
      localStorage.setItem('courses', JSON.stringify(courses));
    }
  }, [courses]);

  const handleAddCourse = () => {
    if (newCourseName.trim()) {
      const newCourse: Course = {
        id: `course-${Date.now()}`,
        name: newCourseName,
        color: COLORS[courses.length % COLORS.length],
        chapters: [],
        createdAt: Date.now(),
      };
      setCourses([...courses, newCourse]);
      setNewCourseName('');
      setShowAddCourse(false);
    }
  };

  const handleAddChapter = (courseId: string) => {
    if (newChapterName.trim()) {
      setCourses(
        courses.map((course) =>
          course.id === courseId
            ? {
                ...course,
                chapters: [
                  ...course.chapters,
                  {
                    id: `chapter-${Date.now()}`,
                    name: newChapterName,
                    completion: 0,
                  },
                ],
              }
            : course
        )
      );
      setNewChapterName('');
      setShowAddChapter(null);
    }
  };

  const handleUpdateChapter = (courseId: string, chapterId: string) => {
    setCourses(
      courses.map((course) =>
        course.id === courseId
          ? {
              ...course,
              chapters: course.chapters.map((ch) =>
                ch.id === chapterId
                  ? { ...ch, name: newChapterName, completion: chapterCompletion, notes: chapterNotes }
                  : ch
              ),
            }
          : course
      )
    );
    setEditingChapter(null);
    setNewChapterName('');
    setChapterCompletion(0);
    setChapterNotes('');
  };

  const handleDeleteChapter = (courseId: string, chapterId: string) => {
    setCourses(
      courses.map((course) =>
        course.id === courseId
          ? { ...course, chapters: course.chapters.filter((ch) => ch.id !== chapterId) }
          : course
      )
    );
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourses(courses.filter((c) => c.id !== courseId));
  };

  const getCourseProgress = (course: Course) => {
    if (course.chapters.length === 0) return 0;
    return Math.round(
      course.chapters.reduce((sum, ch) => sum + ch.completion, 0) / course.chapters.length
    );
  };

  const getCompletionColor = (completion: number) => {
    if (completion === 100) return 'text-green-600';
    if (completion >= 80) return 'text-blue-600';
    if (completion >= 50) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const openEditChapter = (chapter: Chapter) => {
    setNewChapterName(chapter.name);
    setChapterCompletion(chapter.completion);
    setChapterNotes(chapter.notes || '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      {/* 返回按鈕 */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回</span>
      </button>

      {/* 標題 */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Book className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-gray-800 text-2xl">課程進度</h1>
              <p className="text-gray-600">管理學科和章節進度</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddCourse(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 課程列表 */}
      <div className="space-y-4">
        {courses.length > 0 ? (
          courses.map((course) => {
            const progress = getCourseProgress(course);
            const isExpanded = expandedCourse === course.id;

            return (
              <div
                key={course.id}
                className={`bg-white rounded-2xl shadow-md overflow-hidden transition-all ${
                  isExpanded ? 'ring-2 ring-blue-400' : ''
                }`}
              >
                {/* 課程頭部 */}
                <div
                  onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                  className={`p-5 cursor-pointer transition-colors ${course.color} border-l-4 border-transparent`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-gray-800 font-bold text-lg">{course.name}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-semibold ${getCompletionColor(progress)}`}>
                          {progress}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourse(course.id);
                      }}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 章節列表（展開時） */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 space-y-3">
                    {course.chapters.length > 0 ? (
                      course.chapters.map((chapter) => (
                        <div
                          key={chapter.id}
                          className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            {chapter.completion === 100 ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )}
                            <div className="flex-1">
                              <p className="text-gray-800 font-semibold">{chapter.name}</p>
                            </div>
                            <span className={`text-sm font-bold ${getCompletionColor(chapter.completion)}`}>
                              {chapter.completion}%
                            </span>
                            <button
                              onClick={() => {
                                openEditChapter(chapter);
                                setEditingChapter({ courseId: course.id, chapterId: chapter.id });
                              }}
                              className="text-blue-500 hover:text-blue-700 p-1"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteChapter(course.id, chapter.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* 進度條 */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all"
                                style={{ width: `${chapter.completion}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* 備註 */}
                          {chapter.notes && (
                            <p className="text-xs text-gray-600 mt-2 italic">
                              📝 {chapter.notes}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-400 py-4">尚未新增章節</p>
                    )}

                    {/* 新增章節按鈕 */}
                    <button
                      onClick={() => setShowAddChapter(course.id)}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      新增章節
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-500 mb-2">還沒有課程</p>
            <p className="text-gray-400 text-sm">點擊右上方的 + 按鈕新增第一個課程</p>
          </div>
        )}
      </div>

      {/* 新增課程彈窗 */}
      {showAddCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-gray-800 text-xl font-bold">新增課程</h2>
              <button
                onClick={() => setShowAddCourse(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">課程名稱</label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="例如：微積分、英文、化學"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCourse()}
                />
              </div>

              <button
                onClick={handleAddCourse}
                disabled={!newCourseName.trim()}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                新增課程
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增章節彈窗 */}
      {showAddChapter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-gray-800 text-xl font-bold">新增章節</h2>
              <button
                onClick={() => setShowAddChapter(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">章節名稱</label>
                <input
                  type="text"
                  value={newChapterName}
                  onChange={(e) => setNewChapterName(e.target.value)}
                  placeholder="例如：第一章 導數基礎"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">初始完成度</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={chapterCompletion}
                    onChange={(e) => setChapterCompletion(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-full accent-blue-500"
                  />
                  <span className="text-xl font-bold text-blue-600 w-12 text-right">
                    {chapterCompletion}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">備註（可選）</label>
                <textarea
                  value={chapterNotes}
                  onChange={(e) => setChapterNotes(e.target.value)}
                  placeholder="例如：需要複習求導規則"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              <button
                onClick={() => handleAddChapter(showAddChapter)}
                disabled={!newChapterName.trim()}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                新增章節
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯章節彈窗 */}
      {editingChapter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-gray-800 text-xl font-bold">編輯章節</h2>
              <button
                onClick={() => setEditingChapter(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">章節名稱</label>
                <input
                  type="text"
                  value={newChapterName}
                  onChange={(e) => setNewChapterName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">完成度</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={chapterCompletion}
                    onChange={(e) => setChapterCompletion(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-full accent-blue-500"
                  />
                  <span className="text-xl font-bold text-blue-600 w-12 text-right">
                    {chapterCompletion}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">備註（可選）</label>
                <textarea
                  value={chapterNotes}
                  onChange={(e) => setChapterNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              <button
                onClick={() => handleUpdateChapter(editingChapter.courseId, editingChapter.chapterId)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                保存變更
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
