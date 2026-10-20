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
      : { phase: 'session', roleId: state.roleId, index: 0, revealed: false };
  }
  if (action.type !== 'next' || state.phase !== 'session') return state;
  if (dialogue.lines[state.index]?.speaker === state.roleId && !state.revealed) {
    return { ...state, revealed: true };
  }
  return state.index + 1 >= dialogue.lines.length
    ? { phase: 'done', roleId: state.roleId }
    : { ...state, index: state.index + 1, revealed: false };
}

export function rolePlayView(dialogue: Dialogue, state: RolePlayState) {
  const current = state.phase === 'session' ? dialogue.lines[state.index] : undefined;
  const isOwnTurn = current?.speaker === state.roleId;
  const count = state.phase === 'pick' ? 0 : state.phase === 'done' ? dialogue.lines.length : state.index + 1;
  return {
    current,
    isOwnTurn,
    count,
    total: dialogue.lines.length,
    progress: `${count}/${dialogue.lines.length}`,
    buttonLabel: state.phase === 'session' && isOwnTurn && !state.revealed ? 'Hiện câu' : 'Tiếp',
    visibleLines: dialogue.lines.slice(0, count).map((line, index) => ({
      line,
      index,
      isOwn: line.speaker === state.roleId,
      hidden: state.phase === 'session' && index === state.index && isOwnTurn && !state.revealed,
    })),
  };
}
