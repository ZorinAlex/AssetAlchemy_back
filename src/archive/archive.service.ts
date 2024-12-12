import { Injectable } from '@nestjs/common';
import fs from "fs";
import archiver from 'archiver';
import * as path from "node:path";

@Injectable()
export class ArchiveService {

    async createZip(filesPath: string[], outputPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outputPath);
            const archive = archiver('zip', { zlib: { level: 9 } }); // Set compression level

            output.on('close', () => {
                this.removeFiles(filesPath)
                resolve(outputPath);
            });

            archive.on('error', (err) => reject(err));

            archive.pipe(output);

            // Add each file to the archive
            filesPath.forEach((filePath) => {
                if (fs.existsSync(filePath)) {
                    const fileName = path.basename(filePath);
                    archive.file(filePath, { name: fileName }); // Add file with its name
                } else {
                    console.warn(`File not found: ${filePath}`);
                }
            });
            archive.finalize();
        });
    }

    async removeFiles(filesPath: string[]): Promise<void> {
        filesPath.forEach((filePath) => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });
    }
}
