import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Calendar, Clock, Target, MessageSquare, Zap, Filter } from 'lucide-react';
import { User } from '../App';

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

type FocusHistoryProps = {
  user: User;
  onBack: () => void;
};

const DIFFICULTY_LABELS = {
  easy: '簡單',
  medium: '中等',
  hard: '困難',
};

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

export function FocusHistory({ user, onBack }: FocusHistoryProps) {
  const [logs, setLogs] = useState<FocusLog[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'longest' | 'completion'>('newest');
  const [filterCompletion, setFilterCompletion] = useState<'all' | '100' | 'high' | 'medium' | 'low'>('all');
  const [selectedLog, setSelectedLog] = useState<FocusLog | null>(null);

  useEffect(() => {
    const savedLogs = localStorage.getItem('focusLogs');
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs) as FocusLog[]);
      } catch (error) {
        console.warn('Failed to parse focusLogs', error);
      }
    }
  }, []);

  // 篩選和排序
  const filteredAndSortedLogs = useMemo(() => {
    let result = [...logs];

    // 篩選完成度
    if (filterCompletion !== 'all') {
      result = result.filter((log) => {
        const completion = log.completionPercent || 0;
        if (filterCompletion === '100') return completion === 100;
        if (filterCompletion === 'high') return completion >= 80 && completion < 100;
        if (filterCompletion === 'medium') return completion >= 50 && completion < 80;
        if (filterCompletion === 'low') return completion < 50;
        return true;
      });
    }

    // 排序
    result.sort((a, b) => {
      if (sortBy === 'newest') return b.timestamp - a.timestamp;
      if (sortBy === 'oldest') return a.timestamp - b.timestamp;
      if (sortBy === 'longest') return b.minutes - a.minutes;
      if (sortBy === 'completion') return (b.completionPercent || 0) - (a.completionPercent || 0);
      return 0;
    });

    return result;
  }, [logs, sortBy, filterCompletion]);

  const stats = useMemo(() => {
    return {
      total: logs.length,
      totalMinutes: logs.reduce((sum, log) => sum + log.minutes, 0),
      avgMinutes: logs.length > 0 ? Math.round(logs.reduce((sum, log) => sum + log.minutes, 0) / logs.length) : 0,
      withNotes: logs.filter((log) => log.note).length,
      perfect: logs.filter((log) => log.completionPercent === 100).length,
    };
  }, [logs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
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
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-8 h-8 text-indigo-500" />
          <div>
            <h1 className="text-gray-800 text-2xl">焦點時間歷史</h1>
            <p className="text-gray-600">查看所有番茄鐘會話紀錄</p>
          </div>
        </div>
      </div>

      {/* 統計概況 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <p className="text-gray-500 text-sm mb-1">總會話數</p>
          <p className="text-3xl font-bold text-indigo-600">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <p className="text-gray-500 text-sm mb-1">總時間</p>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalMinutes}</p>
          <p className="text-xs text-gray-400">分鐘</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <p className="text-gray-500 text-sm mb-1">平均時長</p>
          <p className="text-3xl font-bold text-green-600">{stats.avgMinutes}</p>
          <p className="text-xs text-gray-400">分鐘</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <p className="text-gray-500 text-sm mb-1">完美完成</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.perfect}</p>
          <p className="text-xs text-gray-400">次</p>
        </div>
      </div>

      {/* 篩選和排序 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-indigo-500" />
          <h2 className="text-gray-800">篩選和排序</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">排序方式</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'newest', label: '最新優先' },
                { value: 'oldest', label: '最舊優先' },
                { value: 'longest', label: '最長時間' },
                { value: 'completion', label: '完成度高' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as any)}
                  className={`py-2 px-3 rounded-lg text-sm transition-all ${
                    sortBy === option.value
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">完成度篩選</label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { value: 'all', label: '全部' },
                { value: '100', label: '100%' },
                { value: 'high', label: '80-99%' },
                { value: 'medium', label: '50-79%' },
                { value: 'low', label: '<50%' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilterCompletion(option.value as any)}
                  className={`py-2 px-2 rounded-lg text-xs transition-all ${
                    filterCompletion === option.value
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 列表 */}
      <div className="space-y-3">
        {filteredAndSortedLogs.length > 0 ? (
          filteredAndSortedLogs.map((log) => (
            <button
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className="w-full bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-4 text-left"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-gray-800 font-semibold">{log.planTitle || '自由番茄鐘'}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  log.completionPercent === 100 ? 'bg-green-100 text-green-700' :
                  log.completionPercent && log.completionPercent >= 80 ? 'bg-blue-100 text-blue-700' :
                  log.completionPercent && log.completionPercent >= 50 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {log.completionPercent || 100}%
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {log.minutes} 分鐘
                </div>
                {log.location && (
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {log.location}
                  </div>
                )}
                {log.note && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    有備註
                  </div>
                )}
                {log.difficulty && (
                  <span className={`px-2 py-0.5 rounded text-xs ${DIFFICULTY_COLORS[log.difficulty]}`}>
                    {DIFFICULTY_LABELS[log.difficulty]}
                  </span>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 mb-2">沒有符合條件的記錄</p>
            <p className="text-gray-400 text-sm">試試調整篩選條件</p>
          </div>
        )}
      </div>

      {/* 詳細檢視彈窗 */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-gray-800 text-xl font-bold">會話詳情</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-4">
                <p className="text-sm text-gray-600 mb-1">計畫名稱</p>
                <p className="text-lg font-semibold text-gray-800">{selectedLog.planTitle || '自由番茄鐘'}</p>
              </div>

              {/* 時間信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-600 mb-2">時間</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedLog.minutes}</p>
                  <p className="text-xs text-gray-500">分鐘</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-600 mb-2">完成度</p>
                  <p className="text-2xl font-bold text-green-600">{selectedLog.completionPercent || 100}%</p>
                </div>
              </div>

              {/* 日期時間 */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-600 mb-2">紀錄時間</p>
                <p className="text-gray-800">{new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>

              {/* 地點 */}
              {selectedLog.location && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-600 mb-2">地點</p>
                  <p className="text-gray-800">{selectedLog.location}</p>
                </div>
              )}

              {/* 難度 */}
              {selectedLog.difficulty && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-600 mb-2">難度</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${DIFFICULTY_COLORS[selectedLog.difficulty]}`}>
                      {DIFFICULTY_LABELS[selectedLog.difficulty]}
                    </span>
                    {selectedLog.difficultyBonus && (
                      <span className="text-xs text-gray-600">+{selectedLog.difficultyBonus} 加成</span>
                    )}
                  </div>
                </div>
              )}

              {/* 備註 */}
              {selectedLog.note && (
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-600 mb-2">備註</p>
                  <p className="text-gray-800 leading-relaxed">{selectedLog.note}</p>
                </div>
              )}

              {!selectedLog.note && (
                <div className="bg-gray-50 rounded-2xl p-4 text-center text-gray-500 text-sm">
                  沒有添加備註
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="w-full mt-6 bg-indigo-500 text-white py-3 rounded-2xl font-semibold hover:bg-indigo-600 transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
