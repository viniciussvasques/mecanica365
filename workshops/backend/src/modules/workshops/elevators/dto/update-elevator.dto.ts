import { PartialType } from '@nestjs/swagger';
import { CreateElevatorDto } from './create-elevator.dto';

export class UpdateElevatorDto extends PartialType(CreateElevatorDto) {}
