'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  formatSkillCompletedAt,
  getArticleCompletionMap,
  markArticleRead,
  unmarkArticleRead,
} from '@/lib/progress';

const STAMP_LINES = [
  'Stamped.',
  'Locked in.',
  'On the blotter.',
  'Task banked.',
  "That's the one.",
];

function stampLine(taskId: string): string {
  const n = taskId.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return STAMP_LINES[n % STAMP_LINES.length];
}

export function useTaskStamps() {
  const [completed, setCompleted] = useState<Record<string, string>>({});
  const [burstId, setBurstId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setCompleted(getArticleCompletionMap());
  }, []);

  useEffect(() => {
    if (!burstId) return;
    const timer = window.setTimeout(() => setBurstId(null), 700);
    return () => window.clearTimeout(timer);
  }, [burstId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const toggleTask = useCallback(
    (
      articleKey: string,
      meta: { taskId: string; domainTaskKeys: string[]; domainId: number },
      timeSpentMinutes = 1
    ) => {
      if (completed[articleKey]) {
        unmarkArticleRead(articleKey);
        setCompleted((prev) => {
          const next = { ...prev };
          delete next[articleKey];
          return next;
        });
        return;
      }

      const completedAt = markArticleRead(articleKey, timeSpentMinutes);
      const next = { ...completed, [articleKey]: completedAt };
      setCompleted(next);
      setBurstId(articleKey);

      const remaining = meta.domainTaskKeys.filter((key) => !next[key]).length;
      const when = formatSkillCompletedAt(completedAt);
      if (meta.domainTaskKeys.length > 0 && remaining === 0) {
        setToast(`Domain ${meta.domainId} complete — all ${meta.domainTaskKeys.length} tasks stamped · ${when}`);
      } else {
        setToast(`${stampLine(meta.taskId)} Task ${meta.taskId} · ${when}`);
      }
    },
    [completed]
  );

  return { completed, burstId, toast, toggleTask };
}
