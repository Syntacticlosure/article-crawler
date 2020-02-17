import { get } from '.';
import { writeFileSync } from 'fs';

get('https://zhuanlan.zhihu.com/p/104165843').then(
    (v) => writeFileSync('test.md', v.content)
);