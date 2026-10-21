import {IsBoolean, IsEnum, IsNumber, IsOptional} from "class-validator";
import {EFont, EResample, ESpriteSheet, IPackData} from './packer.interfaces';
import {Transform} from "class-transformer";

export class PackBitmapFontDto {
    @IsOptional()
    @Transform(({ value }) => Number(value))
    maxSheetWidth: number = 1024

    @IsOptional()
    @Transform(({ value }) => Number(value))
    maxSheetHeight: number = 1024;

    // Glyph metrics arrive already multiplied by this — the server only has to
    // resample the images to match
    @IsOptional()
    @Transform(({ value }) => Number(value))
    scale: number = 1

    @IsEnum(EResample)
    @IsOptional()
    resample: EResample = EResample.SMOOTH

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

    // Optional: without it every file is a glyph named after its file
    // ("A.png" → "A", "point.png" → "."), with default metrics
    @IsOptional()
    @Transform(({value})=>JSON.parse(value))
    data?: Array<IPackData>

    @IsOptional()
    name: string = 'unnamed'

    @IsOptional()
    @Transform(({ value }) => Number(value))
    spaceWidth: number = 20

    @IsOptional()
    @Transform(({ value }) => Number(value))
    base: number = 0  // 0 = auto-calculate from char data
}