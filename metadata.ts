import { getMetadata } from 'page-metadata-parser';
import domino from 'domino';
import { Middlewares, Page } from './types';

export function opengraph({ url, data }: Page, mid: Middlewares): any {
    const doc = domino.createWindow(data).document;
    const md = getMetadata(doc, url);
    mid.logger(`metadata for ${url} : ${md}`);
    return md;
}