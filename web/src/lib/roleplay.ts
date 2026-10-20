import type { Dialogue } from '../types/index.ts';

export type RolePlayState =
  | { phase: 'pick'; roleId: string }
  | { phase: 'session'; roleId: string; index: number; revealed: boolean }
  | { phase: 'done'; roleId: string };

export type RolePlayAction =
  | { type: 'select'; roleId: string }
  | { type: 'start' }
  | { type: 'next' }
  | { type: 'change-role' };

export function createRolePlay(dialogue: Dialogue): RolePlayState {
  return {
    phase: 'pick',
    roleId: dialogue.roles.find((role) => role.id === 'mai')?.id ?? dialogue.roles[0]?.id ?? '',
  };
}

function nextTurn(dialogue: Dialogue, roleId: string, from: number): RolePlayState {
  const index = dialogue.lines.findIndex((line, index) => index >= from && line.speaker === roleId);
  return {
    phase: 'session',
    roleId,
    index: index < 0 ? dialogue.lines.length - 1 : index,
    revealed: index < 0,
  };
}

export function stepRolePlay(
  dialogue: Dialogue,
  state: RolePlayState,
  action: RolePlayAction,
): RolePlayState {
  if (action.type === 'change-role') return { phase: 'pick', roleId: state.roleId };
  if (action.type === 'select') {
    return state.phase === 'pick' && dialogue.roles.some((role) => role.id === action.roleId)
      ? { phase: 'pick', roleId: action.roleId }
      : state;
  }
  if (action.type === 'start' && state.phase === 'pick') {
    if (!dialogue.roles.some((role) => role.id === state.roleId)) return state;
    return dialogue.lines.length === 0
      ? { phase: 'done', roleId: state.roleId }
      : nextTurn(dialogue, state.roleId, 0);
  }
  if (action.type !== 'next' || state.phase !== 'session') return state;
  return state.revealed
    ? { phase: 'done', roleId: state.roleId }
    : nextTurn(dialogue, state.roleId, state.index + 1);
}

export function rolePlayView(dialogue: Dialogue, state: RolePlayState) {
  const current = state.phase === 'session' ? dialogue.lines[state.index] : undefined;
  const isOwnTurn = current?.speaker === state.roleId;
  const count = state.phase === 'pick' ? 0 : state.phase === 'done' ? dialogue.lines.length : state.index + 1;
  const speechEnd = state.phase !== 'session' ? 0 : count - (isOwnTurn && !state.revealed ? 1 : 0);
  let speechStart = speechEnd;
  while (speechStart > 0 && dialogue.lines[speechStart - 1]!.speaker !== state.roleId) speechStart--;
  return {
    current,
    isOwnTurn,
    count,
    total: dialogue.lines.length,
    progress: `${count}/${dialogue.lines.length}`,
    buttonLabel: state.phase === 'session' && !state.revealed ? 'Hiện câu' : 'Hoàn tất',
    speechStart,
    speechEnd,
    visibleLines: dialogue.lines.slice(0, count).map((line, index) => ({
      line,
      index,
      isOwn: line.speaker === state.roleId,
      hidden: state.phase === 'session' && index === state.index && isOwnTurn && !state.revealed,
    })),
  };
}
