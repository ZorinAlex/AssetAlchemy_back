import {ICharsPageData, ICharXmlData} from "../packer/packer.interfaces";

export function calc_scales(pagesData: Array<ICharsPageData>, charData: Array<ICharXmlData>){
    const perPageMax = new Map<number, { w: number; h: number }>();
    const pageCount = pagesData.length;
    for (let i = 0; i < pageCount; i++) perPageMax.set(i, { w: 0, h: 0 });

    charData.forEach(cd => {
        const page = Number(cd.page ?? 0);
        const maxW = Number(cd.x) + Number(cd.width);
        const maxH = Number(cd.y) + Number(cd.height);
        const cur = perPageMax.get(page) ?? { w: 0, h: 0 };
        if (maxW > cur.w) cur.w = maxW;
        if (maxH > cur.h) cur.h = maxH;
        perPageMax.set(page, cur);
    });

    const scaleW = Math.max(...Array.from(perPageMax.values()).map(p => p.w), 0);
    const scaleH = Math.max(...Array.from(perPageMax.values()).map(p => p.h), 0);
    return {
        scaleH, scaleW
    }
}

export function calc_font_props(charData: Array<ICharXmlData>, opts: { extraLeading?: number } = {}) {
    const extraLeading = opts.extraLeading ?? 0;

    const heights = charData
        .filter(c => Number(c.id) !== 32 && Number(c.height) > 0)
        .map(c => Number(c.height));

    const ascent = Math.max(...heights);
    const base = ascent;
    const lineHeight = base + extraLeading;

    return { base, lineHeight };
}