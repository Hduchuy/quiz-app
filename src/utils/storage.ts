import { CourseData, StudyProgress, ExamRecord, Question, UserAnswerRecord } from '../types/quiz';
import { DEFAULT_COURSE } from '../data/defaultCourse';

const STORAGE_KEYS = {
  COURSE_DATA: 'quiz_app_course_data',
  STUDY_PROGRESS: 'quiz_app_study_progress',
  EXAM_HISTORY: 'quiz_app_exam_history'
};

// 1. Course Data Management
function sanitizeCourseData(course: CourseData): CourseData {
  let needsUpdate = false;
  const isTFOptionLine = (str: string) => {
    const t = str.trim().toLowerCase();
    if (t === 'đúng' || t === 'sai') return true;
    if (/^[a-d][\.\)]\s*(đúng|sai)/i.test(t)) return true;
    return false;
  };

  const updatedTopics = course.topics.map(topic => {
    const defaultTopic = DEFAULT_COURSE.topics.find(t => t.id === topic.id);
    const updatedQuestions = topic.questions.map(q => {
      if (q.type === 'true_false' && q.statements) {
        const hasPolluted = q.statements.some(s => isTFOptionLine(s.text));
        if (hasPolluted) {
          needsUpdate = true;
          const defQ = defaultTopic?.questions.find(dq => dq.id === q.id);
          if (defQ && defQ.statements) {
            return { ...q, statements: defQ.statements };
          }
          const cleanStmts = q.statements
            .filter(s => !isTFOptionLine(s.text))
            .map((s, idx) => ({ ...s, id: `stmt_${idx + 1}` }));
          return { ...q, statements: cleanStmts };
        }
      }
      return q;
    });
    return { ...topic, questions: updatedQuestions };
  });

  if (needsUpdate) {
    const cleaned: CourseData = { ...course, topics: updatedTopics };
    try {
      localStorage.setItem(STORAGE_KEYS.COURSE_DATA, JSON.stringify(cleaned));
    } catch (_) {}
    return cleaned;
  }
  return course;
}

export function loadCourseData(): CourseData {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COURSE_DATA);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.topics && parsed.topics.length > 0) {
        return sanitizeCourseData(parsed);
      }
    }
  } catch (err) {
    console.error('Lỗi khi tải dữ liệu môn học từ localStorage:', err);
  }
  // Fallback to default bundled course
  saveCourseData(DEFAULT_COURSE);
  return DEFAULT_COURSE;
}

export function saveCourseData(course: CourseData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COURSE_DATA, JSON.stringify(course));
  } catch (err) {
    console.error('Lỗi khi lưu dữ liệu môn học vào localStorage:', err);
  }
}

export function resetToDefaultCourse(): CourseData {
  saveCourseData(DEFAULT_COURSE);
  return DEFAULT_COURSE;
}

export function updateCourseName(newName: string): CourseData {
  const current = loadCourseData();
  const updated = { ...current, name: newName, updatedAt: new Date().toISOString() };
  saveCourseData(updated);
  return updated;
}

export function updateQuestionInBank(updatedQuestion: Question): CourseData {
  const current = loadCourseData();
  let found = false;
  const updatedTopics = current.topics.map(topic => {
    if (topic.id === updatedQuestion.topicId) {
      const updatedQuestions = topic.questions.map(q => {
        if (q.id === updatedQuestion.id) {
          found = true;
          return { ...updatedQuestion, verificationStatus: 'verified' as const };
        }
        return q;
      });
      return { ...topic, questions: updatedQuestions };
    }
    return topic;
  });

  if (!found) {
    // Search in all topics if topicId changed or mismatch
    for (const t of updatedTopics) {
      const idx = t.questions.findIndex(q => q.id === updatedQuestion.id);
      if (idx !== -1) {
        t.questions[idx] = { ...updatedQuestion, verificationStatus: 'verified' as const };
        found = true;
        break;
      }
    }
  }

  const newCourse = { ...current, topics: updatedTopics, updatedAt: new Date().toISOString() };
  saveCourseData(newCourse);
  return newCourse;
}

