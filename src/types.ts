// Data types for the app
export interface Flag {
    id: string;
    name: string;
    current: number;
    total: number;
    unit: string;
    color: string;
    history: string[];
    reminder: Reminder | null;
}

export interface Reminder {
    enabled: boolean;
    day: string;
    hour: number;
    minute: number;
}

export interface MemoItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface MemoData {
    mode: 'note' | 'todo';
    text: string;
    todos: MemoItem[];
}

export const COLORS = [
    { name: 'Blue', value: 'blue', bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200', bar: 'bg-blue-500', shadow: '59 130 246' },
    { name: 'Emerald', value: 'emerald', bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500', shadow: '16 185 129' },
    { name: 'Amber', value: 'amber', bg: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500', shadow: '245 158 11' },
    { name: 'Rose', value: 'rose', bg: 'bg-rose-500', light: 'bg-rose-50', border: 'border-rose-200', bar: 'bg-rose-500', shadow: '244 63 94' },
    { name: 'Violet', value: 'violet', bg: 'bg-violet-500', light: 'bg-violet-50', border: 'border-violet-200', bar: 'bg-violet-500', shadow: '139 92 246' },
    { name: 'Cyan', value: 'cyan', bg: 'bg-cyan-500', light: 'bg-cyan-50', border: 'border-cyan-200', bar: 'bg-cyan-500', shadow: '6 182 212' },
];

export function getColorTheme(colorValue: string) {
    return COLORS.find(c => c.value === colorValue) || COLORS[0];
}

export function todayKey() {
    return new Date().toISOString().split('T')[0];
}
