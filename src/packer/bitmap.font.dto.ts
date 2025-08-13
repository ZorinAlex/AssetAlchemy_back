import {IsBoolean, IsEnum, IsNumber, IsOptional} from "class-validator";
import {EFont, ESpriteSheet, IPackData} from './packer.interfaces';
import {Transform} from "class-transformer";

export class PackBitmapFontDto {
    @IsOptional()
    @Transform(({ value }) => Number(value))
    maxSheetWidth: number = 1024

    @IsOptional()
    @Transform(({ value }) => Number(value))
    maxSheetHeight: number = 1024;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    scale: number = 1

    @IsOptional()
    @Transform(({ value }) => Number(value))
    quality: number = 100

    @IsOptional()
    @Transform(({ value }) => Number(value))
    size: number = 25

    @IsOptional()
    @Transform(({ value }) => Number(value))
    lineHeight: number = 25

    @IsEnum(ESpriteSheet)
    @IsOptional()
    format: ESpriteSheet = ESpriteSheet.PNG;

    @Transform(({value})=>JSON.parse(value))
    data: Array<IPackData>

    @IsOptional()
    name: string = 'unnamed'
}