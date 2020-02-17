import { matchUrl } from './decorators';
import cheerio from 'cheerio';
import { Middlewares, Article,Page } from './types';
import { opengraph } from './metadata';
import turndown from 'turndown';
export class Platforms{
    @matchUrl(/https:\/\/mp\.weixin\.qq\.com\/s[?\/]{1}[_\-=&#a-zA-Z0-9]{1,200}/)
    async handleWechat({ url, data }: Page, mid: Middlewares): Promise<Article> {
        const $ = cheerio.load(data);
        const turndownService = new turndown();
        turndownService.addRule('section', {
            filter: 'section',
            replacement: (x:String) => x.trim()
        });
        const mediaContent = $('div.rich_media_content');

        // 把图片上传至本站， 并替换链接
        // TBD: 仍然有出现图片未被替换的问题
        let imgUpUrl:string|null, imgFileName:string;
        // const imgElement = parsedPage.querySelector('div.rich_media_content').querySelectorAll('img');
        const _imgElement = $('img',mediaContent).toArray();

        for (let index = 0; index < _imgElement.length; index += 1) {
            const imgRawUrl = _imgElement[index].attribs['data-src'];
            imgUpUrl = await mid.image(imgRawUrl);
            // 匹配图片URL， 并进行替换
            if (imgUpUrl) {
                _imgElement[index].attribs['data-src'] = _imgElement[index].attribs['data-src'].replace(
                    /http[s]?:\/\/mmbiz\.q[a-z]{2,4}\.cn\/mmbiz_[a-z]{1,4}\/[a-zA-Z0-9]{50,100}\/[0-9]{1,4}\??[a-z0-9_=&]{0,100}/g, imgUpUrl);
                _imgElement[index].attribs.style = 'vertical-align: middle;width: 90%;height: 90%;';
            } else {
                mid.logger('ArticleCrawler:: handleWechat: upload Image failed, ignored');
                _imgElement[index].attribs['data-src'] = '';
            }
            _imgElement[index].attribs.src = _imgElement[index].attribs['data-src'];
        }
        const parsedContent = turndownService.turndown(
            $('div.rich_media_content').html());

        // 处理元数据 —— 标题、封面
        const metadata = opengraph({ data, url },mid);
        const { title } = metadata;

        let parsedCoverRaw : string|null = null;
        // 试图从 OpenGraph 读取 封面信息
        if (metadata.image) {
            // Yay! 再也不用regex匹配了
            parsedCoverRaw = metadata.image;
        } else if (data.match(/msg_cdn_url = "http:\/\/mmbiz\.qpic\.cn\/mmbiz_jpg\/[0-9a-zA-Z]{10,100}\/0\?wx_fmt=jpeg"/)
            || data.match(/msg_cdn_url = "http:\/\/mmbiz\.qpic\.cn\/mmbiz\/[0-9a-zA-Z]{10,100}\/0\?wx_fmt=jpeg"/)) {
            parsedCoverRaw = data;
        }
        // const parsedCover = parsedCoverRaw.substring(15, parsedCoverRaw.length - 1);
        const parsedCover : (string|null) = parsedCoverRaw;
        const coverLocation = parsedCover ? await mid.image(parsedCover) : null;
        // console.log(parsedTitle);
        // console.log(parsedCover);
        // console.log(parsedContent);

        const articleObj = {
            title,
            cover: coverLocation,
            content: parsedContent,
        };

        return articleObj;
    }

    @matchUrl(/https:\/\/www\.chainnews\.com\/articles\/[0-9]{8,14}\.htm/)
    async handleChainnews({ data, url }: Page, mid: Middlewares): Promise<Article> {
        // 处理元数据 —— 标题、封面
        const metadata = opengraph({ url, data },mid);
        const { title, image } = metadata;
        // Parser 处理， 转化为markdown， 因平台而异
        const $ = cheerio.load(data);
        const parsedContent = $('div.post-content.markdown');
        const images = $('img', parsedContent);
        for (const image of images.toArray()) {
            const originSrc = $(image).attr('src');
            const uploadUrl = originSrc ? await mid.image(originSrc):null;
            if (uploadUrl) {
                $(image).attr('src', uploadUrl);
            } else {
                mid.logger('ArticleCrawler:: handleChinanews: upload Image failed, ignored');
            }
        }
        // const coverRe = new RegExp(//);
        const turndownService = new turndown();
        const articleContent = turndownService.turndown(parsedContent.html());

        const coverLocation = await mid.image(image.substring(0, image.length - 6));

        const articleObj = {
            title,
            cover: coverLocation,
            content: articleContent,
        };

        return articleObj;
    }
    @matchUrl(/https:\/\/orange\.xyz\/p\/[0-9]{1,6}/)
    async handleOrange({ data, url }: Page, mid: Middlewares): Promise<Article> {
        const { title } = opengraph({ data, url },mid);

        // console.log(rawPage);
        // Parser 处理， 转化为markdown， 因平台而异
        const $ = cheerio.load(data);
        const parsedContent = $('div.article-content');
        const parsedCover = $('div.img-center-cropped.float-img').attr('style');
        const coverRe = new RegExp(/url\(\'.*\'\)/);
        const coverUrl = parsedCover && coverRe.exec(parsedCover) ? parsedCover : null;
        const images = $('img', parsedContent);
        for (const image of images.toArray()) {
            const originSrc = $(image).attr('src');
            const uploadUrl = originSrc ? await mid.image(originSrc) : null;
            if (uploadUrl) {
                $(image).attr('src', uploadUrl);
            } else {
                mid.logger('ArticleCrawler:: handleChinanews: upload Image failed, ignored');
            }
        }
        // for (let index = 0; index < parsedContent.childNodes.length; index += 1) {
        //     articleContent += parsedContent.childNodes[index].toString();
        // }
        // 转化为md
        const turndownService = new turndown();
        const articleContent = turndownService.turndown(parsedContent.html());

        // 上传封面
        const coverLocation = coverUrl? await mid.image(coverUrl.substring(5, coverUrl.length - 2)):null;

        const articleObj = {
            title,
            cover: coverLocation,
            content: articleContent,
        };

        return articleObj;
    }
    @matchUrl(/https:\/\/(www\.)?jianshu\.com\/p\/[\w]{12}/)
    async handleJianShu({ url, data }: Page, mid: Middlewares): Promise<Article> {
        const { title } = opengraph({ url, data },mid);
        // Parser 处理， 转化为markdown， 因平台而异
        const $ = cheerio.load(data);
        const parsedContent = $('article');
        const turndownService = new turndown();
        const parsedCoverList = $('article img');
        let coverLocation : string|null = null;
        for (const image of parsedCoverList.toArray()) {
            let originalSrc = $(image).attr('data-original-src')!;
            if (originalSrc.indexOf('http') === -1) originalSrc = 'https:' + originalSrc;
            const imgUpUrl = await mid.image(originalSrc);
            if (!coverLocation) coverLocation = imgUpUrl;
            if (imgUpUrl) {
                $(image).attr('src',imgUpUrl);
            }
        }
        const articleContent = turndownService.turndown(parsedContent.html());

        const articleObj = {
            title,
            cover: coverLocation,
            content: articleContent,
        };

        return articleObj;
    }
    @matchUrl(/https:\/\/(www\.)?igaojin\.me/)
    async handleGaojin({ data, url }: Page, mid: Middlewares): Promise<Article> {
        const { title } = opengraph({ data, url },mid);
        const $ = cheerio.load(data);
        const parsedContent = $('#main .article-inner');
        $('#main .article-footer').remove();
        const turndownService = new turndown();
        // 简单的规则 后期考虑复用等
        const rule = [
            {
                key: 'h1',
                replace: '# ',
            },
            {
                key: 'h2',
                replace: '## ',
            },
            {
                key: 'h3',
                replace: '### ',
            },
            {
                key: 'h4',
                replace: '#### ',
            },
            {
                key: 'h5',
                replace: '##### ',
            },
            {
                key: 'h6',
                replace: '###### ',
            },
        ];
        for (const key of rule) {
            turndownService.addRule('title', {
                filter: key.key,
                replacement: content => key.replace + content,
            });
        }
        turndownService.keep(['figure']);
        const parsedCoverList = $('#main .article-inner img');
        let coverLocation: string | null = null;
        for (const image of parsedCoverList.toArray()) {
            let originalSrc = $(image).attr('src')!;

            if (!(originalSrc.includes('http'))) originalSrc = 'https://igaojin.me/' + originalSrc;
            const imgUpUrl = await mid.image(encodeURI(originalSrc));
            if (!coverLocation) coverLocation = imgUpUrl;
            if (imgUpUrl) {
                $(image).attr('src', imgUpUrl);
            }
        }
        const articleContent = turndownService.turndown(parsedContent.toString());

        const articleObj = {
            title,
            cover: coverLocation,
            content: articleContent,
        };

        return articleObj;
    }
    @matchUrl(/https:\/\/(www\.)?matters\.news\/.+/)
    async handleMatters({ data, url }: Page, mid: Middlewares): Promise<Article> {
        let { title } = opengraph({ data, url },mid);
        title = title.replace(/\s*- Matters/, '');
        const $ = cheerio.load(data);
        const parsedContent = $('div.u-content');
        const turndownService = new turndown();
        const parsedImages = $('img');
        let coverLocation:string|null = null;
        for (const image of parsedImages.toArray()) {
            const originSrc = $(image).attr('src')!;
            const uploadUrl = await mid.image(originSrc);
            if (!coverLocation) { coverLocation = uploadUrl; }
            $(image).attr('src', uploadUrl ? uploadUrl : '');
        }
        const articleContent = turndownService.turndown(parsedContent.html());
        return {
            title,
            cover: coverLocation,
            content: articleContent,
        };
    }
    @matchUrl(/https:\/\/zhuanlan\.zhihu\.com\/p\/\d+/)
    async handleZhihu({ data, url }: Page, mid: Middlewares):Promise<Article> {
        const { title } = opengraph({ data, url },mid);
        const $ = cheerio.load(data);
        const parsedContent = $('div.RichText.ztext.Post-RichText');
        const turndownService = new turndown();
        const parsedTitleImage = $('img.TitleImage');
        const parsedImages = $('img', parsedContent);
        const parsedLinkCards = $('a.LinkCard');
        let coverLocation:string|null = null;
        if (parsedTitleImage) {
            const originSrc = parsedTitleImage.attr('src')!;
            coverLocation = await mid.image(originSrc);
        }
        for (const image of parsedImages.toArray()) {
            const originSrc = $(image).attr('data-original');
            const uploadUrl = originSrc ? await mid.image(originSrc) : null;
            $(image).attr('src', uploadUrl ? uploadUrl : '');
        }

        for (const linkCard of parsedLinkCards.toArray()) {
            $(linkCard).attr('target', 'linebreak'); // hack
        }
        turndownService.addRule('linkCard', {
            filter: 'a',
            replacement: (content, node) =>
                `[${content}](${node.href}) ${node.target === 'linebreak' ? '\n\n' : ''}`,
        });
        turndownService.remove('noscript');
        const articleContent = turndownService.turndown(parsedContent.html());
        return {
            title,
            cover: coverLocation,
            content: articleContent,
        };
    }
    @matchUrl(/https:\/\/(www\.)?weibo\.com\/ttarticle\/p\/show.+/)
    async handleWeibo({ url, data }: Page, mid: Middlewares): Promise<Article> {
        const $ = cheerio.load(data);
        const title = $('div.title').text();
        const parsedTitleImage = $('img');
        const parsedContent = $('div.WB_editor_iframe_new');
        const parsedImages = $('img', parsedContent);
        let coverLocation:string|null = null;
        if (parsedTitleImage) {
            const originSrc = parsedTitleImage.attr('src')!;
            coverLocation = await mid.image(originSrc);
        }
        for (const image of parsedImages.toArray()) {
            const originSrc = $(image).attr('src');
            if (originSrc) {
                const uploadUrl = await mid.image(originSrc);
                if (uploadUrl) $(image).attr('src', uploadUrl);
            }
        }
        const turndownService = new turndown();
        const articleContent = turndownService.turndown(parsedContent.html());
        return {
            title,
            cover: coverLocation,
            content: articleContent,
        };
    }
}