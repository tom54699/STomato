import { useEffect, useMemo, useState } from 'react';
import { User } from '../App';
import { BarChart3, Activity, CalendarRange, Sparkles, CheckCircle2, Clock, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';

type FocusLog = {
  id: string;
  date: string;
  minutes: number;
  timestamp: number;
  planId?: string;
  planTitle?: string;
  subject?: string; // 科目分類
  location?: string;
};

type StudyPlan = {
  id: string;
  title: string;
  subject?: string; // 科目分類（選填）
  date: string;
  startTime: string;
  endTime: string;
  reminderTime: string;
  completed: boolean;
  targetMinutes?: number;
  completedMinutes?: number;
  pomodoroCount?: number;
};

// 新增：多層級時間區間類型定義
type TimeRange = 'week' | 'month' | 'custom' | 'lifetime';

interface TimeRangeStats {
  totalPomodoros: number;
  totalMinutes: number;
  activeDays: number;
  totalDays: number;
  comparison: {
    pomodorosDelta: number;
    minutesDelta: number;
    activeDaysDelta: number;
  };
  currentStreak: number;
  longestStreak?: number;
  chartData: ChartDataPoint[];
  detailedData?: {
    heatmap?: HeatmapData[];
    topSubjects?: SubjectStat[];
    bestRecords?: BestRecords;
  };
}

interface ChartDataPoint {
  label: string;
  value: number;
  date: string;
}

interface HeatmapData {
  date: string;
  day: number;
  minutes: number;
  sessions: number;
}

interface SubjectStat {
  name: string;
  minutes: number;
  count: number;
  percentage: number;
}

interface BestRecords {
  bestDay: { date: string; minutes: number; sessions: number };
  bestWeek: { startDate: string; minutes: number; sessions: number };
  bestMonth: { month: string; minutes: number; sessions: number };
}

type InsightsProps = {
  user: User;
  onViewHistory?: () => void;
};

const weekdayShort = ['一', '二', '三', '四', '五', '六', '日'];

// SummaryCard 組件
interface SummaryCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  comparison?: { value: number; label: string };
  bgColor: string;
  textColor: string;
}

