import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';

export class CreateAffiliateDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsOptional()
    cpfCnpj?: string;

    @IsString()
    @IsOptional()
    pixKey?: string;

    @IsString()
    @IsOptional()
    userId?: string;
}

export class UpdateAffiliateDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    cpfCnpj?: string;

    @IsString()
    @IsOptional()
    pixKey?: string;

    @IsEnum(['pending', 'active', 'blocked'])
    @IsOptional()
    status?: string;
}

export class CreateAffiliateLinkDto {
    @IsString()
    @IsNotEmpty()
    productId: string;

    @IsString()
    @IsNotEmpty()
    code: string;

    @IsString()
    @IsNotEmpty()
    targetUrl: string;
}
