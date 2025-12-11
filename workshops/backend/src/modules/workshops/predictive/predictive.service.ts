import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  MaintenancePredictionDto,
  VehiclePredictionDto,
  PredictionAlertDto,
  PredictiveInsightsDto,
} from './dto/predictive-response.dto';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';

type UrgencyLevel = 'low' | 'medium' | 'high' | 'urgent';

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
      const scheduledMaintenancesRaw =
        await this.prisma.vehicleMaintenanceSchedule.findMany({
          where: {
            tenantId,
            vehicleId,
            status: { in: ['pending', 'due'] },
          },
        });

      // Mapear para o formato esperado
      const scheduledMaintenances = scheduledMaintenancesRaw.map((s) => ({
        id: s.id,
        maintenanceName: s.name,
        category: s.category,
        dueKm: s.nextDueKm,
        dueDate: s.nextDueDate,
        priority: s.priority,
        vehicleId: s.vehicleId, // Sempre presente no schema
        estimatedCost: s.estimatedCost,
      }));

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
    } catch (error: unknown) {
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
      const vehicles = await this.fetchAllVehicles(tenantId);
      const alerts: PredictionAlertDto[] = [];

      for (const vehicle of vehicles) {
        const vehicleAlerts = await this.generateAlertsForVehicle(
          tenantId,
          vehicle,
        );
        alerts.push(...vehicleAlerts);
      }

      return alerts;
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao gerar alertas de manutenção: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  private async fetchAllVehicles(tenantId: string) {
    return this.prisma.customerVehicle.findMany({
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
  }

  private async generateAlertsForVehicle(
    tenantId: string,
    vehicle: { id: string; placa: string | null },
  ): Promise<PredictionAlertDto[]> {
    const vehiclePredictions = await this.generateVehiclePredictions(
      tenantId,
      vehicle.id,
    );

    return vehiclePredictions.predictions
      .filter(
        (prediction) =>
          prediction.urgency === 'urgent' || prediction.urgency === 'high',
      )
      .map((prediction) => this.createAlertFromPrediction(prediction, vehicle));
  }

  private createAlertFromPrediction(
    prediction: MaintenancePredictionDto,
    vehicle: { placa: string | null },
  ): PredictionAlertDto {
    return {
      alertId: `${prediction.id}_alert`,
      vehicleId: prediction.vehicleId,
      placa: vehicle.placa || '',
      alertType: this.determineAlertType(prediction.daysUntilMaintenance),
      severity: prediction.urgency,
      title: this.createAlertTitle(prediction.urgency),
      message: this.createAlertMessage(prediction),
      maintenanceName: prediction.maintenanceName,
      recommendedKm: prediction.predictedKm,
      recommendedDate: prediction.predictedDate,
      daysRemaining: prediction.daysUntilMaintenance,
      kmRemaining: prediction.kmUntilMaintenance,
      recommendedActions: prediction.recommendations,
      createdAt: new Date(),
    };
  }

  private determineAlertType(
    daysUntilMaintenance: number,
  ): 'overdue_maintenance' | 'critical_maintenance' | 'upcoming_maintenance' {
    if (daysUntilMaintenance <= 0) {
      return 'overdue_maintenance';
    }
    if (daysUntilMaintenance <= 7) {
      return 'critical_maintenance';
    }
    return 'upcoming_maintenance';
  }

  private createAlertTitle(urgency: string): string {
    const urgencyText = urgency === 'urgent' ? 'Urgente' : 'Importante';
    return `Manutenção ${urgencyText}`;
  }

  private createAlertMessage(prediction: MaintenancePredictionDto): string {
    const dateStr = prediction.predictedDate?.toLocaleDateString('pt-BR');
    const kmStr = prediction.predictedKm
      ? `${prediction.predictedKm}km`
      : undefined;
    const whenStr = kmStr || dateStr || 'data não definida';
    const message = `${prediction.maintenanceName} prevista para ${whenStr}`;
    return message;
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
        } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    vehicle: {
      id: string;
      mileage: number | null;
      make: string | null;
      model: string | null;
      year: number | null;
    },
    maintenanceHistory: Array<{
      id: string;
      category: string;
      performedAt: Date;
      mileageAtService: number | null;
      nextDueKm: number | null;
      nextDueDate: Date | null;
    }>,
    scheduledMaintenances: Array<{
      id: string;
      maintenanceName: string;
      category: string;
      dueKm: number | null;
      dueDate: Date | null;
      priority: string;
      vehicleId: string;
      estimatedCost?: unknown;
    }>,
    similarVehiclesPatterns: Array<{
      category: string;
      avgInterval: number;
      count: number;
    }>,
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
    scheduled: {
      id: string;
      maintenanceName: string;
      category: string;
      dueKm: number | null;
      dueDate: Date | null;
      priority: string;
      vehicleId: string;
      estimatedCost?: unknown;
    },
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
    let urgency: UrgencyLevel = 'low';
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
        this.formatScheduledRecommendation(predictedKm, predictedDate),
        'Verificar peças necessárias',
        'Agendar com antecedência',
      ],
    };
  }

  /**
   * Gera previsões baseadas em padrões históricos
   */
  private async generatePatternBasedPredictions(
    vehicle: {
      id: string;
      mileage: number | null;
      make: string | null;
      model: string | null;
      year: number | null;
    },
    maintenanceHistory: Array<{
      id: string;
      category: string;
      performedAt: Date;
      mileageAtService: number | null;
      nextDueKm: number | null;
      nextDueDate: Date | null;
    }>,
    similarVehiclesPatterns: Array<{
      category: string;
      avgInterval: number;
      count: number;
    }>,
    currentKm: number,
    currentDate: Date,
  ): Promise<MaintenancePredictionDto[]> {
    const kmPredictions = this.generateKmBasedPredictions(
      vehicle,
      maintenanceHistory,
      currentKm,
      currentDate,
    );
    const timePredictions = this.generateTimeBasedPredictions(
      vehicle,
      maintenanceHistory,
      currentKm,
      currentDate,
    );

    return [...kmPredictions, ...timePredictions];
  }

  private generateKmBasedPredictions(
    vehicle: { id: string },
    maintenanceHistory: Array<{
      id: string;
      category: string;
      performedAt: Date;
      mileageAtService: number | null;
    }>,
    currentKm: number,
    currentDate: Date,
  ): MaintenancePredictionDto[] {
    const kmPatterns = this.analyzeKmPatterns(maintenanceHistory);
    const predictions: MaintenancePredictionDto[] = [];

    for (const pattern of kmPatterns) {
      if (pattern.avgInterval <= 0) continue;

      const prediction = this.createKmPrediction(
        vehicle,
        pattern,
        maintenanceHistory,
        currentKm,
        currentDate,
      );

      if (prediction) {
        predictions.push(prediction);
      }
    }

    return predictions;
  }

  private createKmPrediction(
    vehicle: { id: string },
    pattern: { category: string; avgInterval: number; count: number },
    maintenanceHistory: Array<{
      category: string;
      performedAt: Date;
      mileageAtService: number | null;
    }>,
    currentKm: number,
    currentDate: Date,
  ): MaintenancePredictionDto | null {
    const lastMaintenance = this.findLastMaintenanceByCategory(
      maintenanceHistory,
      pattern.category,
    );

    if (!lastMaintenance) {
      return null;
    }

    const lastKm = lastMaintenance.mileageAtService || 0;
    const predictedKm = lastKm + pattern.avgInterval;
    const kmUntilMaintenance = predictedKm - currentKm;

    if (kmUntilMaintenance <= -5000) return null;

    return {
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
      daysUntilMaintenance: Math.round(kmUntilMaintenance / 50),
      urgency: this.calculateUrgency(kmUntilMaintenance),
      confidence: Math.min(80, pattern.count * 10),
      basedOnHistoryCount: pattern.count,
      recommendations: [
        `Baseado em ${pattern.count} manutenções similares`,
        `Intervalo médio: ${pattern.avgInterval}km`,
        'Considere agendamento preventivo',
      ],
    };
  }

  private generateTimeBasedPredictions(
    vehicle: { id: string },
    maintenanceHistory: Array<{
      id: string;
      category: string;
      performedAt: Date;
    }>,
    currentKm: number,
    currentDate: Date,
  ): MaintenancePredictionDto[] {
    const timePatterns = this.analyzeTimePatterns(maintenanceHistory);
    const predictions: MaintenancePredictionDto[] = [];

    for (const pattern of timePatterns) {
      if (pattern.avgIntervalMonths <= 0) continue;

      const prediction = this.createTimePrediction(
        vehicle,
        pattern,
        maintenanceHistory,
        currentKm,
        currentDate,
      );

      if (prediction) {
        predictions.push(prediction);
      }
    }

    return predictions;
  }

  private createTimePrediction(
    vehicle: { id: string },
    pattern: { category: string; avgIntervalMonths: number; count: number },
    maintenanceHistory: Array<{ category: string; performedAt: Date }>,
    currentKm: number,
    currentDate: Date,
  ): MaintenancePredictionDto | null {
    const lastMaintenance = this.findLastMaintenanceByCategory(
      maintenanceHistory,
      pattern.category,
    );

    if (!lastMaintenance) {
      return null;
    }

    const predictedDate = new Date(lastMaintenance.performedAt);
    predictedDate.setMonth(
      predictedDate.getMonth() + pattern.avgIntervalMonths,
    );

    const daysUntilMaintenance = Math.ceil(
      (predictedDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilMaintenance <= -90) return null;

    return {
      id: `pattern_time_${pattern.category}_${Date.now()}`,
      vehicleId: vehicle.id,
      maintenanceName: `${pattern.category} (baseado em tempo)`,
      category: pattern.category,
      intervalType: 'months',
      intervalValue: pattern.avgIntervalMonths,
      currentKm,
      currentDate,
      predictedDate,
      kmUntilMaintenance: Math.round(daysUntilMaintenance * 50),
      daysUntilMaintenance,
      urgency: this.calculateUrgencyByDays(daysUntilMaintenance),
      confidence: Math.min(75, pattern.count * 8),
      basedOnHistoryCount: pattern.count,
      recommendations: [
        `Baseado em ${pattern.count} manutenções similares`,
        `Intervalo médio: ${pattern.avgIntervalMonths} meses`,
        'Manutenção preventiva recomendada',
      ],
    };
  }

  private findLastMaintenanceByCategory<
    T extends { category: string; performedAt: Date },
  >(maintenanceHistory: T[], category: string): T | undefined {
    return maintenanceHistory
      .filter((h) => h.category === category)
      .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime())[0];
  }

  private formatScheduledRecommendation(
    predictedKm: number | undefined,
    predictedDate: Date | undefined,
  ): string {
    if (predictedKm) {
      return `Agendada para ${predictedKm}km`;
    }
    if (predictedDate) {
      return `Agendada para ${predictedDate.toLocaleDateString('pt-BR')}`;
    }
    return 'Agendada para data não definida';
  }

  /**
   * Busca padrões de veículos similares
   */
  private async getSimilarVehiclesPatterns(
    tenantId: string,
    vehicle: {
      id: string;
      make: string | null;
      model: string | null;
      year: number | null;
    },
  ): Promise<Array<{ category: string; avgInterval: number; count: number }>> {
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
        select: {
          category: true,
          performedAt: true,
          mileageAtService: true,
        },
      });

    // Processar histórico para calcular padrões
    const patterns = this.analyzeKmPatterns(
      similarVehiclesHistory.map((h) => ({
        category: h.category,
        mileageAtService: h.mileageAtService,
      })),
    );

    return patterns;
  }

  /**
   * Analisa padrões por quilometragem
   */
  private analyzeKmPatterns(
    history: Array<{ category: string; mileageAtService: number | null }>,
  ): Array<{ category: string; avgInterval: number; count: number }> {
    const patterns: {
      [category: string]: { intervals: number[]; count: number };
    } = {};

    // Agrupar por categoria
    for (let index = 0; index < history.length - 1; index++) {
      const item = history[index];
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
  private analyzeTimePatterns(
    history: Array<{ category: string; performedAt: Date }>,
  ) {
    const patterns: {
      [category: string]: { intervals: number[]; count: number };
    } = {};

    for (let index = 0; index < history.length - 1; index++) {
      const item = history[index];
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
  ): UrgencyLevel {
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

  private calculateUrgencyByDays(daysRemaining: number): UrgencyLevel {
    return this.calculateUrgency(undefined, daysRemaining);
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
        interface AvgCostResult {
          avg_cost: number | null;
        }
        const avgCost = (avgCostRaw as AvgCostResult[])[0]?.avg_cost || 0;
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

    interface MaintenanceByAgeResult {
      age_range: string;
      maintenance_count: bigint | number;
    }

    interface SeasonalPatternResult {
      month: string;
      maintenance_count: bigint | number;
    }

    return {
      mostCommonMaintenances,
      maintenanceByAge: (maintenanceByAgeRaw as MaintenanceByAgeResult[]).map(
        (item) => ({
          ageRange: item.age_range,
          maintenanceCount: Number(item.maintenance_count),
        }),
      ),
      seasonalPatterns: (seasonalPatternsRaw as SeasonalPatternResult[]).map(
        (item) => ({
          month: item.month.trim(),
          maintenanceCount: Number(item.maintenance_count),
        }),
      ),
    };
  }
}
