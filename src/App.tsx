import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { Leaderboard } from './components/Leaderboard';
import { StudyPlanner } from './components/StudyPlanner';
import { Schedule } from './components/Schedule';
import { Profile } from './components/Profile';
import { Login } from './components/Login';
import { Navigation } from './components/Navigation';
import { Insights } from './components/Insights';
import { Settlement } from './components/Settlement';
import { FocusHistory } from './components/FocusHistory';

export type User = {
  id: string;
  name: string;
  email: string;
  school: string;
  totalPoints: number;
};

export type School = {
  name: string;
  totalPoints: number;
  studentCount: number;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'planner' | 'schedule' | 'insights' | 'leaderboard' | 'profile' | 'settlement' | 'history'>('home');
  const [settlementData, setSettlementData] = useState<{
    sessionMinutes: number;
    pointsEarned: number;
    planTitle?: string;
    planPercent?: number;
    planId?: string;
    previousNote?: string;
    previousCompletionPercent?: number;
  } | null>(null);

  // 模擬登入狀態檢查
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUser({ email: '', ...parsed });
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const updateUserPoints = (points: number) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, totalPoints: currentUser.totalPoints + points };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  const goToSettlement = (data: {
    sessionMinutes: number;
    pointsEarned: number;
    planTitle?: string;
    planPercent?: number;
    planId?: string;
  }) => {
    setSettlementData(data);
    setCurrentPage('settlement');
  };

  const returnToHome = (note: string, completionPercent: number) => {
    // 更新最後一筆焦點日誌的完成度和備註
    if (note || completionPercent !== 100) {
      const raw = localStorage.getItem('focusLogs');
      if (raw) {
        try {
          const logs = JSON.parse(raw) as Array<any>;
          if (logs.length > 0) {
            // 更新最後一筆日誌
            logs[logs.length - 1] = {
              ...logs[logs.length - 1],
              note: note || undefined,
              completionPercent: completionPercent
            };
            localStorage.setItem('focusLogs', JSON.stringify(logs));
          }
        } catch (error) {
          console.warn('Failed to update focusLogs', error);
        }
      }
    }
    setSettlementData(null);
    setCurrentPage('home');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {currentPage === 'settlement' && settlementData ? (
        <Settlement
          user={currentUser}
          sessionMinutes={settlementData.sessionMinutes}
          pointsEarned={settlementData.pointsEarned}
          planTitle={settlementData.planTitle}
          planPercent={settlementData.planPercent}
          planId={settlementData.planId}
          previousNote={settlementData.previousNote}
          previousCompletionPercent={settlementData.previousCompletionPercent}
          onReturnHome={returnToHome}
        />
      ) : (
        <>
          <div className="max-w-md mx-auto pb-24">
            {currentPage === 'home' && <Home user={currentUser} onPointsUpdate={updateUserPoints} onGoToSettlement={goToSettlement} />}
            {currentPage === 'planner' && <StudyPlanner user={currentUser} />}
            {currentPage === 'schedule' && <Schedule />}
            {currentPage === 'insights' && <Insights user={currentUser} onViewHistory={() => setCurrentPage('history')} />}
            {currentPage === 'leaderboard' && <Leaderboard currentUser={currentUser} />}
            {currentPage === 'profile' && <Profile user={currentUser} onLogout={handleLogout} />}
            {currentPage === 'history' && <FocusHistory user={currentUser} onBack={() => setCurrentPage('home')} />}
          </div>

          <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
        </>
      )}
    </div>
  );
}
