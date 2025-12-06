import { ApiProperty } from '@nestjs/swagger';
import { SupportPriority, SupportCategory } from './create-support-ticket.dto';

export enum SupportStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_USER = 'waiting_for_user',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export class SupportTicketResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  status: SupportStatus;

  @ApiProperty()
  priority: SupportPriority;

  @ApiProperty()
  category: SupportCategory;

  @ApiProperty()
  userId?: string;

  @ApiProperty()
  userEmail?: string;

  @ApiProperty()
  userName?: string;

  @ApiProperty()
  tenantId?: string;

  @ApiProperty()
  assignedToId?: string;

  @ApiProperty()
  assignedToName?: string;

  @ApiProperty()
  lastReplyAt?: Date;

  @ApiProperty()
  resolvedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  repliesCount?: number;

  @ApiProperty()
  isUnread?: boolean;
}
