import _ from 'lodash';
import axios from 'axios';
import { Middlewares, Article, Handlers } from './types';
import { Platforms } from './platforms';

export async function get(url: string, config?: Partial<Middlewares>): Promise<Article>{
    const mid = _.defaults(config, {
        image: defaultImage,
        request: defaultRequest,
        requestHeadless: defaultRequestHeadless,
        logger: defaultLogger
    }) as Middlewares;
    const needHeadless = url.match(/https:\/\/(www\.)?weibo\.com\/ttarticle\/p\/show.+/);
    const data = needHeadless ? await mid.requestHeadless(url):
        await mid.request(url);
    const handlers: Handlers = Reflect.getMetadata('handlers', new Platforms());
    for (const handler of handlers) {
        if (url.match(handler.regexp)) {
            return await handler.handler({ data, url }, mid);
        }
    }
    throw new Error('ArticleCrawler :: Unsupported Platform');
}

async function defaultRequest(url:string): Promise<string> {
    const rawPage = await axios({
        url,
        method: 'get',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        }
    });
    return rawPage.data;
}
const defaultRequestHeadless = defaultRequest;
const defaultImage = (url: string) => url;
const defaultLogger = console.log;
