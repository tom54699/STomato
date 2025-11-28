import { useEffect, useMemo, useState } from 'react';
import { Users2, Flame, Clock, Share2, Target, Trophy, ShieldCheck } from 'lucide-react';
import { User } from '../App';

type ChallengeRoom = {
  id: string;
  name: string;
  duration: number; // minutes per pomodoro
  targetPomodoros: number;
  participants: number;
  status: 'live' | 'upcoming';
  focusStyle: 'solo' | 'team';
  code: string;
};

type SocialChallengeProps = {
  user: User;
};

const defaultRooms: ChallengeRoom[] = [
  {
    id: 'room-1',
    name: '清晨5人衝刺房',
    duration: 30,
    targetPomodoros: 4,
    participants: 5,
    status: 'live',
    focusStyle: 'team',
    code: 'SUNRI5',
  },
  {
    id: 'room-2',
    name: '英文檢定練習',
    duration: 25,
    targetPomodoros: 3,
    participants: 12,
    status: 'upcoming',
    focusStyle: 'team',
    code: 'TOEIC3',
  },
  {
    id: 'room-3',
    name: '自主寫作挑戰',
    duration: 50,
    targetPomodoros: 2,
    participants: 3,
    status: 'live',
    focusStyle: 'solo',
    code: 'WRITE2',
  },
];

