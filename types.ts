export type Middlewares = {
    request: (x: string) => Promise<string>;
    requestHeadless: (x: string) => Promise<string>;
    image: (x : string) => Promise<string|null>;
    logger: (x : string) => void;
};
export type Article = {
    title: string,
    cover: string|null,
    content:string
};
export type Page = {
    url: string,
    data : string
};

export type Handlers = {
    handler(p: Page, mid: Middlewares): Promise<Article>,
    regexp: RegExp
}[];