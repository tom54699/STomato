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
// CourseProgress 已移除，課程管理整合到 Schedule

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
    planId?: string;
  } | null>(null);

  // 模擬登入狀態檢查
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUser({ email: '', ...parsed });
    }
  }, []);

  // 若課表/待辦要求建立學習計畫，登入後自動導向讀書計畫頁
  useEffect(() => {
    if (!currentUser) return;
    const navigateToPlanner = localStorage.getItem('navigateToPlanner');
    if (navigateToPlanner) {
      localStorage.removeItem('navigateToPlanner');
      setCurrentPage('planner');
    }
  }, [currentUser]);

  // 監聽自訂事件，讓 Schedule 可直接觸發導向
  useEffect(() => {
    const handler = () => setCurrentPage('planner');
    window.addEventListener('navigateToPlanner', handler);
    return () => window.removeEventListener('navigateToPlanner', handler);
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
    planId?: string;
  }) => {
    setSettlementData(data);
    setCurrentPage('settlement');
  };

  const returnToHome = () => {
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
          planId={settlementData.planId}
          onReturnHome={returnToHome}
        />
      ) : (
        <>
          <div className="max-w-md mx-auto pb-24">
            {currentPage === 'home' && <Home user={currentUser} onPointsUpdate={updateUserPoints} onGoToSettlement={goToSettlement} onNavigateToPlanner={() => setCurrentPage('planner')} />}
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
