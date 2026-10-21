/**
 * Self-description of POST /packer/bfont, served by GET /packer/bfont so an
 * agent (or a curl user) can find out how to call it without reading the client.
 */
export const BITMAP_FONT_DOCS = {
  endpoint: 'POST /packer/bfont',
  description:
    'Packs glyph images into a bitmap font atlas. Returns a ZIP with the atlas image(s), <name>.fnt (text BMFont) and <name>.xml (XML BMFont), usable by Pixi.js and Phaser.',
  contentType: 'multipart/form-data',
  files: {
    field: 'files',
    repeat: true,
    description:
      'One image per glyph. Without `data`, the character is taken from the file name: the first character of the name ("A.png" → "A", "€.png" → "€"), or a word alias for characters that are awkward in file names.',
    aliases: {
      'dot / point': '.',
      'comma': ',',
      'dollar': '$',
      'euro': '€',
    },
    note: 'Alias matching is a case-insensitive substring match, so "point.png" and "Point_small.png" both mean ".". Upload file names as UTF-8.',
  },
  fields: {
    name:           { type: 'string',  default: 'unnamed', description: 'Font face name; also the file name inside the ZIP (spaces become "_").' },
    size:           { type: 'number',  default: 25,        description: 'Font size written to the info line.' },
    lineHeight:     { type: 'number',  default: 25,        description: 'Line height in px. 0 = tallest glyph.' },
    base:           { type: 'number',  default: 0,         description: 'Baseline from the top of a line in px. 0 = tallest glyph.' },
    spaceWidth:     { type: 'number',  default: 20,        description: 'xadvance of the space character (no image needed for it).' },
    scale:          { type: 'number',  default: 1,         description: 'Resample every image by this factor before packing. Metrics in `data` must already be scaled.' },
    resample:       { type: 'enum',    values: ['smooth', 'nearest'], default: 'smooth', description: 'Resampling filter used with `scale`; nearest for pixel art.' },
    format:         { type: 'enum',    values: ['png', 'webp', 'jpeg'], default: 'png', description: 'Atlas image format.' },
    quality:        { type: 'number',  default: 100,       description: 'Atlas encoder quality, 1-100.' },
    maxSheetWidth:  { type: 'number',  default: 1024,      description: 'Max atlas width; glyphs that do not fit go to extra pages.' },
    maxSheetHeight: { type: 'number',  default: 1024,      description: 'Max atlas height.' },
    data: {
      type: 'JSON string',
      optional: true,
      description:
        'Per-glyph metrics, overrides the file-name rule. Array of { filename, char, width?, height?, xoffset?, yoffset?, xadvance? }. `filename` must match an uploaded file name. Omitted metrics default to the image size, offsets 0, xadvance = width.',
    },
  },
  example:
    'curl -X POST <host>/packer/bfont -F "files=@A.png" -F "files=@point.png" -F "name=my_font" -F "size=48" -o my_font.zip',
};
