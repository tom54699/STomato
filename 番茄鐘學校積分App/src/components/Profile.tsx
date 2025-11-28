import { LogOut, Award, School, User as UserIcon, TrendingUp } from 'lucide-react';
import { User } from '../App';

type ProfileProps = {
  user: User;
  onLogout: () => void;
};

export function Profile({ user, onLogout }: ProfileProps) {
  const handleLogout = () => {
    if (confirm('確定要登出嗎？')) {
      onLogout();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 p-4">
      {/* 個人資訊卡片 */}
      <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-3xl shadow-2xl p-8 mb-6 text-white">
        <div className="text-center">
          <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
            <UserIcon className="w-12 h-12 text-orange-500" />
          </div>
          <h1 className="mb-1">{user.name}</h1>
          <p className="text-white text-opacity-90">{user.school}</p>
          <p className="text-white text-opacity-75 text-sm mb-4">{user.email}</p>
          <div className="bg-white bg-opacity-20 rounded-2xl p-4 backdrop-blur-sm">
            <p className="text-white text-opacity-90 mb-1">總積分</p>
            <div className="flex items-center justify-center gap-2">
              <Award className="w-8 h-8" />
              <span className="text-white">{user.totalPoints.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 統計資訊 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-4xl mb-2">🍅</div>
          <p className="text-gray-500 mb-1">完成番茄鐘</p>
          <p className="text-gray-800">{Math.floor(user.totalPoints / 100)} 次</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-4xl mb-2">⏱️</div>
          <p className="text-gray-500 mb-1">專注時間</p>
          <p className="text-gray-800">{Math.floor(user.totalPoints / 4)} 分鐘</p>
        </div>
      </div>

      {/* 成就 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-6 h-6 text-yellow-500" />
          <h2 className="text-gray-800">成就徽章</h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {user.totalPoints >= 100 && (
            <div className="text-center">
              <div className="text-4xl mb-1">🏆</div>
              <p className="text-gray-600 text-sm">新手</p>
            </div>
          )}
          {user.totalPoints >= 500 && (
            <div className="text-center">
              <div className="text-4xl mb-1">🎯</div>
              <p className="text-gray-600 text-sm">專注者</p>
            </div>
          )}
          {user.totalPoints >= 1000 && (
            <div className="text-center">
              <div className="text-4xl mb-1">⭐</div>
              <p className="text-gray-600 text-sm">學霸</p>
            </div>
          )}
          {user.totalPoints >= 5000 && (
            <div className="text-center">
              <div className="text-4xl mb-1">👑</div>
              <p className="text-gray-600 text-sm">大師</p>
            </div>
          )}
        </div>
        {user.totalPoints < 100 && (
          <p className="text-gray-400 text-center mt-4">完成更多番茄鐘解鎖成就</p>
        )}
      </div>

      {/* 學校榮譽 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <School className="w-6 h-6 text-blue-500" />
          <h2 className="text-gray-800">學校榮譽</h2>
        </div>
        <div className="text-center py-4">
          <p className="text-gray-600 mb-2">你為 {user.school} 貢獻了</p>
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-500" />
            <span className="text-green-600">{user.totalPoints.toLocaleString()}</span>
          </div>
          <p className="text-gray-500 mt-2">積分</p>
        </div>
      </div>

      {/* 登出按鈕 */}
      <button
        onClick={handleLogout}
        className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        <span>登出</span>
      </button>

      {/* 版本資訊 */}
      <p className="text-center text-gray-400 mt-6">番茄鐘學習 v1.0.0</p>
    </div>
  );
}
