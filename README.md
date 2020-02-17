# article-crawler
example code:
```
import { get } from '.';
import { writeFileSync } from 'fs';

get('https://zhuanlan.zhihu.com/p/104165843').then(
    (v) => writeFileSync('test.md', v.content)
);
```

# Middlewares
```
get(url,{request,requestHeadless,image,logger})
```

```
export type Middlewares = {
    request: (x: string) => Promise<string>;
    requestHeadless: (x: string) => Promise<string>;
    image: (x : string) => Promise<string|null>;
    logger: (x : string) => void;
};
```

Request Middleware sends http/https request to target url.

Request Headless Middleware needs to use a headless browser to get datas of some specific platforms,such as Weibo.

Image Middleware replaces every image link to a new image link.

Logger Middleware decides how to output the debug information.

# Types
```
export type Article = {
    title: string,
    cover: string|null,
    content:string
};
```

Article is the return type of function `get`,remember that cover could be null.

# Currently Supported Platforms

Wechat, Chinanews, Orange, Gaojin, Matters, Zhihu, JianShu and Weibo.

