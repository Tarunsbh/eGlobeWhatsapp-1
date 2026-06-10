import { IsString, IsEmail, IsOptional, IsEnum, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHotelDto {
  @ApiProperty({ example: 'The Grand Palace Hotel' })
  @IsString() @IsNotEmpty() @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'GPH001' })
  @IsString() @IsNotEmpty() @MaxLength(50)
  hotelCode: string;

  @ApiPropertyOptional({ example: 'Rajesh Kumar' })
  @IsOptional() @IsString()
  contactPerson?: string;

  @ApiProperty({ example: 'admin@grandpalace.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional() @IsString()
  mobile?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '22AAAAA0000A1Z5' })
  @IsOptional() @IsString()
  gstNumber?: string;

  @ApiProperty({ example: '1004350432772558' })
  @IsString() @IsNotEmpty()
  phoneNumberId: string;

  @ApiProperty({ example: '1621359509122346' })
  @IsString() @IsNotEmpty()
  wabaId: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  businessId?: string;

  @ApiPropertyOptional({ default: 'Asia/Kolkata' })
  @IsOptional() @IsString()
  timezone?: string;

  @ApiPropertyOptional({ default: 'IN' })
  @IsOptional() @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'WhatsApp Business API permanent access token' })
  @IsOptional() @IsString()
  accessToken?: string;

  @ApiPropertyOptional({ enum: ['trial','basic','standard','premium','enterprise'], default: 'trial' })
  @IsOptional() @IsEnum(['trial','basic','standard','premium','enterprise'])
  plan?: string;

  @ApiPropertyOptional({ enum: ['monthly','quarterly','annual'], default: 'monthly' })
  @IsOptional() @IsEnum(['monthly','quarterly','annual'])
  billingCycle?: string;

  // First admin user credentials
  @ApiProperty({ example: 'Admin@123' })
  @IsString() @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password must have uppercase, lowercase, number, and special char',
  })
  adminPassword: string;

  @ApiProperty({ example: 'Hotel Admin' })
  @IsString() @IsNotEmpty()
  adminName: string;
}
