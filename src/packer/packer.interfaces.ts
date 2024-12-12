import { IRectangle } from "maxrects-packer"
import {JimpInstance} from "jimp";

export interface IPackerOptions{
    maxSheetWidth: number,
    maxSheetHeight: number,
    padding: number
    smart: boolean,
    pot: boolean,
    square: boolean,
    allowRotation: boolean,
    tag: boolean,
    border: number,
    scale: number
}

export interface IRect extends Partial<IRectangle> {
    name: string
}

export interface ISheetData {
    name: string,
    rects: IRectangle[],
    width: number,
    height: number
}

export interface IProcessImages{
    images: Array<JimpInstance>,
    imagesData: Array<IRect>,
}

export enum ESpriteSheet{
    WEBP = 'webp', PNG = 'png', JPEG = 'jpeg'
}