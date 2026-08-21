'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  formatSkillCompletedAt,
  getSkillCompletionMap,
  markSkillComplete,
  unmarkSkillComplete,
} from '@/lib/progress';
import { StampToast } from './StampCheckbox';

interface SkillProgressValue {
  completed: Record<string, string>;
  burstId: string | null;
  allComplete: boolean;
  toggleSkill: (skillId: string) => void;
}

const SkillProgressContext = createContext<SkillProgressValue | null>(null);

const STAMP_LINES = [
  'Stamped.',
  'Locked in.',
  'On the blotter.',
  'Skill banked.',
  "That's the one.",
];

function stampLine(skillId: string): string {
  const n = skillId.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return STAMP_LINES[n % STAMP_LINES.length];
}

export function SkillProgressProvider({
  skillIds,
  children,
}: {
  skillIds: string[];
  children: React.ReactNode;
}) {
  const idsKey = skillIds.join('|');
  const stableIds = useMemo(() => skillIds, [idsKey]);

  const [completed, setCompleted] = useState<Record<string, string>>({});
  const [burstId, setBurstId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setCompleted(getSkillCompletionMap());
  }, [idsKey]);

  const allComplete =
    stableIds.length > 0 && stableIds.every((id) => Boolean(completed[id]));

  const toggleSkill = useCallback(
    (skillId: string) => {
      const alreadyDone = Boolean(completed[skillId]);
      if (alreadyDone) {
        unmarkSkillComplete(skillId);
        setCompleted((prev) => {
          const next = { ...prev };
          delete next[skillId];
          return next;
        });
        return;
      }

      const completedAt = markSkillComplete(skillId);
      const next = { ...completed, [skillId]: completedAt };
      setCompleted(next);
      setBurstId(skillId);

      const remaining = stableIds.filter((id) => !next[id]).length;
      const when = formatSkillCompletedAt(completedAt);
      if (stableIds.length > 0 && remaining === 0) {
        setToast(`Task complete — all ${stableIds.length} skills stamped · ${when}`);
      } else {
        setToast(`${stampLine(skillId)} ${skillId} · ${when}`);
      }
    },
    [completed, stableIds]
  );

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

  const value = useMemo(
    () => ({ completed, burstId, allComplete, toggleSkill }),
    [completed, burstId, allComplete, toggleSkill]
  );

  return (
    <SkillProgressContext.Provider value={value}>
      {children}
      <StampToast message={toast} />
    </SkillProgressContext.Provider>
  );
}

export function useSkillProgress(): SkillProgressValue | null {
  return useContext(SkillProgressContext);
}
