import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Condition = '>' | '>=' | '<' | '<=' | '=' | '!=';

export interface PriceRule {
    id: string;
    name: string; // Auto-generated or custom
    productType: string; // Filter by name/type
    referencePrice: number;
    condition: Condition;
    adjustmentPercentage: number;
    exceptionQuantity: number;
    active: boolean;
}

interface RulesState {
    rules: PriceRule[];
    addRule: (rule: PriceRule) => void;
    updateRule: (id: string, rule: Partial<PriceRule>) => void;
    removeRule: (id: string) => void;
    reorderRules: (startIndex: number, endIndex: number) => void;
}

export const useRulesStore = create<RulesState>()(
    persist(
        (set) => ({
            rules: [],
            addRule: (rule) => set((state) => ({ rules: [...state.rules, rule] })),
            updateRule: (id, updated) =>
                set((state) => ({
                    rules: state.rules.map((r) => (r.id === id ? { ...r, ...updated } : r)),
                })),
            removeRule: (id) =>
                set((state) => ({ rules: state.rules.filter((r) => r.id !== id) })),
            reorderRules: (startIndex, endIndex) =>
                set((state) => {
                    const result = Array.from(state.rules);
                    const [removed] = result.splice(startIndex, 1);
                    result.splice(endIndex, 0, removed);
                    return { rules: result };
                }),
        }),
        {
            name: 'price-rules-storage',
        }
    )
);
