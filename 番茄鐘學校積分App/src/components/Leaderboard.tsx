import { useState } from 'react';
import { Trophy, School, Users, Medal, Building2 } from 'lucide-react';
import { User } from '../App';

type LeaderboardProps = {
  currentUser: User;
};

// 模擬數據
const MOCK_SCHOOLS = [
  { name: '國立臺灣大學', totalPoints: 145230, studentCount: 423 },
  { name: '國立清華大學', totalPoints: 128450, studentCount: 356 },
  { name: '國立陽明交通大學', totalPoints: 112340, studentCount: 298 },
  { name: '國立成功大學', totalPoints: 98760, studentCount: 267 },
  { name: '國立政治大學', totalPoints: 87650, studentCount: 234 },
  { name: '國立臺灣師範大學', totalPoints: 76540, studentCount: 198 },
  { name: '國立中央大學', totalPoints: 65430, studentCount: 176 },
];

const MOCK_USERS = [
  { id: '1', name: '小明', school: '國立臺灣大學', totalPoints: 5230 },
  { id: '2', name: '小華', school: '國立清華大學', totalPoints: 4850 },
  { id: '3', name: '小美', school: '國立陽明交通大學', totalPoints: 4340 },
  { id: '4', name: '小強', school: '國立成功大學', totalPoints: 3960 },
  { id: '5', name: '小芳', school: '國立政治大學', totalPoints: 3650 },
  { id: '6', name: '小傑', school: '國立臺灣大學', totalPoints: 3420 },
  { id: '7', name: '小婷', school: '國立清華大學', totalPoints: 3180 },
  { id: '8', name: '小偉', school: '國立臺灣大學', totalPoints: 2950 },
  { id: '9', name: '小珊', school: '國立成功大學', totalPoints: 2760 },
  { id: '10', name: '小宇', school: '國立政治大學', totalPoints: 2540 },
];

// 生成校內排行數據
const getSchoolUsers = (schoolName: string) => {
  return MOCK_USERS.filter((u) => u.school === schoolName).sort((a, b) => b.totalPoints - a.totalPoints);
};

