import {Injectable, OnModuleInit} from '@nestjs/common';
import {join} from "path";
import fs from "fs";
import {IRectangle, MaxRectsPacker, Rectangle} from 'maxrects-packer';
import {
    ESpriteSheet,
    ICharsPageData,
    ICharXmlData,
    IPackData,
    IProcessImages,
    IRect,
    ISheetData,
} from './packer.interfaces';
import {PackImagesDto} from "./pack.dto";
import {Jimp} from "jimp";
import { find, findIndex, forEach } from 'lodash';
import * as path from "node:path";
import sharp from 'sharp';
import {ConfigService} from "@nestjs/config";
import { PackBitmapFontDto } from './bitmap.font.dto';
import { getASCIIData } from '../utils/ascii';
import {calc_font_props, calc_scales, replace_spaces} from "../utils/font_utils";

@Injectable()
export class PackerService implements OnModuleInit{
    constructor(private configService: ConfigService){}
    public outputPath: string;

    onModuleInit(): any {
        const path = this.configService.get('TEMP_PATH');
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

    async fontDataFromJSON(filepath: Array<string>, options: PackBitmapFontDto): Promise<string[]> {
        const imagesMap: Array<IPackData> = options.data;
        const pagesData: Array<ICharsPageData> = [];
        const charData: Array<ICharXmlData> = [];
        for(let index: number = 0; index<filepath.length; index++){
            const jsonData = JSON.parse(fs.readFileSync(filepath[index], 'utf-8'));
            pagesData.push({file:jsonData.meta.image, id: index.toString()})
            forEach(jsonData.frames, (frameDat, frameName)=>{
                const charMap = find(imagesMap, im=> im.filename.split('.')[0] === frameName)
                if(charMap){
                    charData.push({
                        id: getASCIIData(charMap.char).DEC.toString(),
                        x:frameDat.frame.x,
                        y:frameDat.frame.y,
                        width: frameDat.frame.w,
                        height: frameDat.frame.h,
                        xoffset: '0',
                        yoffset: '0',
                        xadvance: frameDat.frame.w,
                        page: index,
                        chnl: 0
                    })
                }
            })
        }
        const xmlData = this.createBitmapFontXML(pagesData, charData, options);
        const fileName = replace_spaces(options.name);
        const outputPath: Array<string> = [];
        try {
            const path_xml = path.join(this.outputPath, `${fileName}.xml`)
            await fs.promises.writeFile(path_xml, xmlData);
            outputPath.push(path_xml);
        } catch (error) {
            console.error('Error generating XML metadata:', error);
        }

        const fntData = this.createBitmapFontFNT(pagesData, charData, options);

        try {
            const path_fnt = path.join(this.outputPath, `${fileName}.fnt`);
            await fs.promises.writeFile(path_fnt, fntData);
            outputPath.push(path_fnt)
        } catch (error) {
            console.error('Error generating FNT metadata:', error);
        }
        return outputPath;
    }

    createBitmapFontXML(pagesData: Array<ICharsPageData>, charData: Array<ICharXmlData>, options: PackBitmapFontDto) {
        const {scaleH, scaleW} = calc_scales(pagesData, charData);
        const {lineHeight, base} = calc_font_props(charData);
        let xml = `<?xml version='1.0'?> \n`;
        xml += '<font>\n';
        xml += `<info aa='1' face="${options.name}" size='${options.size}' smooth='1' stretchH='100' bold='0' padding='0,0,0,0' spacing='0,0' italic='0' />\n`;
        xml += `  <common lineHeight='${lineHeight}' scaleH='${scaleH}' scaleW='${scaleW}' base='${base}'/>\n`;
        xml += '  <pages>\n';
        forEach(pagesData, pd=>{
            xml += `    <page id='${pd.id}' file='${pd.file}' />\n`;
        })
        xml += '  </pages>\n';
        xml += `  <chars count='${charData.length}'>\n`;
        forEach(charData, cd=>{
            xml += `    <char id='${cd.id}' x='${cd.x}' y='${cd.y}' width='${cd.width}' height='${cd.height}' xoffset='${cd.xoffset}' yoffset='${cd.yoffset}' xadvance='${cd.xadvance}' page='${cd.page}' chnl='${cd.chnl}'/>\n`;
        })
        xml += '  </chars>\n';
        xml += '</font>';
        return xml;
    }

    createBitmapFontFNT(pagesData: Array<ICharsPageData>, charData: Array<ICharXmlData>, options: PackBitmapFontDto) {
        const padding = [0, 0, 0, 0];
        const spacing =  [0, 0];

        const {scaleH, scaleW} = calc_scales(pagesData, charData);
        const {lineHeight, base} = calc_font_props(charData);
        const pageCount = pagesData.length;
        let out = `info face="${options.name}" size=${options.size} bold=0 italic=0 charset="" unicode=0 stretchH=100 smooth=1 aa=1 padding=${padding.join(',')} spacing=${spacing.join(',')} outline=0\n`;
        out += `common lineHeight=${lineHeight} base=${base} scaleW=${scaleW} scaleH=${scaleH} pages=${pageCount} packed=0 alphaChnl=0 redChnl=4 greenChnl=4 blueChnl=4\n`;

        pagesData.forEach(pd => {
            out += `page id=${pd.id} file="${pd.file}"\n`;
        });

        out += `chars count=${charData.length}\n`;
        charData.forEach(cd => {
            out += `char id=${cd.id} x=${cd.x} y=${cd.y} width=${cd.width} height=${cd.height} xoffset=${cd.xoffset} yoffset=${cd.yoffset} xadvance=${cd.xadvance} page=${cd.page ?? 0} chnl=${cd.chnl ?? 0}\n`;
        });
        console.log(out);
        return out;
    }
}
