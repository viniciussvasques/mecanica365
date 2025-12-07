import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  MaintenancePredictionDto,
  VehiclePredictionDto,
  PredictionAlertDto,
  PredictiveInsightsDto,
} from './dto/predictive-response.dto';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';

@Injectable()
export class PredictiveService {
  private readonly logger = new Logger(PredictiveService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gera previsões para um veículo específico
   */
  async generateVehiclePredictions(
    tenantId: string,
    vehicleId: string,
  ): Promise<VehiclePredictionDto> {
    try {
      // Buscar informações do veículo
      const vehicle = await this.prisma.customerVehicle.findFirst({
        where: {
          id: vehicleId,
          customer: {
            tenantId: tenantId,
          },
        },
        select: {
          id: true,
          placa: true,
          make: true,
          model: true,
          year: true,
          mileage: true,
        },
      });

      if (!vehicle) {
        throw new Error('Veículo não encontrado');
      }

      // Buscar histórico de manutenção do veículo
      const maintenanceHistory = await this.prisma.maintenanceHistory.findMany({
        where: {
          tenantId,
          vehicleId,
        },
        orderBy: { performedAt: 'desc' },
      });

      // Buscar manutenções programadas ativas
      const scheduledMaintenances =
        await this.prisma.vehicleMaintenanceSchedule.findMany({
          where: {
            tenantId,
            vehicleId,
            status: { in: ['pending', 'due'] },
          },
        });

      // Buscar padrões de veículos similares
      const similarVehiclesPatterns = await this.getSimilarVehiclesPatterns(
        tenantId,
        vehicle,
      );

      // Gerar previsões baseadas nos dados
      const predictions = await this.calculatePredictions(
        vehicle,
        maintenanceHistory,
        scheduledMaintenances,
        similarVehiclesPatterns,
      );

      // Calcular resumo
      const summary = this.calculatePredictionSummary(predictions);

      return {
        vehicleId: vehicle.id,
        vehicle: {
          placa: vehicle.placa || '',
          make: vehicle.make || '',
          model: vehicle.model || '',
          year: vehicle.year || 0,
          currentKm: vehicle.mileage || 0,
        },
        predictions,
        summary,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao gerar previsões para veículo ${vehicleId}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Gera alertas de manutenção para todos os veículos
   */
  async generateMaintenanceAlerts(
    tenantId: string,
  ): Promise<PredictionAlertDto[]> {
    try {
      const alerts: PredictionAlertDto[] = [];

      // Buscar todos os veículos ativos
      const vehicles = await this.prisma.customerVehicle.findMany({
        where: {
          customer: {
            tenantId: tenantId,
          },
        },
        select: {
          id: true,
          placa: true,
          make: true,
          model: true,
          year: true,
          mileage: true,
        },
      });

      for (const vehicle of vehicles) {
        const vehiclePredictions = await this.generateVehiclePredictions(
          tenantId,
          vehicle.id,
        );

        // Criar alertas para previsões urgentes
        for (const prediction of vehiclePredictions.predictions) {
          if (
            prediction.urgency === 'urgent' ||
            prediction.urgency === 'high'
          ) {
            const alert: PredictionAlertDto = {
              alertId: `${prediction.id}_alert`,
              vehicleId: prediction.vehicleId,
              placa: vehicle.placa || '',
              alertType:
                prediction.daysUntilMaintenance <= 0
                  ? 'overdue_maintenance'
                  : prediction.daysUntilMaintenance <= 7
                    ? 'critical_maintenance'
                    : 'upcoming_maintenance',
              severity: prediction.urgency,
              title: `Manutenção ${prediction.urgency === 'urgent' ? 'Urgente' : 'Importante'}`,
              message: `${prediction.maintenanceName} prevista para ${prediction.predictedKm ? `${prediction.predictedKm}km` : prediction.predictedDate?.toLocaleDateString('pt-BR')}`,
              maintenanceName: prediction.maintenanceName,
              recommendedKm: prediction.predictedKm,
              recommendedDate: prediction.predictedDate,
              daysRemaining: prediction.daysUntilMaintenance,
              kmRemaining: prediction.kmUntilMaintenance,
              recommendedActions: prediction.recommendations,
              createdAt: new Date(),
            };
            alerts.push(alert);
          }
        }
      }

      return alerts;
    } catch (error) {
      this.logger.error(
        `Erro ao gerar alertas de manutenção: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Gera insights preditivos para o dashboard
   */
  async generatePredictiveInsights(
    tenantId: string,
  ): Promise<PredictiveInsightsDto> {
    try {
      // Buscar previsões para todos os veículos
      const vehicles = await this.prisma.customerVehicle.findMany({
        where: {
          customer: {
            tenantId: tenantId,
          },
        },
        select: { id: true },
      });

      const vehiclePredictions: VehiclePredictionDto[] = [];
      let totalPredictions = 0;
      let urgentAlerts = 0;
      let totalEstimatedCost = 0;

      for (const vehicle of vehicles) {
        try {
          const predictions = await this.generateVehiclePredictions(
            tenantId,
            vehicle.id,
          );
          vehiclePredictions.push(predictions);
          totalPredictions += predictions.summary.totalPredictions;
          urgentAlerts += predictions.summary.urgentPredictions;
          totalEstimatedCost += predictions.summary.totalEstimatedCost;
        } catch (error) {
          this.logger.warn(
            `Erro ao gerar previsões para veículo ${vehicle.id}: ${getErrorMessage(error)}`,
          );
        }
      }

      // Gerar alertas
      const alerts = await this.generateMaintenanceAlerts(tenantId);

      // Calcular tendências
      const trends = await this.calculateTrends(tenantId);

      return {
        vehiclePredictions,
        alerts,
        statistics: {
          totalVehicles: vehicles.length,
          vehiclesWithPredictions: vehiclePredictions.length,
          totalPredictions,
          urgentAlerts,
          totalEstimatedCost,
        },
        trends,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao gerar insights preditivos: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Calcula previsões baseadas em dados históricos
   */
  private async calculatePredictions(
    vehicle: unknown,
    maintenanceHistory: unknown[],
    scheduledMaintenances: unknown[],
    similarVehiclesPatterns: unknown[],
  ): Promise<MaintenancePredictionDto[]> {
    const predictions: MaintenancePredictionDto[] = [];
    const currentKm = vehicle.mileage || 0;
    const currentDate = new Date();

    // Analisar manutenções programadas existentes
    for (const scheduled of scheduledMaintenances) {
      const prediction = this.createPredictionFromScheduled(
        scheduled,
        currentKm,
        currentDate,
      );
      if (prediction) {
        predictions.push(prediction);
      }
    }

    // Gerar previsões baseadas em padrões históricos
    const patternPredictions = await this.generatePatternBasedPredictions(
      vehicle,
      maintenanceHistory,
      similarVehiclesPatterns,
      currentKm,
      currentDate,
    );

    predictions.push(...patternPredictions);

    // Remover duplicatas e ordenar por urgência
    const uniquePredictions = this.removeDuplicatePredictions(predictions);
    return this.sortPredictionsByUrgency(uniquePredictions);
  }

  /**
   * Cria previsão baseada em manutenção programada
   */
  private createPredictionFromScheduled(
    scheduled: unknown,
    currentKm: number,
    currentDate: Date,
  ): MaintenancePredictionDto | null {
    let predictedKm: number | undefined;
    let predictedDate: Date | undefined;
    let kmUntilMaintenance = 0;
    let daysUntilMaintenance = 0;

    if (scheduled.dueKm) {
      predictedKm = scheduled.dueKm;
      kmUntilMaintenance = (predictedKm || 0) - currentKm;
    }

    if (scheduled.dueDate) {
      predictedDate = new Date(scheduled.dueDate);
      daysUntilMaintenance = Math.ceil(
        (predictedDate.getTime() - currentDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
    }

    // Determinar urgência
    let urgency: 'low' | 'medium' | 'high' | 'urgent' = 'low';
    if (kmUntilMaintenance <= 0 || daysUntilMaintenance <= 0) {
      urgency = 'urgent';
    } else if (kmUntilMaintenance <= 1000 || daysUntilMaintenance <= 7) {
      urgency = 'high';
    } else if (kmUntilMaintenance <= 5000 || daysUntilMaintenance <= 30) {
      urgency = 'medium';
    }

    return {
      id: `scheduled_${scheduled.id}`,
      vehicleId: scheduled.vehicleId,
      maintenanceName: scheduled.maintenanceName,
      category: scheduled.category,
      intervalType: 'km', // placeholder
      intervalValue: 0, // placeholder
      currentKm,
      currentDate,
      predictedKm,
      predictedDate,
      kmUntilMaintenance,
      daysUntilMaintenance,
      urgency,
      confidence: 95, // Alta confiança para manutenções programadas
      basedOnHistoryCount: 1,
      estimatedCost: scheduled.estimatedCost
        ? Number(scheduled.estimatedCost)
        : undefined,
      recommendations: [
        `Agendada para ${predictedKm ? `${predictedKm}km` : predictedDate?.toLocaleDateString('pt-BR')}`,
        'Verificar peças necessárias',
        'Agendar com antecedência',
      ],
    };
  }

  /**
   * Gera previsões baseadas em padrões históricos
   */
  private async generatePatternBasedPredictions(
    vehicle: unknown,
    maintenanceHistory: unknown[],
    similarVehiclesPatterns: unknown[],
    currentKm: number,
    currentDate: Date,
  ): Promise<MaintenancePredictionDto[]> {
    const predictions: MaintenancePredictionDto[] = [];

    // Análise de padrões por quilometragem
    const kmPatterns = this.analyzeKmPatterns(maintenanceHistory);
    for (const pattern of kmPatterns) {
      if (pattern.avgInterval > 0) {
        const lastMaintenance = maintenanceHistory
          .filter((h) => h.category === pattern.category)
          .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime())[0];

        if (lastMaintenance) {
          const lastKm = lastMaintenance.mileageAtService || 0;
          const predictedKm = lastKm + pattern.avgInterval;
          const kmUntilMaintenance = predictedKm - currentKm;

          if (kmUntilMaintenance > -5000) {
            // Não mostrar previsões muito antigas
            predictions.push({
              id: `pattern_km_${pattern.category}_${Date.now()}`,
              vehicleId: vehicle.id,
              maintenanceName: `${pattern.category} (baseado em padrão)`,
              category: pattern.category,
              intervalType: 'km',
              intervalValue: pattern.avgInterval,
              currentKm,
              currentDate,
              predictedKm,
              kmUntilMaintenance,
              daysUntilMaintenance: Math.round(kmUntilMaintenance / 50), // Estimativa baseada em uso médio
              urgency: this.calculateUrgency(kmUntilMaintenance, undefined),
              confidence: Math.min(80, pattern.count * 10), // Confiança baseada em histórico
              basedOnHistoryCount: pattern.count,
              recommendations: [
                `Baseado em ${pattern.count} manutenções similares`,
                `Intervalo médio: ${pattern.avgInterval}km`,
                'Considere agendamento preventivo',
              ],
            });
          }
        }
      }
    }

    // Análise de padrões por tempo
    const timePatterns = this.analyzeTimePatterns(maintenanceHistory);
    for (const pattern of timePatterns) {
      if (pattern.avgIntervalMonths > 0) {
        const lastMaintenance = maintenanceHistory
          .filter((h) => h.category === pattern.category)
          .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime())[0];

        if (lastMaintenance) {
          const predictedDate = new Date(lastMaintenance.performedAt);
          predictedDate.setMonth(
            predictedDate.getMonth() + pattern.avgIntervalMonths,
          );

          const daysUntilMaintenance = Math.ceil(
            (predictedDate.getTime() - currentDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );

          if (daysUntilMaintenance > -90) {
            // Não mostrar previsões muito antigas
            predictions.push({
              id: `pattern_time_${pattern.category}_${Date.now()}`,
              vehicleId: vehicle.id,
              maintenanceName: `${pattern.category} (baseado em tempo)`,
              category: pattern.category,
              intervalType: 'months',
              intervalValue: pattern.avgIntervalMonths,
              currentKm,
              currentDate,
              predictedDate,
              kmUntilMaintenance: Math.round(daysUntilMaintenance * 50), // Estimativa
              daysUntilMaintenance,
              urgency: this.calculateUrgency(undefined, daysUntilMaintenance),
              confidence: Math.min(75, pattern.count * 8),
              basedOnHistoryCount: pattern.count,
              recommendations: [
                `Baseado em ${pattern.count} manutenções similares`,
                `Intervalo médio: ${pattern.avgIntervalMonths} meses`,
                'Manutenção preventiva recomendada',
              ],
            });
          }
        }
      }
    }

    return predictions;
  }

  /**
   * Busca padrões de veículos similares
   */
  private async getSimilarVehiclesPatterns(tenantId: string, vehicle: unknown) {
    // Buscar veículos da mesma marca/modelo através do relacionamento com Customer
    const similarVehicles = await this.prisma.customerVehicle.findMany({
      where: {
        customer: {
          tenantId: tenantId,
        },
        make: vehicle.make,
        model: vehicle.model,
        id: { not: vehicle.id }, // Excluir o próprio veículo
      },
      take: 20, // Limitar para performance
    });

    if (similarVehicles.length === 0) return [];

    // Buscar histórico desses veículos
    const similarVehiclesHistory =
      await this.prisma.maintenanceHistory.findMany({
        where: {
          tenantId,
          vehicleId: { in: similarVehicles.map((v) => v.id) },
        },
      });

    return similarVehiclesHistory;
  }

  /**
   * Analisa padrões por quilometragem
   */
  private analyzeKmPatterns(history: unknown[]) {
    const patterns: {
      [category: string]: { intervals: number[]; count: number };
    } = {};

    // Agrupar por categoria
    history.forEach((item, index) => {
      if (index < history.length - 1) {
        const nextItem = history[index + 1];
        if (
          item.mileageAtService &&
          nextItem.mileageAtService &&
          item.category === nextItem.category
        ) {
          const interval = item.mileageAtService - nextItem.mileageAtService;
          if (interval > 0) {
            if (!patterns[item.category]) {
              patterns[item.category] = { intervals: [], count: 0 };
            }
            patterns[item.category].intervals.push(interval);
            patterns[item.category].count++;
          }
        }
      }
    });

    // Calcular médias
    return Object.entries(patterns)
      .map(([category, data]) => ({
        category,
        avgInterval:
          data.intervals.length > 0
            ? Math.round(
                data.intervals.reduce((sum, interval) => sum + interval, 0) /
                  data.intervals.length,
              )
            : 0,
        count: data.count,
      }))
      .filter((p) => p.avgInterval > 1000); // Só mostrar intervalos significativos
  }

  /**
   * Analisa padrões por tempo
   */
  private analyzeTimePatterns(history: unknown[]) {
    const patterns: {
      [category: string]: { intervals: number[]; count: number };
    } = {};

    history.forEach((item, index) => {
      if (index < history.length - 1) {
        const nextItem = history[index + 1];
        if (item.category === nextItem.category) {
          const intervalMs =
            item.performedAt.getTime() - nextItem.performedAt.getTime();
          const intervalMonths = intervalMs / (1000 * 60 * 60 * 24 * 30); // Aproximadamente
          if (intervalMonths > 0) {
            if (!patterns[item.category]) {
              patterns[item.category] = { intervals: [], count: 0 };
            }
            patterns[item.category].intervals.push(intervalMonths);
            patterns[item.category].count++;
          }
        }
      }
    });

    return Object.entries(patterns)
      .map(([category, data]) => ({
        category,
        avgIntervalMonths:
          data.intervals.length > 0
            ? Math.round(
                (data.intervals.reduce((sum, interval) => sum + interval, 0) /
                  data.intervals.length) *
                  10,
              ) / 10
            : 0,
        count: data.count,
      }))
      .filter((p) => p.avgIntervalMonths > 1); // Só mostrar intervalos significativos
  }

  /**
   * Calcula urgência baseada em quilometragem ou tempo restante
   */
  private calculateUrgency(
    kmRemaining?: number,
    daysRemaining?: number,
  ): 'low' | 'medium' | 'high' | 'urgent' {
    if (
      (kmRemaining !== undefined && kmRemaining <= 0) ||
      (daysRemaining !== undefined && daysRemaining <= 0)
    ) {
      return 'urgent';
    }
    if (
      (kmRemaining !== undefined && kmRemaining <= 1000) ||
      (daysRemaining !== undefined && daysRemaining <= 7)
    ) {
      return 'high';
    }
    if (
      (kmRemaining !== undefined && kmRemaining <= 5000) ||
      (daysRemaining !== undefined && daysRemaining <= 30)
    ) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Remove previsões duplicadas
   */
  private removeDuplicatePredictions(
    predictions: MaintenancePredictionDto[],
  ): MaintenancePredictionDto[] {
    const seen = new Set<string>();
    return predictions.filter((prediction) => {
      const key = `${prediction.vehicleId}_${prediction.maintenanceName}_${prediction.category}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Ordena previsões por urgência
   */
  private sortPredictionsByUrgency(
    predictions: MaintenancePredictionDto[],
  ): MaintenancePredictionDto[] {
    const urgencyOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return predictions.sort(
      (a, b) => urgencyOrder[b.urgency] - urgencyOrder[a.urgency],
    );
  }

  /**
   * Calcula resumo das previsões
   */
  private calculatePredictionSummary(predictions: MaintenancePredictionDto[]) {
    const urgentPredictions = predictions.filter(
      (p) => p.urgency === 'urgent' || p.urgency === 'high',
    ).length;
    const totalEstimatedCost = predictions.reduce(
      (sum, p) => sum + (p.estimatedCost || 0),
      0,
    );

    const nextMaintenance = predictions
      .filter((p) => p.daysUntilMaintenance > 0)
      .sort((a, b) => a.daysUntilMaintenance - b.daysUntilMaintenance)[0];

    return {
      totalPredictions: predictions.length,
      urgentPredictions,
      nextMaintenanceKm: nextMaintenance?.predictedKm,
      nextMaintenanceDate: nextMaintenance?.predictedDate,
      totalEstimatedCost,
    };
  }

  /**
   * Calcula tendências para o dashboard
   */
  private async calculateTrends(tenantId: string) {
    // Manutenções mais comuns
    const commonMaintenances = await this.prisma.maintenanceHistory.groupBy({
      by: ['category'],
      where: { tenantId },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
      take: 5,
    });

    // Buscar custos médios usando query raw
    const mostCommonMaintenances = await Promise.all(
      commonMaintenances.map(async (item) => {
        const avgCostRaw = await this.prisma.$queryRaw`
          SELECT AVG("total_cost") as avg_cost
          FROM maintenance_history
          WHERE "tenant_id" = ${tenantId}
            AND category = ${item.category}
            AND "total_cost" IS NOT NULL
        `;
        const avgCost = (avgCostRaw as unknown[])[0]?.avg_cost || 0;
        return {
          name: item.category,
          count: item._count.category,
          avgCost: Number(avgCost),
        };
      }),
    );

    // Manutenção por faixa etária do veículo
    const maintenanceByAgeRaw = await this.prisma.$queryRaw`
      SELECT
        CASE
          WHEN EXTRACT(YEAR FROM CURRENT_DATE) - cv."year" < 2 THEN '0-2 anos'
          WHEN EXTRACT(YEAR FROM CURRENT_DATE) - cv."year" < 5 THEN '2-5 anos'
          WHEN EXTRACT(YEAR FROM CURRENT_DATE) - cv."year" < 10 THEN '5-10 anos'
          ELSE '10+ anos'
        END as age_range,
        COUNT(mh.id) as maintenance_count
      FROM maintenance_history mh
      JOIN customer_vehicles cv ON mh."vehicle_id" = cv.id
      WHERE mh."tenant_id" = ${tenantId}
        AND cv."year" IS NOT NULL
      GROUP BY age_range
      ORDER BY age_range
    `;

    // Padrões sazonais
    const seasonalPatternsRaw = await this.prisma.$queryRaw`
      SELECT
        TO_CHAR("performed_at", 'Month') as month,
        COUNT(*) as maintenance_count
      FROM maintenance_history
      WHERE "tenant_id" = ${tenantId}
      GROUP BY TO_CHAR("performed_at", 'Month'), EXTRACT(MONTH FROM "performed_at")
      ORDER BY EXTRACT(MONTH FROM "performed_at")
    `;

    return {
      mostCommonMaintenances,
      maintenanceByAge: (maintenanceByAgeRaw as unknown[]).map(
        (item: unknown) => ({
          ageRange: item.age_range,
          maintenanceCount: Number(item.maintenance_count),
        }),
      ),
      seasonalPatterns: (seasonalPatternsRaw as unknown[]).map(
        (item: unknown) => ({
          month: item.month.trim(),
          maintenanceCount: Number(item.maintenance_count),
        }),
      ),
    };
  }
}
