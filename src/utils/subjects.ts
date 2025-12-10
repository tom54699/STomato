/**
 * 中央科目管理模組
 * 統一管理課表、讀書計畫、洞察分析的科目資料
 */

export interface Subject {
  id: string;
  name: string;
  color: string;
  category?: '必修' | '選修' | '通識' | '其他';
}

// 預設科目列表（從課表和現有資料整合）
export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'math', name: '微積分', color: 'bg-blue-400', category: '必修' },
  { id: 'english', name: '英文', color: 'bg-green-400', category: '必修' },
  { id: 'physics', name: '物理', color: 'bg-red-400', category: '必修' },
  { id: 'chemistry', name: '化學', color: 'bg-yellow-400', category: '必修' },
  { id: 'programming', name: '程式設計', color: 'bg-purple-400', category: '必修' },
  { id: 'ds', name: '資料結構', color: 'bg-indigo-400', category: '選修' },
  { id: 'algo', name: '演算法', color: 'bg-pink-400', category: '選修' },
  { id: 'db', name: '資料庫', color: 'bg-teal-400', category: '選修' },
];

// 科目顏色對應（用於快速查詢）
export const SUBJECT_COLORS: { [key: string]: string } = DEFAULT_SUBJECTS.reduce((acc, subject) => {
  acc[subject.name] = subject.color;
  return acc;
}, {} as { [key: string]: string });

/**
 * 從 localStorage 獲取用戶自訂科目
 */
export function getUserSubjects(): Subject[] {
  const stored = localStorage.getItem('subjects');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse subjects:', e);
    }
  }
  return DEFAULT_SUBJECTS;
}

/**
 * 儲存用戶科目到 localStorage
 */
export function saveUserSubjects(subjects: Subject[]): void {
  localStorage.setItem('subjects', JSON.stringify(subjects));
}

/**
 * 新增科目
 */
export function addSubject(name: string, color: string, category?: '必修' | '選修' | '通識' | '其他'): Subject {
  const subjects = getUserSubjects();
  const newSubject: Subject = {
    id: `subject-${Date.now()}`,
    name,
    color,
    category,
  };
  subjects.push(newSubject);
  saveUserSubjects(subjects);
  return newSubject;
}

/**
 * 根據 ID 查找科目
 */
export function findSubjectById(id: string): Subject | undefined {
  const subjects = getUserSubjects();
  return subjects.find(s => s.id === id);
}

/**
 * 根據名稱查找科目（模糊匹配）
 */
export function findSubjectByName(name: string): Subject | undefined {
  const subjects = getUserSubjects();
  return subjects.find(s => s.name === name || s.name.includes(name));
}

/**
 * 獲取科目顏色（支援 ID 或名稱）
 */
export function getSubjectColor(idOrName: string): string {
  const subjects = getUserSubjects();
  const subject = subjects.find(s => s.id === idOrName || s.name === idOrName);
  return subject?.color || 'bg-gray-400';
}

/**
 * 獲取科目名稱（根據 ID）
 */
export function getSubjectName(id: string): string {
  const subject = findSubjectById(id);
  return subject?.name || '';
}

/**
 * 從課表課程提取科目並合併到科目列表
 */
export function extractSubjectsFromClasses(classes: { name: string; color: string }[]): void {
  const subjects = getUserSubjects();
  const existingNames = new Set(subjects.map(s => s.name));

  const newSubjects = classes
    .filter(cls => !existingNames.has(cls.name))
    .map(cls => ({
      id: `subject-${Date.now()}-${cls.name}`,
      name: cls.name,
      color: cls.color,
      category: '其他' as const,
    }));

  if (newSubjects.length > 0) {
    saveUserSubjects([...subjects, ...newSubjects]);
  }
}

/**
 * 從讀書計畫提取科目並合併到科目列表
 */
export function extractSubjectsFromPlans(plans: { subject?: string }[]): void {
  const subjects = getUserSubjects();
  const existingNames = new Set(subjects.map(s => s.name));

  const newSubjects = plans
    .filter(plan => plan.subject && !existingNames.has(plan.subject))
    .map(plan => ({
      id: `subject-${Date.now()}-${plan.subject}`,
      name: plan.subject!,
      color: 'bg-gray-400', // 預設顏色
      category: '其他' as const,
    }));

  if (newSubjects.length > 0) {
    saveUserSubjects([...subjects, ...newSubjects]);
  }
}