export function Leaderboard({ currentUser }: LeaderboardProps) {
  const [tab, setTab] = useState<'school' | 'personal' | 'schoolInternal'>('school');

  const schoolUsers = getSchoolUsers(currentUser.school);
  const currentUserRankInSchool = schoolUsers.findIndex((u) => u.id === currentUser.id) + 1;

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-gray-400">{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      {/* 標題 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-gray-800">排行榜</h1>
        </div>
        <p className="text-gray-600">一起為學校爭光吧！</p>
      </div>

      {/* 標籤切換 */}
      <div className="bg-white rounded-2xl shadow-lg p-2 mb-6 grid grid-cols-3 gap-2">
        <button
          onClick={() => setTab('school')}
          className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
            tab === 'school'
              ? 'bg-gradient-to-r from-purple-400 to-blue-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <School className="w-5 h-5" />
          <span className="text-sm">學校</span>
        </button>
        <button
          onClick={() => setTab('schoolInternal')}
          className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
            tab === 'schoolInternal'
              ? 'bg-gradient-to-r from-purple-400 to-blue-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-sm">校內</span>
        </button>
        <button
          onClick={() => setTab('personal')}
          className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
            tab === 'personal'
              ? 'bg-gradient-to-r from-purple-400 to-blue-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-sm">個人</span>
        </button>
      </div>

      {/* 學校排行榜 */}
      {tab === 'school' && (
        <div className="space-y-3">
          {MOCK_SCHOOLS.map((school, index) => {
            const isCurrentSchool = school.name === currentUser.school;
            return (
              <div
                key={school.name}
                className={`bg-white rounded-2xl shadow-md p-5 flex items-center gap-4 transition-all hover:shadow-lg ${
                  isCurrentSchool ? 'ring-2 ring-purple-400 bg-purple-50' : ''
                }`}
              >
                <div className="w-12 flex justify-center">
                  {getMedalIcon(index + 1)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-gray-800">{school.name}</h3>
                    {isCurrentSchool && (
                      <span className="bg-purple-500 text-white px-2 py-0.5 rounded-full text-xs">
                        我的學校
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500">{school.studentCount} 位學生</p>
                </div>
                <div className="text-right">
                  <div className="text-purple-600">{school.totalPoints.toLocaleString()}</div>
                  <p className="text-gray-500">積分</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 校內排行榜 */}
      {tab === 'schoolInternal' && (
        <div className="space-y-4">
          {/* 學校資訊卡片 */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <School className="w-8 h-8" />
              <div>
                <h2 className="text-white">{currentUser.school}</h2>
                <p className="text-white text-opacity-80">校內排行榜</p>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white text-opacity-80 text-sm">你的排名</p>
                  <p className="text-white text-2xl">
                    {currentUserRankInSchool > 0 ? `#${currentUserRankInSchool}` : '未上榜'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white text-opacity-80 text-sm">你的積分</p>
                  <p className="text-white text-2xl">{currentUser.totalPoints}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 校內排行列表 */}
          <div className="space-y-3">
            {schoolUsers.length > 0 ? (
              schoolUsers.map((user, index) => {
                const isCurrentUser = user.id === currentUser.id;
                return (
                  <div
                    key={user.id}
                    className={`bg-white rounded-2xl shadow-md p-5 flex items-center gap-4 transition-all hover:shadow-lg ${
                      isCurrentUser ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                    }`}
                  >
                    <div className="w-12 flex justify-center">
                      {getMedalIcon(index + 1)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-800">
                        {user.name}
                        {isCurrentUser && (
                          <span className="ml-2 text-blue-500">（你）</span>
                        )}
                      </h3>
                      <p className="text-gray-500">同校學生</p>
                    </div>
                    <div className="text-right">
                      <div className="text-blue-600">{user.totalPoints.toLocaleString()}</div>
                      <p className="text-gray-500">積分</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🎓</div>
                <p className="text-gray-500 mb-2">你是第一位加入的學生</p>
                <p className="text-gray-400">邀請更多同學一起使用吧！</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 個人排行榜（全國） */}
      {tab === 'personal' && (
        <div className="space-y-3">
          {MOCK_USERS.map((user, index) => {
            const isCurrentUser = user.id === currentUser.id;
            return (
              <div
                key={user.id}
                className={`bg-white rounded-2xl shadow-md p-5 flex items-center gap-4 transition-all hover:shadow-lg ${
                  isCurrentUser ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                }`}
              >
                <div className="w-12 flex justify-center">
                  {getMedalIcon(index + 1)}
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-800">
                    {user.name}
                    {isCurrentUser && (
                      <span className="ml-2 text-blue-500">（你）</span>
                    )}
                  </h3>
                  <p className="text-gray-500">{user.school}</p>
                </div>
                <div className="text-right">
                  <div className="text-blue-600">{user.totalPoints.toLocaleString()}</div>
                  <p className="text-gray-500">積分</p>
                </div>
              </div>
            );
          })}

          {/* 如果當前用戶不在前10名 */}
          {!MOCK_USERS.find((u) => u.id === currentUser.id) && (
            <>
              <div className="text-center text-gray-400 py-2">...</div>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-md p-5 flex items-center gap-4 ring-2 ring-blue-400">
                <div className="w-12 flex justify-center">
                  <Medal className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-800">
                    {currentUser.name}
                    <span className="ml-2 text-blue-500">（你）</span>
                  </h3>
                  <p className="text-gray-500">{currentUser.school}</p>
                </div>
                <div className="text-right">
                  <div className="text-blue-600">{currentUser.totalPoints.toLocaleString()}</div>
                  <p className="text-gray-500">積分</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 提示 */}
      <div className="mt-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-4 text-center">
        <p className="text-gray-700">
          {tab === 'school' && '💪 完成更多番茄鐘，為你的學校爭取榮譽！'}
          {tab === 'schoolInternal' && '🏆 超越同校夥伴，成為校內第一名！'}
          {tab === 'personal' && '⭐ 持續努力，登上全國排行榜！'}
        </p>
      </div>
    </div>
  );
}