// 2. Study Progress Management
export function loadStudyProgress(): StudyProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDY_PROGRESS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Lỗi khi tải tiến độ học tập:', err);
  }
  return {
    answeredQuestions: {},
    bookmarkedQuestionIds: []
  };
}

export function saveStudyProgress(progress: StudyProgress): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDY_PROGRESS, JSON.stringify(progress));
  } catch (err) {
    console.error('Lỗi khi lưu tiến độ học tập:', err);
  }
}

export function recordQuestionAnswer(record: UserAnswerRecord): StudyProgress {
  const current = loadStudyProgress();
  current.answeredQuestions[record.questionId] = record;
  saveStudyProgress(current);
  return current;
}

export function toggleBookmarkQuestion(questionId: string): StudyProgress {
  const current = loadStudyProgress();
  const idx = current.bookmarkedQuestionIds.indexOf(questionId);
  if (idx !== -1) {
    current.bookmarkedQuestionIds.splice(idx, 1);
  } else {
    current.bookmarkedQuestionIds.push(questionId);
  }
  saveStudyProgress(current);
  return current;
}

export function resetStudyProgress(): void {
  localStorage.removeItem(STORAGE_KEYS.STUDY_PROGRESS);
}

// 3. Exam History Management
export function loadExamHistory(): ExamRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAM_HISTORY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Lỗi khi tải lịch sử thi thử:', err);
  }
  return [];
}

export function saveExamResult(exam: ExamRecord): ExamRecord[] {
  const current = loadExamHistory();
  const updated = [exam, ...current].slice(0, 30); // keep recent 30 exams
  try {
    localStorage.setItem(STORAGE_KEYS.EXAM_HISTORY, JSON.stringify(updated));
  } catch (err) {
    console.error('Lỗi khi lưu kết quả thi:', err);
  }
  return updated;
}

export function resetExamHistory(): void {
  localStorage.removeItem(STORAGE_KEYS.EXAM_HISTORY);
}

// 4. Export & Import Backup
export function exportBackupData(): string {
  const backup = {
    app: 'quiz-app-personal',
    exportedAt: new Date().toISOString(),
    courseData: loadCourseData(),
    studyProgress: loadStudyProgress(),
    examHistory: loadExamHistory()
  };
  return JSON.stringify(backup, null, 2);
}

export function importBackupData(jsonString: string): { success: boolean; message: string; course?: CourseData } {
  try {
    const data = JSON.parse(jsonString);
    // Support either full backup schema OR direct CourseData schema OR list of topics
    let courseToSave: CourseData | null = null;

    if (data.courseData && data.courseData.topics) {
      courseToSave = data.courseData;
      if (data.studyProgress) saveStudyProgress(data.studyProgress);
      if (data.examHistory) localStorage.setItem(STORAGE_KEYS.EXAM_HISTORY, JSON.stringify(data.examHistory));
    } else if (data.topics && Array.isArray(data.topics)) {
      courseToSave = data;
    } else if (Array.isArray(data) && data[0]?.questions) {
      courseToSave = {
        id: `course_${Date.now()}`,
        name: 'Môn Học Mới',
        topics: data.map((t, idx) => ({
          id: `topic_${idx + 1}`,
          title: t.topicTitle || t.title || `Chủ đề ${idx + 1}`,
          sourceFile: t.sourceFile || '',
          questions: t.questions
        })),
        updatedAt: new Date().toISOString()
      };
    }

    if (courseToSave && courseToSave.topics.length > 0) {
      saveCourseData(courseToSave);
      // reset progress when new course is imported
      resetStudyProgress();
      return { success: true, message: `Nhập thành công môn học với ${courseToSave.topics.length} chủ đề!`, course: courseToSave };
    } else {
      return { success: false, message: 'File JSON không đúng cấu trúc ngân hàng câu hỏi hợp lệ.' };
    }
  } catch (err: any) {
    return { success: false, message: `Lỗi đọc file JSON: ${err.message}` };
  }
}
