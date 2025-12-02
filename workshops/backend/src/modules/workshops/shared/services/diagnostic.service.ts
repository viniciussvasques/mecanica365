import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { ProblemCategory } from '../enums/problem-category.enum';

export interface DiagnosticSuggestion {
  problemId: string;
  name: string;
  category: string;
  severity: string;
  estimatedCost?: number;
  description?: string;
  solutions: string[];
  matchScore: number; // 0-100, baseado na correspondência dos sintomas
}

@Injectable()
export class DiagnosticService {
  private readonly logger = new Logger(DiagnosticService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sugere problemas comuns baseado nos sintomas relatados
   * @param symptoms Sintomas relatados pelo cliente
   * @param category Categoria opcional para filtrar
   * @returns Lista de problemas sugeridos ordenados por relevância
   */
  async suggestProblems(
    symptoms: string[],
    category?: ProblemCategory,
  ): Promise<DiagnosticSuggestion[]> {
    try {
      if (!symptoms || symptoms.length === 0) {
        return [];
      }

      // Normalizar sintomas para busca (lowercase, remover acentos básicos)
      const normalizedSymptoms = symptoms.map((s) =>
        this.normalizeText(s.toLowerCase()),
      );

      // Buscar problemas comuns ativos
      const where: {
        isActive: boolean;
        category?: ProblemCategory;
      } = {
        isActive: true,
      };

      if (category) {
        where.category = category;
      }

      const problems = await this.prisma.commonProblem.findMany({
        where,
        orderBy: [
          { severity: 'desc' }, // Priorizar problemas de alta severidade
          { name: 'asc' },
        ],
      });

      // Calcular score de correspondência para cada problema
      const suggestions: DiagnosticSuggestion[] = problems
        .map((problem) => {
          const matchScore = this.calculateMatchScore(
            normalizedSymptoms,
            problem.symptoms || [],
            problem.name,
            problem.description || '',
          );

          return {
            problemId: problem.id,
            name: problem.name,
            category: problem.category,
            severity: problem.severity,
            estimatedCost: problem.estimatedCost
              ? problem.estimatedCost.toNumber()
              : undefined,
            description: problem.description || undefined,
            solutions: problem.solutions || [],
            matchScore,
          };
        })
        .filter((suggestion) => suggestion.matchScore > 0) // Apenas problemas com alguma correspondência
        .sort((a, b) => b.matchScore - a.matchScore); // Ordenar por score decrescente

      this.logger.log(
        `Sugeridos ${suggestions.length} problemas para ${symptoms.length} sintomas`,
      );

      return suggestions;
    } catch (error) {
      this.logger.error(
        `Erro ao sugerir problemas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      throw error;
    }
  }

  /**
   * Calcula o score de correspondência entre sintomas e um problema
   */
  private calculateMatchScore(
    reportedSymptoms: string[],
    problemSymptoms: string[],
    problemName: string,
    problemDescription: string,
  ): number {
    if (problemSymptoms.length === 0) {
      // Se o problema não tem sintomas cadastrados, verificar correspondência no nome/descrição
      return this.calculateTextMatch(reportedSymptoms, [
        problemName,
        problemDescription,
      ]);
    }

    let matchCount = 0;
    const normalizedProblemSymptoms = problemSymptoms.map((s) =>
      this.normalizeText(s.toLowerCase()),
    );

    // Verificar correspondência exata ou parcial
    for (const reportedSymptom of reportedSymptoms) {
      for (const problemSymptom of normalizedProblemSymptoms) {
        if (
          problemSymptom.includes(reportedSymptom) ||
          reportedSymptom.includes(problemSymptom)
        ) {
          matchCount++;
          break; // Contar apenas uma vez por sintoma relatado
        }
      }
    }

    // Calcular score baseado na porcentagem de sintomas que correspondem
    const symptomMatchScore = (matchCount / reportedSymptoms.length) * 70; // 70% do score vem dos sintomas

    // Adicionar score baseado em correspondência no nome/descrição (30%)
    const textMatchScore =
      this.calculateTextMatch(reportedSymptoms, [
        problemName,
        problemDescription,
      ]) * 0.3;

    return Math.min(100, Math.round(symptomMatchScore + textMatchScore));
  }

  /**
   * Calcula correspondência de texto (busca palavras-chave)
   */
  private calculateTextMatch(
    reportedSymptoms: string[],
    texts: string[],
  ): number {
    let matchCount = 0;
    const allText = texts.join(' ').toLowerCase();

    for (const symptom of reportedSymptoms) {
      const normalizedSymptom = this.normalizeText(symptom);
      // Verificar se alguma palavra do sintoma aparece no texto
      const words = normalizedSymptom.split(/\s+/);
      for (const word of words) {
        if (word.length > 2 && allText.includes(word)) {
          matchCount++;
          break;
        }
      }
    }

    return reportedSymptoms.length > 0
      ? Math.min(100, (matchCount / reportedSymptoms.length) * 100)
      : 0;
  }

  /**
   * Normaliza texto removendo acentos básicos
   */
  private normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  /**
   * Busca problemas por categoria
   */
  async getProblemsByCategory(
    category: ProblemCategory,
  ): Promise<DiagnosticSuggestion[]> {
    try {
      const problems = await this.prisma.commonProblem.findMany({
        where: {
          category,
          isActive: true,
        },
        orderBy: [{ severity: 'desc' }, { name: 'asc' }],
      });

      return problems.map((problem) => ({
        problemId: problem.id,
        name: problem.name,
        category: problem.category,
        severity: problem.severity,
        estimatedCost: problem.estimatedCost
          ? problem.estimatedCost.toNumber()
          : undefined,
        description: problem.description || undefined,
        solutions: problem.solutions || [],
        matchScore: 100, // Score máximo pois foi filtrado por categoria
      }));
    } catch (error) {
      this.logger.error(
        `Erro ao buscar problemas por categoria: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      throw error;
    }
  }
}
