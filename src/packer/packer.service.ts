import {Injectable, OnModuleInit} from '@nestjs/common';
import {join} from "path";
import fs from "fs";
import {IRectangle, MaxRectsPacker, Rectangle} from 'maxrects-packer';
import {ESpriteSheet, IProcessImages, IRect, ISheetData} from "./packer.interfaces";
import {PackImagesDto} from "./pack.dto";
import {Jimp} from "jimp";
import {findIndex, forEach} from "lodash"
import * as path from "node:path";
import sharp from 'sharp';
import {ConfigService} from "@nestjs/config";

@Injectable()
export class PackerService implements OnModuleInit{
    constructor(private configService: ConfigService){}
    public outputPath: string;

    onModuleInit(): any {
        const path = this.configService.get('PATH');
        this.outputPath = join(__dirname, path);
        if (!fs.existsSync(this.outputPath)) {
            fs.mkdirSync(this.outputPath, { recursive: true });
        }
    }

    async packImages(files: Express.Multer.File[], options: PackImagesDto): Promise<string[]> {
        const packer = new MaxRectsPacker(
            options.maxSheetWidth,
            options.maxSheetHeight,
            options.padding,
            options);

        const {images, imagesData} = await this.processImages(files, options.scale);
        const spriteSheetData: ISheetData[] = this.getSpriteSheetData(options.name, packer, imagesData);
        const fileNames = [];
        for (let index = 0; index < spriteSheetData.length; index++) {
            const spriteFileName = await this.generateSpriteSheet(
                spriteSheetData[index].name,
                spriteSheetData[index].width,
                spriteSheetData[index].height,
                spriteSheetData[index].rects,
                imagesData,
                images,
                options.format,
                options.quality
            );

            const jsonFileName = await this.generateJSON(
                spriteSheetData[index].name,
                options.format,
                spriteSheetData[index].width,
                spriteSheetData[index].height,
                spriteSheetData[index].rects,
            );
            fileNames.push(jsonFileName, spriteFileName);
        }
        return fileNames
    }

    async processImages(files: Express.Multer.File[], scale: number = 1): Promise<IProcessImages> {
        const images = [];
        const imagesData: IRect[] = []
        for (let index = 0; index < files.length; index++) {
            const image = await Jimp.read(files[index].buffer);
            if (scale !== 1) image.scale(scale);
            const name = files[index].originalname.split('.')[0];
            images.push(image);
            imagesData.push(
                {
                    width: image.bitmap.width,
                    height: image.bitmap.height,
                    name
                });
        }
        return {images, imagesData};
    }

    getSpriteSheetData(name: string, packer: MaxRectsPacker, imagesData: IRect[]): ISheetData[] {
        packer.addArray(imagesData as unknown as Rectangle[]);
        const sheetsData: ISheetData[] = []
        forEach(packer.bins, (bin, binIndex) => {
            let sheetName = name;
            if (binIndex > 0) sheetName = `${sheetName}_${binIndex}`;
            sheetsData.push({
                name: sheetName,
                rects: bin.rects as unknown as IRectangle[],
                width: bin.width,
                height: bin.height
            })
        })
        return sheetsData
    }

    async generateSpriteSheet(name: string, width: number, height: number, rects: IRectangle[], imagesData: IRect[], images, format: ESpriteSheet, quality: number): Promise<string> {
        const spriteSheetImage = new Jimp({width: width, height: height});
        forEach(rects, rect => {
            const imageIndex = findIndex(imagesData, data => data.name === rect.name);
            const image = images[imageIndex];
            if (rect.rot) image.rotate(-90);
            spriteSheetImage.composite(image, rect.x, rect.y);
        });
        const spriteSheetBuffer = await spriteSheetImage.getBuffer('image/png');
        const outputSheetPath = path.join(this.outputPath, `${name}.${format}`);
        const sharpInstance = sharp(spriteSheetBuffer);
        switch (format) {
            case ESpriteSheet.WEBP:
                await sharpInstance.webp({ quality }).toFile(outputSheetPath);
                break;
            case ESpriteSheet.PNG:
                await sharpInstance.png({ quality }).toFile(outputSheetPath);
                break;
            case ESpriteSheet.JPEG:
                await sharpInstance.jpeg({ quality }).toFile(outputSheetPath);
                break;
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
        return outputSheetPath;
    }

    async generateJSON(name: string, format: ESpriteSheet, width: number, height: number, rects: IRectangle[]): Promise<string> {
        const frames: any = {};
        forEach(rects, rect => {
            frames[rect.name] = {
                frame: {
                    x: rect.x,
                    y: rect.y,
                    w: rect.width,
                    h: rect.height
                },
                rotated: rect.rot
            };
        })

        const metadata = {
            frames: frames,
            meta: {
                app: "AssetAlchemy",
                version: "1.0",
                image: `${name}.${format}`,
                scale: "1",
                format: "RGBA8888",
                size: {
                    w: width,
                    h: height
                }
            }
        };

        const jsonData = JSON.stringify(metadata, null, 2);

        try {
            const outputPath = path.join(this.outputPath, `${name}.json`);
            await fs.promises.writeFile(outputPath, jsonData);
            return outputPath
        } catch (error) {
            console.error('Error generating JSON metadata:', error);
        }
    }
}
