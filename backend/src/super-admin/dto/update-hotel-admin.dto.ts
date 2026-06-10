import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateHotelAdminDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  hotelCode?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  contactPerson?: string;

  @ApiPropertyOptional() @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  mobile?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  address?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  gstNumber?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  phoneNumberId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  wabaId?: string;

  @ApiPropertyOptional({ description: 'WhatsApp Business API access token — stored via shared token service' })
  @IsOptional() @IsString()
  accessToken?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  timezone?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: ['trial','basic','standard','premium','enterprise'] })
  @IsOptional() @IsEnum(['trial','basic','standard','premium','enterprise'])
  plan?: string;

  @ApiPropertyOptional({ enum: ['monthly','quarterly','annual'] })
  @IsOptional() @IsEnum(['monthly','quarterly','annual'])
  billingCycle?: string;

  @ApiPropertyOptional({ enum: ['trial','active','suspended','expired'] })
  @IsOptional() @IsEnum(['trial','active','suspended','expired'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  suspensionReason?: string;
}

export class CreateHotelUserDto {
  @ApiPropertyOptional() @IsEmail()
  email: string;

  @ApiPropertyOptional() @IsString()
  name: string;

  @ApiPropertyOptional({ enum: ['admin','manager','agent','owner','general_manager','front_office','reservations','marketing','accountant'] })
  @IsEnum(['admin','manager','agent','owner','general_manager','front_office','reservations','marketing','accountant'])
  role: string;

  @ApiPropertyOptional() @IsString()
  password: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  forcePasswordChange?: boolean;
}
