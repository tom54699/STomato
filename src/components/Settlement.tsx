import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Flame, Zap } from 'lucide-react';
import { User } from '../App';

type SettlementProps = {
  user: User;
  sessionMinutes: number;
  pointsEarned: number;
  planTitle?: string;
  planPercent?: number;
  onReturnHome: () => void;
};

export function Settlement({
  user,
  sessionMinutes,
  pointsEarned,
  planTitle,
  planPercent = 0,
  onReturnHome
}: SettlementProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [displayPoints, setDisplayPoints] = useState(0);

  // 數字滾動動畫
  useEffect(() => {
    if (!isAnimating) return;

    let current = 0;
    const step = Math.ceil(pointsEarned / 30);
    const interval = setInterval(() => {
      current += step;
      if (current >= pointsEarned) {
        setDisplayPoints(pointsEarned);
        setIsAnimating(false);
      } else {
        setDisplayPoints(current);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [pointsEarned, isAnimating]);

  // 根據績效等級判斷
  const getPerformanceLevel = () => {
    if (pointsEarned >= 150) return { level: '完美！', emoji: '⭐', color: 'from-yellow-400 to-orange-500' };
    if (pointsEarned >= 100) return { level: '太棒了！', emoji: '🌟', color: 'from-orange-400 to-pink-500' };
    if (pointsEarned >= 50) return { level: '不錯喔', emoji: '👍', color: 'from-blue-400 to-indigo-500' };
    return { level: '加油！', emoji: '💪', color: 'from-green-400 to-emerald-500' };
  };

  const performance = getPerformanceLevel();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 返回按鈕 */}
      <button
        onClick={onReturnHome}
        className="fixed top-4 left-4 z-40 bg-white rounded-full p-3 shadow-md hover:shadow-lg transition-all active:scale-95"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </button>

      {/* 頂部慶祝區域 */}
      <div className={`bg-gradient-to-br ${performance.color} pt-20 pb-16 text-center text-white relative overflow-hidden`}>
        {/* 背景動畫元素 */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        </div>

        <div className="relative z-10">
          <div className={`text-8xl mb-6 inline-block animate-bounce`} style={{ animationDuration: '0.6s' }}>
            {performance.emoji}
          </div>
          <h1 className="text-4xl font-bold mb-3">{performance.level}</h1>
          <p className="text-white/90 text-lg">這次專注很棒</p>
        </div>
      </div>

      {/* 積分顯示區 */}
      <div className="max-w-md mx-auto px-6 -mt-12 relative z-20 mb-8">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <p className="text-gray-500 text-sm mb-2">本次獲得</p>
          <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 mb-2 animate-in fade-in zoom-in duration-700">
            +{displayPoints}
          </div>
          <p className="text-gray-400 text-xs">積分</p>
        </div>
      </div>

      {/* 詳細統計區 */}
      <div className="max-w-md mx-auto px-6 space-y-4 mb-8">
        {/* 時長卡 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-gray-600">本次時長</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">{sessionMinutes}</p>
            <p className="text-xs text-gray-500 mt-1">分鐘</p>
          </div>

          {/* 總積分卡 */}
          <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-5 border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-orange-500" />
              <p className="text-xs text-gray-600">總積分</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">{user.totalPoints}</p>
            <p className="text-xs text-gray-500 mt-1">歷史累計</p>
          </div>
        </div>

        {/* 計畫進度卡（如果有計畫） */}
        {planTitle && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-green-500" />
                <p className="text-xs text-gray-600">今日計畫</p>
              </div>
              <p className="text-sm font-semibold text-green-600">{planPercent}%</p>
            </div>
            <p className="text-sm text-gray-700 mb-3 font-medium truncate">{planTitle}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${planPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* 難度評分（可選） */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
          <p className="text-xs text-gray-600 mb-3">專注難度</p>
          <div className="flex gap-2 justify-center">
            {['簡單', '普通', '困難'].map((level, idx) => (
              <button
                key={level}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{
                  background: idx === 1 ? 'linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)' : '#f3f4f6',
                  color: idx === 1 ? 'white' : '#6b7280'
                }}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">選擇此次的難度（可選）</p>
        </div>
      </div>

      {/* 底部返回按鈕 */}
      <div className="max-w-md mx-auto px-6 pb-8">
        <button
          onClick={onReturnHome}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
        >
          回到首頁 🏠
        </button>

        {/* 成就/激勵訊息 */}
        <div className="mt-6 text-center">
          {pointsEarned >= 150 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-800 text-sm font-semibold">🌟 驚人的專注力！</p>
              <p className="text-yellow-700 text-xs mt-1">你進入了心流狀態，繼續保持這個勢頭！</p>
            </div>
          )}
          {pointsEarned >= 100 && pointsEarned < 150 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-orange-800 text-sm font-semibold">🔥 專注力很棒！</p>
              <p className="text-orange-700 text-xs mt-1">你的努力有成果，再努力一點就能達到完美！</p>
            </div>
          )}
          {pointsEarned >= 50 && pointsEarned < 100 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-800 text-sm font-semibold">💪 不錯的開始！</p>
              <p className="text-blue-700 text-xs mt-1">保持這個節奏，逐步改進你的專注力。</p>
            </div>
          )}
          {pointsEarned < 50 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800 text-sm font-semibold">🌱 每次都在進步！</p>
              <p className="text-green-700 text-xs mt-1">專注是一種習慣，每天都變得更好。</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-in {
          animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