function SummaryCard({ title, value, subtitle, comparison, bgColor, textColor }: SummaryCardProps) {
  return (
    <div className={`${bgColor} rounded-2xl p-4`}>
      <p className={`${textColor} text-sm`}>{title}</p>
      <p className={`text-3xl ${textColor} font-bold mt-1`}>{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
      )}
      {comparison && (
        <p className={`text-xs mt-1 ${comparison.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {comparison.value >= 0 ? '↑' : '↓'} {Math.abs(comparison.value)}% {comparison.label}
        </p>
      )}
    </div>
  );
}

// MatchstickChart 組件（週/月）
interface MatchstickChartProps {
  data: ChartDataPoint[];
  height?: number;
  onBarClick?: (dataPoint: ChartDataPoint) => void;
}

function MatchstickChart({ data, height = 24, onBarClick }: MatchstickChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  // 計算是否需要滾動
  const minBarWidth = 16; // 每個柱子最小寬度 16px
  const totalWidth = data.length * minBarWidth;
  const needsScroll = data.length > 15; // 超過 15 個就需要滾動

  return (
    <div className="space-y-2">
      {needsScroll && (
        <div className="text-xs text-gray-500 text-center">
          ← 左右滑動查看 →
        </div>
      )}
      <div className={`${needsScroll ? 'overflow-x-auto' : ''}`}>
        <div
          className="flex items-end gap-0.5"
          style={{
            height: `${height}px`,
            minWidth: needsScroll ? `${totalWidth}px` : 'auto',
            width: needsScroll ? `${totalWidth}px` : '100%'
          }}
        >
          {data.map((point, idx) => {
            const barHeight = (point.value / maxValue) * height;
            return (
              <div
                key={idx}
                className={`${needsScroll ? '' : 'flex-1'} flex flex-col items-center gap-1 cursor-pointer group`}
                style={needsScroll ? { width: `${minBarWidth}px`, minWidth: `${minBarWidth}px` } : {}}
                onClick={() => onBarClick?.(point)}
              >
                <div
                  className="w-full bg-orange-400 group-hover:bg-orange-500 rounded-t transition-all"
                  style={{ height: `${barHeight}px` }}
                  title={`${point.label}: ${point.value} 個番茄鐘`}
                />
                <span className="text-[8px] text-gray-500 whitespace-nowrap">{point.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// MiniLineChart 組件（半年/年/生涯）
interface LineChartProps {
  data: ChartDataPoint[];
  height?: number;
  onClick?: () => void;
}

function MiniLineChart({ data, height = 30, onClick }: LineChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const width = 200;
  const points = data.map((point, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - (point.value / maxValue) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div
      className="cursor-pointer group"
      onClick={onClick}
    >
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke="#f97316"
          strokeWidth="2"
          className="group-hover:stroke-orange-600 transition-colors"
        />
        {data.map((point, idx) => {
          const x = (idx / (data.length - 1)) * width;
          const y = height - (point.value / maxValue) * height;
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="2"
              fill="#f97316"
              className="group-hover:r-3 transition-all"
            />
          );
        })}
      </svg>
    </div>
  );
}

// DetailedChart 組件（抽屜內容 - 折線圖）
function DetailedChart({ data, timeRange }: { data: ChartDataPoint[]; timeRange: TimeRange }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-8 text-gray-500">
        暫無資料
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartHeight = 200;

  // 動態寬度：資料點多時自動擴展
  const minPointSpacing = 20; // 每個資料點最少 20px 寬度
  const baseWidth = 360;
  const chartWidth = Math.max(baseWidth, data.length * minPointSpacing + 80);
  const needsScroll = chartWidth > baseWidth;

  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // 計算點的位置
  const points = data.map((point, idx) => {
    const x = padding.left + (idx / Math.max(data.length - 1, 1)) * innerWidth;
    const y = padding.top + innerHeight - (point.value / maxValue) * innerHeight;
    return { x, y, ...point };
  });

  // 生成平滑曲線路徑（使用二次貝茲曲線）
  const smoothLinePath = points.map((point, idx) => {
    if (idx === 0) return `M ${point.x} ${point.y}`;
    const prevPoint = points[idx - 1];
    const midX = (prevPoint.x + point.x) / 2;
    return `Q ${prevPoint.x} ${prevPoint.y}, ${midX} ${(prevPoint.y + point.y) / 2} Q ${point.x} ${point.y}, ${point.x} ${point.y}`;
  }).join(' ');

  // 簡單折線（不平滑）
  const linePath = points.map((point, idx) =>
    `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  // 生成面積填充路徑
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`;

  // Y軸刻度
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const value = Math.round((maxValue / 4) * i);
    const y = padding.top + innerHeight - (value / maxValue) * innerHeight;
    return { value, y };
  }).reverse();

  // 決定是否顯示所有圓點（只在資料點少時顯示）
  const showAllDots = data.length <= 10;

  // X軸標籤顯示邏輯（更聰明的間隔）
  const labelInterval = data.length <= 7 ? 1 :
                        data.length <= 15 ? 2 :
                        data.length <= 31 ? Math.ceil(data.length / 8) :
                        Math.ceil(data.length / 10);

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <h3 className="text-gray-800 font-bold">
        {timeRange === 'week' && '本週每日統計'}
        {timeRange === 'month' && '本月每日統計'}
        {timeRange === 'custom' && '自訂期間統計'}
        {timeRange === 'lifetime' && '全歷程月度趨勢'}
      </h3>

      {/* 折線圖 */}
      <div className={`bg-gray-50 rounded-2xl p-4 relative ${needsScroll ? 'overflow-x-auto' : ''}`}>
        {needsScroll && (
          <div className="text-xs text-gray-500 mb-2 text-center">
            ← 左右滑動查看完整圖表 →
          </div>
        )}
        <svg
          width={chartWidth}
          height={chartHeight}
          className={needsScroll ? '' : 'mx-auto'}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* 網格線 */}
          {yTicks.map((tick, idx) => (
            <line
              key={`grid-${idx}`}
              x1={padding.left}
              y1={tick.y}
              x2={chartWidth - padding.right}
              y2={tick.y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ))}

          {/* Y軸刻度文字 */}
          {yTicks.map((tick, idx) => (
            <text
              key={`ytick-${idx}`}
              x={padding.left - 10}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#6b7280"
            >
              {tick.value}
            </text>
          ))}

          {/* 面積填充 */}
          <path
            d={areaPath}
            fill="url(#gradient)"
            opacity="0.2"
          />

          {/* 折線 */}
          <path
            d={linePath}
            fill="none"
            stroke="#f97316"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 只在資料點少時顯示所有圓點 */}
          {showAllDots && points.map((point, idx) => (
            <circle
              key={`dot-${idx}`}
              cx={point.x}
              cy={point.y}
              r="3.5"
              fill="#fff"
              stroke="#f97316"
              strokeWidth="2"
            />
          ))}

          {/* Hover 時顯示的圓點和垂直線 */}
          {hoveredIndex !== null && (
            <>
              {/* 垂直指示線 */}
              <line
                x1={points[hoveredIndex].x}
                y1={padding.top}
                x2={points[hoveredIndex].x}
                y2={chartHeight - padding.bottom}
                stroke="#f97316"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.5"
              />
              {/* 高亮圓點 */}
              <circle
                cx={points[hoveredIndex].x}
                cy={points[hoveredIndex].y}
                r="5"
                fill="#fff"
                stroke="#f97316"
                strokeWidth="2.5"
              />
            </>
          )}

          {/* 互動熱區（透明矩形） */}
          {points.map((point, idx) => {
            const hotspotWidth = innerWidth / points.length;
            return (
              <rect
                key={`hotspot-${idx}`}
                x={point.x - hotspotWidth / 2}
                y={padding.top}
                width={hotspotWidth}
                height={innerHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
              />
            );
          })}

          {/* X軸標籤 */}
          {points.map((point, idx) => {
            const showLabel = idx % labelInterval === 0 || idx === data.length - 1;
            if (!showLabel) return null;
            return (
              <text
                key={`xlabel-${idx}`}
                x={point.x}
                y={chartHeight - padding.bottom + 20}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {point.label}
              </text>
            );
          })}

          {/* 漸層定義 */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>

        {/* Hover Tooltip */}
        {hoveredIndex !== null && (
          <div
            className="absolute bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none"
            style={{
              left: `${points[hoveredIndex].x + 20}px`,
              top: `${points[hoveredIndex].y - 10}px`,
              transform: 'translateY(-100%)',
            }}
          >
            <div className="font-semibold">{data[hoveredIndex].label}</div>
            <div className="text-orange-300">{data[hoveredIndex].value} 個番茄鐘</div>
          </div>
        )}
      </div>

      {/* 統計摘要 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-orange-50 rounded-xl p-3 text-center">
          <p className="text-xs text-orange-700 mb-1">最高</p>
          <p className="text-lg font-bold text-orange-800">{maxValue}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-xs text-blue-700 mb-1">平均</p>
          <p className="text-lg font-bold text-blue-800">
            {Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length)}
          </p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-xs text-green-700 mb-1">總計</p>
          <p className="text-lg font-bold text-green-800">
            {data.reduce((sum, d) => sum + d.value, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}

// Heatmap 組件（抽屜內容 - 熱力圖）
function Heatmap({ data }: { data: HeatmapData[] }) {
  return (
    <div className="max-w-md mx-auto">
      <h3 className="text-gray-800 font-bold mb-4">活躍熱力圖</h3>
      <div className="grid grid-cols-7 gap-1">
        {data.map((day, idx) => {
          const intensity = day.sessions === 0 ? 0 :
            day.sessions <= 2 ? 1 :
            day.sessions <= 4 ? 2 : 3;
          const colors = [
            'bg-gray-100',
            'bg-orange-200',
            'bg-orange-400',
            'bg-orange-600',
          ];
          return (
            <div
              key={idx}
              className={`h-10 rounded ${colors[intensity]} flex items-center justify-center text-xs font-medium`}
              title={`${day.date}: ${day.sessions} 次, ${day.minutes} 分`}
            >
              {day.day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// LifetimeAchievements 組件（生涯成就分析）
function LifetimeAchievements({ stats }: { stats: TimeRangeStats }) {
  const bestRecords = stats.detailedData?.bestRecords;

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <h3 className="text-gray-800 font-bold">生涯學習成就</h3>

      {/* 總覽統計 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-2">🎯</div>
          <p className="text-xs text-indigo-700 mb-1">累積番茄鐘</p>
          <p className="text-2xl font-bold text-indigo-800">{stats.totalPomodoros}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-2">⏱️</div>
          <p className="text-xs text-purple-700 mb-1">累積分鐘</p>
          <p className="text-2xl font-bold text-purple-800">
            {stats.totalMinutes.toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-2">📅</div>
          <p className="text-xs text-green-700 mb-1">活躍天數</p>
          <p className="text-2xl font-bold text-green-800">{stats.activeDays}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 text-center border-2 border-amber-200">
          <div className="text-3xl mb-2">🔥</div>
          <p className="text-xs text-amber-700 mb-1">最長連續</p>
          <p className="text-2xl font-bold text-amber-800">{stats.longestStreak || 0} 天</p>
        </div>
      </div>

      {/* 最佳紀錄 */}
      {bestRecords && (
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            最佳紀錄
          </h4>
          <div className="space-y-3">
            {/* 最佳單日 */}
            <div className="flex items-center justify-between bg-orange-50 rounded-xl p-3">
              <div>
                <p className="text-xs text-orange-600 mb-1">🏆 最佳單日</p>
                <p className="text-sm font-semibold text-gray-700">{bestRecords.bestDay.date}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-orange-600">{bestRecords.bestDay.minutes}</p>
                <p className="text-xs text-orange-500">分鐘</p>
              </div>
            </div>

            {/* 最佳單週 */}
            <div className="flex items-center justify-between bg-pink-50 rounded-xl p-3">
              <div>
                <p className="text-xs text-pink-600 mb-1">🌟 最佳單週</p>
                <p className="text-sm font-semibold text-gray-700">
                  {bestRecords.bestWeek.startDate ?
                    `${new Date(bestRecords.bestWeek.startDate).getMonth() + 1}月` : '-'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-pink-600">{bestRecords.bestWeek.minutes}</p>
                <p className="text-xs text-pink-500">分鐘</p>
              </div>
            </div>

            {/* 最佳單月 */}
            <div className="flex items-center justify-between bg-purple-50 rounded-xl p-3">
              <div>
                <p className="text-xs text-purple-600 mb-1">💎 最佳單月</p>
                <p className="text-sm font-semibold text-gray-700">{bestRecords.bestMonth.month}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-purple-600">{bestRecords.bestMonth.minutes}</p>
                <p className="text-xs text-purple-500">分鐘</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 學習洞察 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4">
        <h4 className="text-sm font-bold text-gray-700 mb-2">📊 學習洞察</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• 平均每日：<span className="font-semibold text-indigo-600">
            {Math.round(stats.totalMinutes / Math.max(stats.activeDays, 1))} 分鐘
          </span></p>
          <p>• 平均每次：<span className="font-semibold text-indigo-600">
            {Math.round(stats.totalMinutes / Math.max(stats.totalPomodoros, 1))} 分鐘
          </span></p>
          <p>• 總學習時數：<span className="font-semibold text-indigo-600">
            {(stats.totalMinutes / 60).toFixed(1)} 小時
          </span></p>
        </div>
      </div>
    </div>
  );
}

export function Insights({ user, onViewHistory }: InsightsProps) {
  const [mainTab, setMainTab] = useState<'focus' | 'plans'>('focus');
  const [timeRange, setTimeRange] = useState<TimeRange>('month'); // 新增：預設為月
  const [customStartDate, setCustomStartDate] = useState<string>(''); // 自訂開始日期
  const [customEndDate, setCustomEndDate] = useState<string>(''); // 自訂結束日期
  const [drawerOpen, setDrawerOpen] = useState(false); // 新增：抽屜開關
  const [drawerContent, setDrawerContent] = useState<{ // 新增：抽屜內容
    type: 'chart' | 'heatmap' | 'ranking' | 'achievements';
    timeRange: TimeRange;
    data: any;
  } | null>(null);
  const [logs, setLogs] = useState<FocusLog[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,      // 摘要卡片區（預設展開）
    chart: true,        // 趨勢圖/成就區（預設展開）
    subjects: false,    // 最投入科目
    quality: false,     // 完成品質分析
    timeSlot: false,    // 時段分析
    cumulative: false,  // 累積進度
    suggestions: true,  // 智慧建議（預設展開）
  });

  // 新增：輔助函數
  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // 切換區塊展開/收合
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  function getComparisonLabel(timeRange: TimeRange): string {
    switch (timeRange) {
      case 'week': return 'vs 上週';
      case 'month': return 'vs 上月';
      case 'custom': return 'vs 前一期間';
      case 'lifetime': return '總累積';
    }
  }

  function calculatePercentChange(prev: number, current: number): number {
    if (prev === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / prev) * 100);
  }

  function calculateCurrentStreak(logs: FocusLog[], today: Date): number {
    const sortedDates = Array.from(new Set(logs.map(log => log.date))).sort().reverse();
    let streak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const checkDateStr = formatDate(checkDate);

      if (sortedDates.includes(checkDateStr)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  useEffect(() => {
    const savedLogs = localStorage.getItem('focusLogs');
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs) as FocusLog[]);
      } catch (error) {
        console.warn('Failed to parse focusLogs', error);
      }
    }
    const savedPlans = localStorage.getItem('studyPlans');
    if (savedPlans) {
      try {
        setPlans(JSON.parse(savedPlans) as StudyPlan[]);
      } catch (error) {
        console.warn('Failed to parse studyPlans', error);
      }
    }
  }, []);

  const weekStats = useMemo((): TimeRangeStats => {
    const today = new Date();

    // 本週資料（最近7天）
    const currentWeekLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      const diffDays = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays < 7;
    });

    // 上週資料
    const prevWeekLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      const diffDays = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 7 && diffDays < 14;
    });

    const totalPomodoros = currentWeekLogs.length;
    const totalMinutes = currentWeekLogs.reduce((sum, log) => sum + log.minutes, 0);
    const activeDays = new Set(currentWeekLogs.map(log => log.date)).size;

    const prevPomodoros = prevWeekLogs.length;
    const prevMinutes = prevWeekLogs.reduce((sum, log) => sum + log.minutes, 0);

    // 生成火柴棒圖資料（7天）
    const chartData: ChartDataPoint[] = Array.from({ length: 7 }).map((_, idx) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - idx));
      const dateStr = formatDate(day);
      const dailyLogs = logs.filter(log => log.date === dateStr);

      return {
        label: weekdayShort[idx],
        value: dailyLogs.length,
        date: dateStr,
      };
    });

    return {
      totalPomodoros,
      totalMinutes,
      activeDays,
      totalDays: 7,
      comparison: {
        pomodorosDelta: calculatePercentChange(prevPomodoros, totalPomodoros),
        minutesDelta: calculatePercentChange(prevMinutes, totalMinutes),
        activeDaysDelta: 0,
      },
      currentStreak: calculateCurrentStreak(logs, today),
      chartData,
    };
  }, [logs]);

  const monthStats = useMemo((): TimeRangeStats => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    // 本月資料
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const currentMonthLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= firstDay && logDate <= lastDay;
    });

    // 上月資料
    const prevMonthFirstDay = new Date(year, month - 1, 1);
    const prevMonthLastDay = new Date(year, month, 0);
    const prevMonthLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= prevMonthFirstDay && logDate <= prevMonthLastDay;
    });

    const totalPomodoros = currentMonthLogs.length;
    const totalMinutes = currentMonthLogs.reduce((sum, log) => sum + log.minutes, 0);
    const activeDays = new Set(currentMonthLogs.map(log => log.date)).size;

    const prevPomodoros = prevMonthLogs.length;
    const prevMinutes = prevMonthLogs.reduce((sum, log) => sum + log.minutes, 0);

    // 生成圖表資料（本月 1 號到今天）
    const todayDate = today.getDate(); // 今天是幾號
    const chartData: ChartDataPoint[] = Array.from({ length: todayDate }).map((_, idx) => {
      const day = new Date(year, month, idx + 1); // 從 1 號開始
      const dateStr = formatDate(day);
      const dailyLogs = currentMonthLogs.filter(log => log.date === dateStr);

      return {
        label: `${idx + 1}`,
        value: dailyLogs.length,
        date: dateStr,
      };
    });

    // 熱力圖資料（供抽屜使用 - 本月每一天）
    const heatmap: HeatmapData[] = Array.from({ length: daysInMonth }).map((_, idx) => {
      const dateObj = new Date(year, month, idx + 1);
      const dateStr = formatDate(dateObj);
      const dailyLogs = logs.filter(log => log.date === dateStr);
      return {
        date: dateStr,
        day: idx + 1,
        minutes: dailyLogs.reduce((sum, log) => sum + log.minutes, 0),
        sessions: dailyLogs.length,
      };
    });

    return {
      totalPomodoros,
      totalMinutes,
      activeDays,
      totalDays: todayDate, // 本月已過天數（1 號到今天）
      comparison: {
        pomodorosDelta: calculatePercentChange(prevPomodoros, totalPomodoros),
        minutesDelta: calculatePercentChange(prevMinutes, totalMinutes),
        activeDaysDelta: 0,
      },
      currentStreak: calculateCurrentStreak(logs, today),
      chartData,
      detailedData: { heatmap },
    };
  }, [logs]);

  const lifetimeStats = useMemo((): TimeRangeStats => {
    const today = new Date();
    const totalPomodoros = logs.length;
    const totalMinutes = logs.reduce((sum, log) => sum + log.minutes, 0);

    // Streak calculation
    const dateSet = new Set(logs.map(log => log.date));
    const sortedDates = Array.from(dateSet).sort();

    let longestStreak = 0;
    let currentStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, currentStreak);
    }

    const activeDays = dateSet.size;

    // Best single day
    const dailyMap: { [date: string]: { minutes: number; sessions: number } } = {};
    logs.forEach(log => {
      if (!dailyMap[log.date]) {
        dailyMap[log.date] = { minutes: 0, sessions: 0 };
      }
      dailyMap[log.date].minutes += log.minutes;
      dailyMap[log.date].sessions += 1;
    });

    const bestDay = Object.entries(dailyMap).reduce((best, [date, stats]) => {
      return stats.minutes > best.minutes ? { date, ...stats } : best;
    }, { date: '', minutes: 0, sessions: 0 });

    // Best week (7-day rolling window)
    let bestWeekMinutes = 0;
    let bestWeekStart = '';
    let bestWeekSessions = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      const weekEnd = new Date(sortedDates[i]);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);

      const weekLogs = logs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= weekStart && logDate <= weekEnd;
      });
      const weekMinutes = weekLogs.reduce((sum, log) => sum + log.minutes, 0);

      if (weekMinutes > bestWeekMinutes) {
        bestWeekMinutes = weekMinutes;
        bestWeekStart = formatDate(weekStart);
        bestWeekSessions = weekLogs.length;
      }
    }

    // Best month
    const monthlyMap: { [key: string]: FocusLog[] } = {};
    logs.forEach(log => {
      const logDate = new Date(log.date);
      const monthKey = `${logDate.getFullYear()}-${logDate.getMonth() + 1}`;
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = [];
      monthlyMap[monthKey].push(log);
    });

    const bestMonth = Object.entries(monthlyMap).reduce((best, [month, monthLogs]) => {
      const minutes = monthLogs.reduce((sum, log) => sum + log.minutes, 0);
      return minutes > best.minutes ? { month, minutes, sessions: monthLogs.length } : best;
    }, { month: '', minutes: 0, sessions: 0 });

    // 生成折線圖資料（全歷程月度趨勢）
    const chartData: ChartDataPoint[] = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, monthLogs]) => {
        const [year, month] = monthKey.split('-');
        return {
          label: `${month}月`,
          value: monthLogs.length,
          date: `${year}-${month.padStart(2, '0')}-01`,
        };
      });

    return {
      totalPomodoros,
      totalMinutes,
      activeDays,
      totalDays: activeDays,
      comparison: {
        pomodorosDelta: 0,
        minutesDelta: 0,
        activeDaysDelta: 0,
      },
      currentStreak: calculateCurrentStreak(logs, today),
      longestStreak,
      chartData,
      detailedData: {
        bestRecords: {
          bestDay,
          bestWeek: {
            startDate: bestWeekStart,
            minutes: bestWeekMinutes,
            sessions: bestWeekSessions,
          },
          bestMonth,
        },
      },
    };
  }, [logs]);

  const customStats = useMemo((): TimeRangeStats => {
    if (!customStartDate || !customEndDate) {
      // 如果沒有選擇日期，返回空統計
      return {
        totalPomodoros: 0,
        totalMinutes: 0,
        activeDays: 0,
        totalDays: 0,
        comparison: { pomodorosDelta: 0, minutesDelta: 0, activeDaysDelta: 0 },
        currentStreak: 0,
        chartData: [],
      };
    }

    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // 當前期間的資料
    const periodLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startDate && logDate <= endDate;
    });

    // 前一個相同長度的期間
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(startDate.getDate() - daysDiff);
    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(startDate.getDate() - 1);

    const prevPeriodLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= prevStartDate && logDate <= prevEndDate;
    });

    const totalPomodoros = periodLogs.length;
    const totalMinutes = periodLogs.reduce((sum, log) => sum + log.minutes, 0);
    const activeDays = new Set(periodLogs.map(log => log.date)).size;

    const prevPomodoros = prevPeriodLogs.length;
    const prevMinutes = prevPeriodLogs.reduce((sum, log) => sum + log.minutes, 0);

    // 生成圖表資料（根據天數決定粒度）
    let chartData: ChartDataPoint[] = [];
    if (daysDiff <= 31) {
      // 31天以內，每天一個點
      chartData = Array.from({ length: daysDiff }).map((_, idx) => {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + idx);
        const dateStr = formatDate(day);
        const dailyLogs = periodLogs.filter(log => log.date === dateStr);

        return {
          label: `${day.getMonth() + 1}/${day.getDate()}`,
          value: dailyLogs.length,
          date: dateStr,
        };
      });
    } else {
      // 超過31天，按週顯示
      const weeks = Math.ceil(daysDiff / 7);
      chartData = Array.from({ length: weeks }).map((_, idx) => {
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + idx * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        if (weekEnd > endDate) weekEnd.setTime(endDate.getTime());

        const weekLogs = periodLogs.filter(log => {
          const logDate = new Date(log.date);
          return logDate >= weekStart && logDate <= weekEnd;
        });

        return {
          label: `第${idx + 1}週`,
          value: weekLogs.length,
          date: formatDate(weekStart),
        };
      });
    }

    return {
      totalPomodoros,
      totalMinutes,
      activeDays,
      totalDays: daysDiff,
      comparison: {
        pomodorosDelta: calculatePercentChange(prevPomodoros, totalPomodoros),
        minutesDelta: calculatePercentChange(prevMinutes, totalMinutes),
        activeDaysDelta: 0,
      },
      currentStreak: calculateCurrentStreak(logs, new Date()),
      chartData,
    };
  }, [logs, customStartDate, customEndDate]);

  // 統一當前 Stats
  const currentStats = useMemo(() => {
    switch (timeRange) {
      case 'week': return weekStats;
      case 'month': return monthStats;
      case 'custom': return customStats;
      case 'lifetime': return lifetimeStats;
      default: return monthStats;
    }
  }, [timeRange, weekStats, monthStats, customStats, lifetimeStats]);

  const weekComparison = useMemo(() => {
    const today = new Date();

    // Current week (last 7 days)
    const currentWeekLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      const diffDays = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays < 7;
    });

    // Previous week (days 7-13 ago)
    const prevWeekLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      const diffDays = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 7 && diffDays < 14;
    });

    const currentMinutes = currentWeekLogs.reduce((sum, log) => sum + log.minutes, 0);
    const currentSessions = currentWeekLogs.length;
    const prevMinutes = prevWeekLogs.reduce((sum, log) => sum + log.minutes, 0);
    const prevSessions = prevWeekLogs.length;

    const minutesDelta = prevMinutes > 0
      ? Math.round(((currentMinutes - prevMinutes) / prevMinutes) * 100)
      : (currentMinutes > 0 ? 100 : 0);

    const sessionsDelta = prevSessions > 0
      ? Math.round(((currentSessions - prevSessions) / prevSessions) * 100)
      : (currentSessions > 0 ? 100 : 0);

    const activeDays = new Set(currentWeekLogs.map(log => log.date)).size;

    return {
      currentMinutes,
      currentSessions,
      minutesDelta,
      sessionsDelta,
      activeDays,
    };
  }, [logs]);

  const qualityStats = useMemo(() => {
    if (logs.length === 0) {
      return {
        avgDuration: 0,
        completionRate: 0,
        interruptionRate: 0,
        shortSessions: 0,
        standardSessions: 0,
        longSessions: 0,
      };
    }

    const totalSessions = logs.length;
    const avgDuration = Math.round(logs.reduce((sum, log) => sum + log.minutes, 0) / totalSessions);

    const shortSessions = logs.filter(log => log.minutes < 20).length;
    const standardSessions = logs.filter(log => log.minutes >= 20 && log.minutes <= 30).length;
    const longSessions = logs.filter(log => log.minutes > 30).length;

    const completionRate = Math.round(((standardSessions + longSessions) / totalSessions) * 100);
    const interruptionRate = Math.round((shortSessions / totalSessions) * 100);

    return {
      avgDuration,
      completionRate,
      interruptionRate,
      shortSessions,
      standardSessions,
      longSessions,
    };
  }, [logs]);

  // 計畫分析統計
  const planStats = useMemo(() => {
    const today = new Date();

    // 根據時間範圍過濾計畫
    let filteredPlans = plans;
    if (timeRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 6);
      filteredPlans = plans.filter(plan => {
        const planDate = new Date(plan.date);
        return planDate >= weekAgo && planDate <= today;
      });
    } else if (timeRange === 'month') {
      const year = today.getFullYear();
      const month = today.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      filteredPlans = plans.filter(plan => {
        const planDate = new Date(plan.date);
        return planDate >= firstDay && planDate <= lastDay;
      });
    }
    // lifetime 不過濾，使用全部計畫

    const weekPlans = filteredPlans;

    const completedPlans = weekPlans.filter(p => p.completed);
    const inProgressPlans = weekPlans.filter(p => !p.completed && (p.completedMinutes || 0) > 0);
    const notStartedPlans = weekPlans.filter(p => !p.completed && !(p.completedMinutes || 0));

    const completionRate = weekPlans.length > 0 ? Math.round((completedPlans.length / weekPlans.length) * 100) : 0;

    // 科目/標題分析（優先使用 subject，沒有則使用 planTitle）
    const subjectStats: { [key: string]: { minutes: number; count: number } } = {};
    logs.forEach(log => {
      const key = log.subject || log.planTitle;
      if (key) {
        if (!subjectStats[key]) {
          subjectStats[key] = { minutes: 0, count: 0 };
        }
        subjectStats[key].minutes += log.minutes;
        subjectStats[key].count += 1;
      }
    });
    const sortedSubjects = Object.entries(subjectStats)
      .sort((a, b) => b[1].minutes - a[1].minutes)
      .slice(0, 5);

    // 時段分析
    const timeSlotStats = {
      morning: { count: 0, completed: 0 },   // 6-12
      afternoon: { count: 0, completed: 0 }, // 12-18
      evening: { count: 0, completed: 0 },   // 18-24
    };
    weekPlans.forEach(plan => {
      const hour = parseInt(plan.startTime.split(':')[0]);
      let slot: 'morning' | 'afternoon' | 'evening' = 'morning';
      if (hour >= 12 && hour < 18) slot = 'afternoon';
      else if (hour >= 18) slot = 'evening';

      timeSlotStats[slot].count += 1;
      if (plan.completed) timeSlotStats[slot].completed += 1;
    });

    // 累積進度統計
    const plansWithProgress = weekPlans.filter(p => p.targetMinutes && p.targetMinutes > 0);
    const avgPomodorosPerPlan = plansWithProgress.length > 0
      ? Math.round(plansWithProgress.reduce((sum, p) => sum + (p.pomodoroCount || 0), 0) / plansWithProgress.length * 10) / 10
      : 0;
    const totalTargetMinutes = plansWithProgress.reduce((sum, p) => sum + (p.targetMinutes || 0), 0);
    const totalCompletedMinutes = plansWithProgress.reduce((sum, p) => sum + (p.completedMinutes || 0), 0);
    const overallProgress = totalTargetMinutes > 0 ? Math.round((totalCompletedMinutes / totalTargetMinutes) * 100) : 0;

    return {
      total: weekPlans.length,
      completed: completedPlans.length,
      inProgress: inProgressPlans.length,
      notStarted: notStartedPlans.length,
      completionRate,
      sortedSubjects,
      timeSlotStats,
      avgPomodorosPerPlan,
      overallProgress,
      totalTargetMinutes,
      totalCompletedMinutes,
    };
  }, [plans, logs, timeRange]);

  const dynamicSuggestions = useMemo(() => {
    const suggestions: string[] = [];

    if (logs.length === 0) {
      return ['完成 1 個番茄鐘來解鎖個人化建議'];
    }

    // 根據時間範圍調整建議
    if (timeRange === 'week') {
      if (currentStats.currentStreak === 0) {
        suggestions.push('今天還沒有紀錄，開始一個番茄鐘延續學習習慣！');
      } else if (currentStats.comparison.minutesDelta < -20) {
        suggestions.push(`本週專注時長下降 ${Math.abs(currentStats.comparison.minutesDelta)}%，試著恢復上週的學習節奏`);
      }

      if (currentStats.activeDays < 5) {
        suggestions.push(`本週活躍 ${currentStats.activeDays}/7 天，保持每天學習可提升效果`);
      }
    } else if (timeRange === 'month') {
      const activeRatio = currentStats.activeDays / currentStats.totalDays;
      if (activeRatio < 0.5) {
        suggestions.push(`本月活躍天數僅 ${Math.round(activeRatio * 100)}%，試著每天至少完成 1 個番茄鐘`);
      } else if (activeRatio >= 0.8) {
        suggestions.push(`🌟 本月活躍度極高（${Math.round(activeRatio * 100)}%），繼續保持！`);
      }

      if (currentStats.comparison.pomodorosDelta > 20) {
        suggestions.push(`本月進步顯著！番茄鐘數提升 ${currentStats.comparison.pomodorosDelta}%`);
      }
    } else if (timeRange === 'lifetime') {
      if ((lifetimeStats.longestStreak || 0) >= 30) {
        suggestions.push('🏆 你已經達成連續30天成就！保持這個驚人的習慣');
      }

      if (lifetimeStats.totalPomodoros >= 100) {
        suggestions.push('🎉 已完成超過100個番茄鐘，你是真正的專注達人！');
      }
    }

    // 通用建議：連續天數
    if (currentStats.currentStreak >= 3 && currentStats.currentStreak < 7) {
      suggestions.push(`🔥 已連續 ${currentStats.currentStreak} 天！再堅持 ${7 - currentStats.currentStreak} 天達成一週連續目標`);
    } else if (currentStats.currentStreak >= 7 && timeRange !== 'lifetime') {
      suggestions.push(`🏆 太棒了！已連續 ${currentStats.currentStreak} 天，保持這個勢頭！`);
    }

    // 品質建議（適用所有時間範圍）
    if (qualityStats.interruptionRate > 30 && logs.length >= 5) {
      suggestions.push(`最近中斷率較高（${qualityStats.interruptionRate}%），試著減少外部干擾或調整番茄鐘時長`);
    }

    return suggestions.slice(0, 3);
  }, [timeRange, currentStats, lifetimeStats, qualityStats, logs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 space-y-5">
      <header className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-10 h-10 text-indigo-500" />
          <div>
            <p className="text-gray-500 text-sm">學習洞察</p>
            <h1 className="text-gray-800 text-xl">數據分析報告</h1>
          </div>
        </div>
        <p className="text-gray-500 mt-2 text-sm">根據最近 7 天紀錄，提供建議與成就</p>

        {/* 主分頁切換 */}
        <div className="mt-4 bg-gray-100 rounded-2xl p-1.5 flex gap-1">
          <button
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              mainTab === 'focus'
                ? 'bg-white shadow-md text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setMainTab('focus')}
          >
            📊 專注趨勢
          </button>
          <button
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              mainTab === 'plans'
                ? 'bg-white shadow-md text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setMainTab('plans')}
          >
            📅 計畫分析
          </button>
        </div>
      </header>

      {/* 專注趨勢分頁 */}
      {mainTab === 'focus' && (
        <>
          {/* 時間範圍選擇器 */}
          <div className="bg-white rounded-3xl shadow-lg p-4 space-y-3">
            <div className="bg-gray-100 rounded-2xl p-1.5 flex gap-1">
              {[
                { value: 'week', label: '週' },
                { value: 'month', label: '月' },
                { value: 'custom', label: '自訂' },
                { value: 'lifetime', label: '生涯' },
              ].map((option) => (
                <button
                  key={option.value}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    timeRange === option.value
                      ? 'bg-white shadow-md text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setTimeRange(option.value as TimeRange)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* 自訂日期選擇器 */}
            {timeRange === 'custom' && (
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <label className="text-xs text-gray-600 block mb-1">開始日期</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-600 block mb-1">結束日期</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    min={customStartDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Empty State */}
          {currentStats.totalPomodoros === 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-3xl p-8 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-gray-800 font-bold mb-2">
                {timeRange === 'week' && '本週還沒有紀錄'}
                {timeRange === 'month' && '本月還沒有紀錄'}
                {timeRange === 'custom' && (!customStartDate || !customEndDate ? '請選擇開始與結束日期' : '所選時間範圍內沒有紀錄')}
                {timeRange === 'lifetime' && '開始你的第一個番茄鐘'}
              </h3>
              <p className="text-gray-600 text-sm">
                完成番茄鐘後，這裡會顯示詳細的統計與分析
              </p>
            </div>
          )}

          {/* 摘要卡片和迷你圖區 */}
          {currentStats.totalPomodoros > 0 && (
            <>
              {/* 摘要卡片區 */}
              <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
                <h2
                  className="text-gray-800 font-bold flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSection('summary')}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    <span>
                      {timeRange === 'week' && '本週概況'}
                      {timeRange === 'month' && '本月概況'}
                      {timeRange === 'custom' && '自訂期間概況'}
                      {timeRange === 'lifetime' && '生涯總覽'}
                    </span>
                  </div>
                  {expandedSections.summary ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </h2>

                {expandedSections.summary && (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <SummaryCard
                    title="番茄鐘數"
                    value={currentStats.totalPomodoros}
                    subtitle={`${currentStats.activeDays} 天活躍`}
                    comparison={
                      timeRange !== 'lifetime' ? {
                        value: currentStats.comparison.pomodorosDelta,
                        label: getComparisonLabel(timeRange),
                      } : undefined
                    }
                    bgColor="bg-indigo-50"
                    textColor="text-indigo-600"
                  />

                  <SummaryCard
                    title="專注分鐘"
                    value={currentStats.totalMinutes}
                    subtitle={`平均 ${Math.round(currentStats.totalMinutes / Math.max(currentStats.activeDays, 1))} 分/天`}
                    comparison={
                      timeRange !== 'lifetime' ? {
                        value: currentStats.comparison.minutesDelta,
                        label: getComparisonLabel(timeRange),
                      } : undefined
                    }
                    bgColor="bg-purple-50"
                    textColor="text-purple-600"
                  />

                  <SummaryCard
                    title="連續天數"
                    value={`${currentStats.currentStreak} 天`}
                    subtitle={`活躍率 ${Math.round((currentStats.activeDays / currentStats.totalDays) * 100)}%`}
                    bgColor="bg-green-50"
                    textColor="text-green-600"
                  />
                  </div>
                )}
              </section>

              {/* 趨勢圖/成就區 */}
              <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
                <h2
                  className="text-gray-800 font-bold flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSection('chart')}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-500" />
                    <span>{timeRange === 'lifetime' ? '學習成就' : '趨勢分析'}</span>
                  </div>
                  {expandedSections.chart ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </h2>

                {expandedSections.chart && (
                  timeRange === 'lifetime' ? (
                    <LifetimeAchievements stats={lifetimeStats} />
                  ) : (
                    <DetailedChart data={currentStats.chartData} timeRange={timeRange} />
                  )
                )}
              </section>
            </>
          )}

          {/* 生涯回顧特殊設計 */}
          {timeRange === 'lifetime' && currentStats.totalPomodoros > 0 && (
            <>
              {/* 學習亮點卡片 */}
              <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
                <h2 className="text-gray-800 font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  學習亮點
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-yellow-50 rounded-2xl p-4 text-center">
                    <p className="text-yellow-700 text-xs mb-1">最佳單日</p>
                    <p className="text-2xl text-yellow-800 font-bold">
                      {lifetimeStats.detailedData?.bestRecords?.bestDay.minutes || 0} 分
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      {lifetimeStats.detailedData?.bestRecords?.bestDay.date || '-'}
                    </p>
                  </div>

                  <div className="bg-pink-50 rounded-2xl p-4 text-center">
                    <p className="text-pink-700 text-xs mb-1">最佳單週</p>
                    <p className="text-2xl text-pink-800 font-bold">
                      {lifetimeStats.detailedData?.bestRecords?.bestWeek.minutes || 0} 分
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-2xl p-4 text-center">
                    <p className="text-purple-700 text-xs mb-1">最佳單月</p>
                    <p className="text-2xl text-purple-800 font-bold">
                      {lifetimeStats.detailedData?.bestRecords?.bestMonth.minutes || 0} 分
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-2xl p-4 text-center border-2 border-green-200">
                    <p className="text-green-700 text-xs mb-1">🔥 最長連續</p>
                    <p className="text-2xl text-green-800 font-bold">
                      {lifetimeStats.longestStreak || 0} 天
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* 智慧建議 */}
          <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
            <h2
              className="text-gray-800 font-bold flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('suggestions')}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>智慧建議</span>
              </div>
              {expandedSections.suggestions ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </h2>

            {expandedSections.suggestions && (
              dynamicSuggestions.length === 1 && dynamicSuggestions[0].includes('完成 1 個番茄鐘') ? (
                <div className="bg-amber-50 rounded-2xl p-6 text-center">
                  <p className="text-amber-700 text-sm">{dynamicSuggestions[0]}</p>
                </div>
              ) : (
                <ul className="space-y-3 text-gray-600 text-sm">
                  {dynamicSuggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-amber-500">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              )
            )}
          </section>
        </>
      )}

      {/* 計畫分析分頁 */}
      {mainTab === 'plans' && (
        <>
          {/* 時間範圍選擇器 */}
          <div className="bg-white rounded-3xl shadow-lg p-4 space-y-3">
            <div className="bg-gray-100 rounded-2xl p-1.5 flex gap-1">
              {[
                { value: 'week', label: '週' },
                { value: 'month', label: '月' },
                { value: 'custom', label: '自訂' },
                { value: 'lifetime', label: '生涯' },
              ].map((option) => (
                <button
                  key={option.value}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    timeRange === option.value
                      ? 'bg-white shadow-md text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setTimeRange(option.value as TimeRange)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* 自訂日期選擇器 */}
            {timeRange === 'custom' && (
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <label className="text-xs text-gray-600 block mb-1">開始日期</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-600 block mb-1">結束日期</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    min={customStartDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 完成率總覽 */}
          <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h2 className="text-gray-800">
                {timeRange === 'week' && '本週計畫概況'}
                {timeRange === 'month' && '本月計畫概況'}
                {timeRange === 'lifetime' && '全歷程計畫概況'}
              </h2>
            </div>

            {planStats.total === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-6 text-center">
                <p className="text-gray-500 text-sm">
                  {timeRange === 'week' && '本週尚未建立任何計畫'}
                  {timeRange === 'month' && '本月尚未建立任何計畫'}
                  {timeRange === 'lifetime' && '還沒有任何計畫紀錄'}
                </p>
                <p className="text-gray-400 text-xs mt-1">前往「讀書計畫」頁面新增計畫吧！</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 rounded-2xl p-4 text-center">
                    <p className="text-green-600 text-2xl font-bold">{planStats.completed}</p>
                    <p className="text-green-600 text-xs mt-1">已完成</p>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-4 text-center">
                    <p className="text-blue-600 text-2xl font-bold">{planStats.inProgress}</p>
                    <p className="text-blue-600 text-xs mt-1">進行中</p>
                  </div>
                  <div className="bg-gray-100 rounded-2xl p-4 text-center">
                    <p className="text-gray-600 text-2xl font-bold">{planStats.notStarted}</p>
                    <p className="text-gray-600 text-xs mt-1">未開始</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-green-700 text-sm font-medium">完成率</span>
                    <span className="text-green-700 text-2xl font-bold">{planStats.completionRate}%</span>
                  </div>
                  <div className="h-3 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                      style={{ width: `${planStats.completionRate}%` }}
                    />
                  </div>
                  <p className="text-green-600 text-xs mt-2">
                    {timeRange === 'week' && `本週共 ${planStats.total} 個計畫`}
                    {timeRange === 'month' && `本月共 ${planStats.total} 個計畫`}
                    {timeRange === 'lifetime' && `累積共 ${planStats.total} 個計畫`}
                  </p>
                </div>
              </>
            )}
          </section>

          {/* 完成品質分析 */}
          <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setExpandedSections(prev => ({ ...prev, quality: !prev.quality }))}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <h2 className="text-gray-800">完成品質分析</h2>
              </div>
              {expandedSections.quality ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.quality && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 rounded-2xl p-4 text-center">
                    <p className="text-green-600 text-2xl font-bold">{qualityStats.completionRate}%</p>
                    <p className="text-green-600 text-xs mt-1">完成率</p>
                  </div>
                  <div className="bg-orange-50 rounded-2xl p-4 text-center">
                    <p className="text-orange-600 text-2xl font-bold">{qualityStats.interruptionRate}%</p>
                    <p className="text-orange-600 text-xs mt-1">中斷率</p>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-4 text-center">
                    <p className="text-blue-600 text-2xl font-bold">{qualityStats.avgDuration}</p>
                    <p className="text-blue-600 text-xs mt-1">平均時長(分)</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-sm text-gray-700 mb-2">時長分布</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>短期 (&lt;20分)</span>
                      <span>{qualityStats.shortSessions} 次</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>標準 (20-30分)</span>
                      <span>{qualityStats.standardSessions} 次</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>長期 (&gt;30分)</span>
                      <span>{qualityStats.longSessions} 次</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 科目時間分布 */}
          {planStats.sortedSubjects.length > 0 && (
            <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <h2 className="text-gray-800">最投入科目 Top 5</h2>
              </div>
              <div className="space-y-3">
                {planStats.sortedSubjects.map(([subject, stats], index) => {
                  const maxMinutes = planStats.sortedSubjects[0][1].minutes;
                  const widthPercent = (stats.minutes / maxMinutes) * 100;
                  const colors = [
                    'from-purple-400 to-purple-500',
                    'from-blue-400 to-blue-500',
                    'from-indigo-400 to-indigo-500',
                    'from-pink-400 to-pink-500',
                    'from-orange-400 to-orange-500',
                  ];
                  return (
                    <div key={subject} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-medium truncate flex-1">{subject}</span>
                        <span className="text-gray-500 ml-2">{stats.minutes} 分鐘 ({stats.count}🍅)</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${colors[index]} transition-all duration-500`}
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-gray-400 text-xs text-center mt-2">顯示學習時長最多的科目</p>
            </section>
          )}

          {/* 時段分析（可展開） */}
          {planStats.total > 0 && (
            <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
              <button
                className="w-full flex items-center justify-between"
                onClick={() => setExpandedSections(prev => ({ ...prev, timeSlot: !prev.timeSlot }))}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <h2 className="text-gray-800">時段分析</h2>
                </div>
                {expandedSections.timeSlot ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {expandedSections.timeSlot && (
                <div className="space-y-3 pt-2">
                  {[
                    { key: 'morning' as const, label: '早上 (6-12點)', emoji: '🌅', color: 'orange' },
                    { key: 'afternoon' as const, label: '下午 (12-18點)', emoji: '☀️', color: 'yellow' },
                    { key: 'evening' as const, label: '晚上 (18-24點)', emoji: '🌙', color: 'indigo' },
                  ].map(({ key, label, emoji, color }) => {
                    const stats = planStats.timeSlotStats[key];
                    const rate = stats.count > 0 ? Math.round((stats.completed / stats.count) * 100) : 0;
                    return (
                      <div key={key} className={`bg-${color}-50 rounded-2xl p-4`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {emoji} {label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {stats.count} 個計畫
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-${color}-400`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-10 text-right">
                            {rate}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          完成 {stats.completed} / {stats.count}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* 累積進度統計（可展開） */}
          {planStats.totalTargetMinutes > 0 && (
            <section className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
              <button
                className="w-full flex items-center justify-between"
                onClick={() => setExpandedSections(prev => ({ ...prev, cumulative: !prev.cumulative }))}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <h2 className="text-gray-800">累積進度追蹤</h2>
                </div>
                {expandedSections.cumulative ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {expandedSections.cumulative && (
                <div className="space-y-4 pt-2">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-blue-700 text-sm font-medium">整體進度</span>
                      <span className="text-blue-700 text-xl font-bold">{planStats.overallProgress}%</span>
                    </div>
                    <div className="h-3 bg-white rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500"
                        style={{ width: `${planStats.overallProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-blue-600">
                      <span>{planStats.totalCompletedMinutes} 分鐘</span>
                      <span>目標 {planStats.totalTargetMinutes} 分鐘</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 rounded-2xl p-4 text-center">
                      <p className="text-purple-600 text-2xl font-bold">{planStats.avgPomodorosPerPlan}</p>
                      <p className="text-purple-600 text-xs mt-1">平均番茄鐘數/計畫</p>
                    </div>
                    <div className="bg-pink-50 rounded-2xl p-4 text-center">
                      <p className="text-pink-600 text-2xl font-bold">
                        {planStats.totalCompletedMinutes}
                      </p>
                      <p className="text-pink-600 text-xs mt-1">累積完成分鐘</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-3 text-xs text-gray-600">
                    💡 提示：長時間計畫可透過多次番茄鐘累積完成
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 提示：沒有計畫時的引導 */}
          {planStats.total === 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl p-8 text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-gray-800 font-bold mb-2">開始建立你的學習計畫</h3>
              <p className="text-gray-600 text-sm mb-4">
                建立計畫後，這裡將顯示完整的計畫分析與統計
              </p>
            </div>
          )}
        </>
      )}

      {/* 底部抽屜 */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {drawerContent?.type === 'chart' && '詳細圖表'}
              {drawerContent?.type === 'heatmap' && '活躍熱力圖'}
              {drawerContent?.type === 'ranking' && '科目排行'}
              {drawerContent?.type === 'achievements' && '生涯成就'}
            </DrawerTitle>
          </DrawerHeader>

          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {drawerContent?.type === 'chart' && drawerContent.data && (
              <DetailedChart data={drawerContent.data} timeRange={drawerContent.timeRange} />
            )}
            {drawerContent?.type === 'heatmap' && drawerContent.data && (
              <Heatmap data={drawerContent.data} />
            )}
            {drawerContent?.type === 'achievements' && drawerContent.data && (
              <LifetimeAchievements stats={drawerContent.data} />
            )}
          </div>

          <DrawerFooter>
            <button
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium"
              onClick={() => setDrawerOpen(false)}
            >
              關閉
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
