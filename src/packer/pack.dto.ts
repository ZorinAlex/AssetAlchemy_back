import {IsBoolean, IsEnum, IsNumber, IsOptional} from "class-validator";
import {ESpriteSheet} from "./packer.interfaces";
import {Transform} from "class-transformer";

export class PackImagesDto {
    @IsOptional()
    @Transform(({ value }) => Number(value))
    maxSheetWidth: number = 1024

    @IsOptional()
    @Transform(({ value }) => Number(value))
    maxSheetHeight: number = 1024;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    padding: number = 2;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    smart: boolean = true;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    pot: boolean = true;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    square: boolean = false;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    allowRotation: boolean = true;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    tag: boolean = false;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    border: number = 1;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    scale: number = 1

    @IsOptional()
    @Transform(({ value }) => Number(value))
    quality: number = 100

    @IsEnum(ESpriteSheet)
    @IsOptional()
    format: ESpriteSheet = ESpriteSheet.PNG;

    @IsOptional()
    name: string = 'unnamed'
}