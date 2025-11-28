import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  Req,
  Logger,
} from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { OnboardingService } from './onboarding.service';
import { getErrorMessage } from '../../../common/utils/error.utils';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { CheckTenantStatusDto } from './dto/check-tenant-status.dto';
import { Public } from '../../../common/decorators/public.decorator';
import Stripe from 'stripe';

@ApiTags('Onboarding')
@Controller('onboarding')
export class OnboardingController {
  private readonly logger = new Logger(OnboardingController.name);

  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar novo tenant (status: pending) ou retornar existente',
  })
  @ApiResponse({
    status: 201,
    description:
      'Tenant registrado com sucesso (pendente de pagamento) ou tenant pendente existente retornado',
    schema: {
      type: 'object',
      properties: {
        tenantId: { type: 'string' },
        subdomain: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Subdomain ou documento já existe (tenant ativo)',
  })
  async register(@Body() createOnboardingDto: CreateOnboardingDto) {
    return this.onboardingService.register(createOnboardingDto);
  }

  @Post('check-status')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar se existe tenant pendente' })
  @ApiResponse({
    status: 200,
    description: 'Status do tenant verificado',
    schema: {
      type: 'object',
      properties: {
        tenantId: { type: 'string' },
        subdomain: { type: 'string' },
        exists: { type: 'boolean' },
      },
    },
  })
  async checkStatus(@Body() checkStatusDto: CheckTenantStatusDto) {
    const result = await this.onboardingService.checkPendingTenant(
      checkStatusDto.document,
      checkStatusDto.email,
    );
    return result || { exists: false };
  }

  @Post('checkout')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Criar sessão de checkout no Stripe para tenant existente',
  })
  @ApiResponse({
    status: 200,
    description: 'Sessão de checkout criada com sucesso',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        url: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou tenant não encontrado',
  })
  async createCheckout(@Body() createCheckoutDto: CreateCheckoutDto) {
    return this.onboardingService.createCheckoutSession(createCheckoutDto);
  }

  @Post('webhooks/stripe')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook handler do Stripe' })
  @ApiResponse({ status: 200, description: 'Webhook processado' })
  @ApiBody({ schema: { type: 'object' } })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-11-17.clover',
    });

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET não configurado');
    }

    let event: Stripe.Event;

    try {
      if (!req.rawBody) {
        throw new Error('rawBody não disponível');
      }
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        webhookSecret,
      );
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      throw new Error(`Webhook signature verification failed: ${errorMessage}`);
    }

    // Processar eventos do Stripe
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          await this.onboardingService.handleCheckoutCompleted(session);
          break;
        }

        case 'checkout.session.async_payment_failed': {
          const asyncPaymentSession = event.data.object;
          await this.onboardingService.handleAsyncPaymentFailed(
            asyncPaymentSession,
          );
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          await this.onboardingService.handlePaymentIntentFailed(paymentIntent);
          break;
        }

        case 'charge.failed': {
          const failedCharge = event.data.object;
          await this.onboardingService.handleChargeFailed(failedCharge);
          break;
        }

        case 'invoice.payment_failed': {
          const failedInvoice = event.data.object;
          await this.onboardingService.handleInvoicePaymentFailed(
            failedInvoice,
          );
          break;
        }

        case 'invoice.payment_succeeded': {
          const succeededInvoice = event.data.object;
          await this.onboardingService.handleInvoicePaymentSucceeded(
            succeededInvoice,
          );
          break;
        }

        case 'invoice.upcoming': {
          const upcomingInvoice = event.data.object;
          await this.onboardingService.handleInvoiceUpcoming(upcomingInvoice);
          break;
        }

        case 'customer.subscription.deleted': {
          const deletedSubscription = event.data.object;
          await this.onboardingService.handleSubscriptionDeleted(
            deletedSubscription,
          );
          break;
        }

        case 'customer.subscription.updated': {
          const updatedSubscription = event.data.object;
          await this.onboardingService.handleSubscriptionUpdated(
            updatedSubscription,
          );
          break;
        }

        case 'customer.subscription.trial_will_end': {
          const trialEndingSubscription = event.data.object;
          await this.onboardingService.handleTrialWillEnd(
            trialEndingSubscription,
          );
          break;
        }

        default:
          // Eventos não tratados são opcionais/redundantes (ver EVENTOS_STRIPE.md)
          // Log apenas em nível debug para não poluir os logs
          this.logger.debug(
            `Evento Stripe não tratado (opcional): ${event.type}`,
          );
      }
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Erro ao processar evento ${event.type}: ${err.message || String(error)}`,
        err.stack,
      );
      // Não lançar erro para não quebrar o webhook
    }

    return { received: true };
  }
}
