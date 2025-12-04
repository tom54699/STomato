import { useState } from 'react';
import { User } from '../App';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';

type LoginProps = {
  onLogin: (user: User) => void;
};

const SCHOOLS = [
  '國立臺灣大學',
  '國立清華大學',
  '國立陽明交通大學',
  '國立成功大學',
  '國立政治大學',
  '國立臺灣師範大學',
  '國立中央大學',
  '國立中山大學',
  '國立中興大學',
  '國立臺北大學',
];

export function Login({ onLogin }: LoginProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('請輸入有效的 Email');
      return;
    }
    if (password.length < 8) {
      setError('密碼需至少 8 碼');
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      school,
      totalPoints: 0,
    };
    localStorage.setItem(`credentials:${email}`, password);
    setError('');
    onLogin(newUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍅</div>
          <h1 className="text-gray-800 mb-2">番茄鐘學習</h1>
          <p className="text-gray-600">專注學習，為學校爭光</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2">姓名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
              placeholder="請輸入您的姓名"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
              placeholder="至少 8 碼"
              minLength={8}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">選擇學校</label>
            <Select.Root value={school} onValueChange={setSchool} required>
              <Select.Trigger className="flex items-center justify-between w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors bg-white">
                <Select.Value placeholder="請選擇學校" />
                <Select.Icon>
                  <ChevronDown className="w-4 h-4" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="overflow-hidden bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-60">
                  <Select.Viewport className="p-1">
                    {SCHOOLS.map((s) => (
                      <Select.Item
                        key={s}
                        value={s}
                        className="relative flex items-center px-8 py-2 rounded-lg text-sm text-gray-800 cursor-pointer hover:bg-orange-50 focus:bg-orange-50 outline-none"
                      >
                        <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                          <Check className="w-4 h-4 text-orange-600" />
                        </Select.ItemIndicator>
                        <Select.ItemText>{s}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            開始學習之旅
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6 text-sm">
          完成番茄鐘為自己和學校賺取積分
        </p>
      </div>
    </div>
  );
}
