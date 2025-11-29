import { useState } from 'react';
import { GraduationCap, User, ArrowRight } from 'lucide-react';

const SCHOOLS = [
  '國立台灣大學',
  '國立清華大學',
  '國立交通大學',
  '國立成功大學',
  '國立政治大學',
  '國立台灣師範大學',
  '國立中央大學',
  '國立中山大學',
  '國立中興大學',
  '國立陽明交通大學',
  '其他學校'
];

export function Onboarding({ onComplete }: { onComplete: (userData: any) => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');

  const handleSubmit = () => {
    if (name && school) {
      const userData = {
        id: Date.now().toString(),
        name,
        school,
        points: 0,
        totalMinutes: 0,
        createdAt: new Date().toISOString()
      };
      onComplete(userData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {step === 1 && (
          <div className="bg-white rounded-3xl p-8 shadow-2xl animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl mb-2">專注時光</h1>
              <p className="text-gray-600">與同學一起專注學習，為學校爭光</p>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white">🍅</span>
                  </div>
                  <div>
                    <h3 className="mb-1">番茄鐘專注</h3>
                    <p className="text-sm text-gray-600">設定時間專注學習，每分鐘獲得積分</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white">🏫</span>
                  </div>
                  <div>
                    <h3 className="mb-1">為學校爭光</h3>
                    <p className="text-sm text-gray-600">積分累積到學校，一起衝排行榜</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white">⚡</span>
                  </div>
                  <div>
                    <h3 className="mb-1">保持專注</h3>
                    <p className="text-sm text-gray-600">離開頁面會扣分，認真才能贏</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
              >
                開始使用
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-3xl p-8 shadow-2xl animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl mb-2">建立你的帳號</h2>
              <p className="text-gray-600">讓我們認識你</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm mb-2 text-gray-700">你的名字</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="請輸入你的名字"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              onClick={() => name && setStep(3)}
              disabled={!name}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl flex items-center justify-center gap-2 hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一步
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-3xl p-8 shadow-2xl animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl mb-2">選擇你的學校</h2>
              <p className="text-gray-600">一起為學校爭取榮譽</p>
            </div>

            <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
              {SCHOOLS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSchool(s)}
                  className={`w-full px-4 py-3 rounded-xl text-left transition-all ${
                    school === s
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!school}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl flex items-center justify-center gap-2 hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              完成註冊
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Clock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