export function SocialChallenge({ user }: SocialChallengeProps) {
  const [rooms, setRooms] = useState<ChallengeRoom[]>(defaultRooms);
  const [form, setForm] = useState({ name: '', duration: 25, targetPomodoros: 4, focusStyle: 'team' as 'solo' | 'team' });
  const [inviteCode, setInviteCode] = useState('');
  const [toast, setToast] = useState('');
  const [reminders, setReminders] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('challengeRooms');
    if (saved) {
      try {
        setRooms((JSON.parse(saved) as ChallengeRoom[]).slice(0, 12));
        return;
      } catch (error) {
        console.warn('Unable to parse challenge rooms', error);
      }
    }
    localStorage.setItem('challengeRooms', JSON.stringify(defaultRooms));
  }, []);

  useEffect(() => {
    localStorage.setItem('challengeRooms', JSON.stringify(rooms));
  }, [rooms]);

  const activeRooms = useMemo(() => rooms.filter((room) => room.status === 'live'), [rooms]);
  const upcomingRooms = useMemo(() => rooms.filter((room) => room.status === 'upcoming'), [rooms]);

  const handleCreateRoom = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = form.name ? form.name.slice(0, 3).toUpperCase() + Math.floor(Math.random() * 900 + 100) : `TEAM${rooms.length + 1}`;
    const newRoom: ChallengeRoom = {
      id: `room-${Date.now()}`,
      name: form.name || `${user.school} 專注房`,
      duration: form.duration,
      targetPomodoros: form.targetPomodoros,
      participants: 1,
      status: 'live',
      focusStyle: form.focusStyle,
      code,
    };
    setRooms([newRoom, ...rooms]);
    setForm({ name: '', duration: 25, targetPomodoros: 4, focusStyle: form.focusStyle });
    setToast(`已建立 ${newRoom.name}（代碼：${newRoom.code}）`);
    setTimeout(() => setToast(''), 3000);
  };

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3500);
  };

  const handleJoinRoom = () => {
    const match = rooms.find((room) => room.code.toUpperCase() === inviteCode.toUpperCase());
    if (!match) {
      notify('找不到此代碼的挑戰房，請再次確認');
      return;
    }
    joinRoom(match.id);
    setInviteCode('');
  };

  const joinRoom = (roomId: string) => {
    const target = rooms.find((room) => room.id === roomId);
    if (!target) {
      notify('挑戰房已不存在');
      return;
    }
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? { ...room, participants: Math.min(30, room.participants + 1) }
          : room
      )
    );
    notify(`成功加入 ${target.name}`);
  };

  const copyCode = (code: string) => {
    navigator.clipboard
      ?.writeText(code)
      .then(() => notify(`已複製代碼 ${code}`))
      .catch(() => notify('代碼複製失敗，請手動選取'));
  };

  const toggleReminder = (roomId: string) => {
    setReminders((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
    const target = rooms.find((room) => room.id === roomId);
    if (target) {
      notify(`${prev.includes(roomId) ? '已取消' : '已設定'} ${target.name} 提醒`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 space-y-5">
      <header className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <Users2 className="w-10 h-10 text-purple-500" />
          <div>
            <p className="text-gray-500 text-sm">社群挑戰</p>
            <h1 className="text-gray-800 text-xl">和同學一起衝刺</h1>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-purple-50 rounded-2xl p-4">
            <p className="text-purple-500 text-sm mb-1">正在進行</p>
            <p className="text-2xl text-purple-700">{activeRooms.length}</p>
          </div>
          <div className="bg-orange-50 rounded-2xl p-4">
            <p className="text-orange-500 text-sm mb-1">本週累積專注</p>
            <p className="text-2xl text-orange-600">{user.totalPoints / 5 | 0} 分鐘</p>
          </div>
        </div>
      </header>

      <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="text-gray-800">建立新的挑戰</h2>
        </div>
        <form className="grid gap-3" onSubmit={handleCreateRoom}>
          <div>
            <label className="text-sm text-gray-500">挑戰名稱</label>
            <input
              className="w-full rounded-xl border border-gray-200 px-4 py-2"
              placeholder="例如：早晨 4 次番茄鐘"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-500">每次時長（分鐘）</label>
              <select
                className="w-full rounded-xl border border-gray-200 px-4 py-2"
                value={form.duration}
                onChange={(event) => setForm((prev) => ({ ...prev, duration: Number(event.target.value) }))}
              >
                {[20, 25, 30, 45, 60].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-500">本輪目標（番茄鐘數）</label>
              <select
                className="w-full rounded-xl border border-gray-200 px-4 py-2"
                value={form.targetPomodoros}
                onChange={(event) => setForm((prev) => ({ ...prev, targetPomodoros: Number(event.target.value) }))}
              >
                {[1, 2, 3, 4, 6].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500">模式</label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {['team', 'solo'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, focusStyle: mode as 'solo' | 'team' }))}
                  className={`rounded-2xl border px-4 py-3 flex flex-col gap-1 text-left ${
                    form.focusStyle === mode ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                  }`}
                >
                  <span className="font-semibold">
                    {mode === 'team' ? 'Team Squad' : 'Solo Coach'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {mode === 'team' ? '邀請同學一起，互相提醒' : '個人模式，紀錄與回顧'}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-2xl shadow-lg hover:shadow-xl"
          >
            建立挑戰房
          </button>
        </form>
      </section>

      <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-blue-500" />
          <h2 className="text-gray-800">輸入邀請代碼加入</h2>
        </div>
        <div className="flex gap-3">
          <input
            className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 uppercase"
            placeholder="例如：SUNRI5"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
          />
          <button
            onClick={handleJoinRoom}
            className="rounded-2xl border-2 border-blue-500 text-blue-500 px-5 font-semibold"
          >
            加入
          </button>
        </div>
        {toast && <p className="text-sm text-blue-500">{toast}</p>}
      </section>

      <section className="space-y-3">
        {activeRooms.length > 0 && (
          <div className="bg-white rounded-3xl shadow-lg p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="text-gray-800">進行中的挑戰</h2>
            </div>
            {activeRooms.map((room) => (
              <article
                key={room.id}
                className="border border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:border-purple-200"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-100 flex flex-col items-center justify-center text-purple-600">
                  <Clock className="w-5 h-5" />
                  <span className="text-xs">{room.duration}分</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-800">{room.name}</h3>
                  <p className="text-sm text-gray-500">
                    目標 {room.targetPomodoros} 次 · {room.participants} 人
                  </p>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <button
                    className="text-purple-600 font-semibold"
                    onClick={() => joinRoom(room.id)}
                  >
                    立即加入
                  </button>
                  <button className="text-gray-400" onClick={() => copyCode(room.code)}>
                    複製代碼
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        {upcomingRooms.length > 0 && (
          <div className="bg-white rounded-3xl shadow-lg p-6 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <h2 className="text-gray-800">即將開始</h2>
            </div>
            {upcomingRooms.map((room) => (
              <article key={room.id} className="border border-gray-100 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <strong className="text-gray-700">{room.name}</strong>
                  <span className="text-xs text-gray-500">代碼 {room.code}</span>
                </div>
                <p className="text-sm text-gray-500">
                  {room.duration}分 · 目標 {room.targetPomodoros} 次 · {room.participants} 人已預約
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm ${
                      reminders.includes(room.id)
                        ? 'border-green-500 text-green-600'
                        : 'border-gray-200 text-gray-500'
                    }`}
                    onClick={() => toggleReminder(room.id)}
                  >
                    {reminders.includes(room.id) ? '已設定提醒' : '提醒我' }
                  </button>
                  <button
                    className="rounded-xl border border-purple-300 text-purple-500 text-sm px-3"
                    onClick={() => joinRoom(room.id)}
                  >
                    先加入
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
