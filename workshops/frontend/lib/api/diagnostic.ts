import api from '../api';
import { ProblemCategory } from './quotes';

export interface DiagnosticSuggestion {
  problemId: string;
  name: string;
  category: string;
  severity: string;
  estimatedCost?: number;
  description?: string;
  solutions: string[];
  matchScore: number;
}

export interface SuggestProblemsDto {
  symptoms: string[];
  category?: ProblemCategory;
}

export const diagnosticApi = {
  /**
   * Sugere problemas baseado em sintomas
   */
  suggestProblems: async (data: SuggestProblemsDto): Promise<DiagnosticSuggestion[]> => {
    const response = await api.post<DiagnosticSuggestion[]>('/diagnostic/suggest', data);
    return response.data;
  },

  /**
   * Lista problemas por categoria
   */
  getProblemsByCategory: async (category: ProblemCategory): Promise<DiagnosticSuggestion[]> => {
    const response = await api.get<DiagnosticSuggestion[]>('/diagnostic/problems', {
      params: { category },
    });
    return response.data;
  },
};

