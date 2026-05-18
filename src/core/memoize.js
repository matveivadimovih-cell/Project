const argKey = (x) => String(x)+':'+typeof x;
const generateKey = (args) => args.map(argKey).join('|');

export function memo(fn, maxSize = 500, evict = null)
{
    const cache = new Map();

    return function(...args)
    {
        const key = generateKey(args);

        if(cache.has(key))
        {
            console.log(`Cache hit for key: ${key}`);
            const entry = cache.get(key);
            entry.count++;
            cache.delete(key);
            cache.set(key, entry);
            return entry.result;
        }

        const res = fn(...args);

        if(cache.size >= maxSize)
        {
            if(typeof evict === 'function')
            {
                evict(cache);
            }
            if (cache.size >= maxSize)
            {
                const firstKey = cache.keys().next().value;
                cache.delete(firstKey);
            }
        }
        cache.set(key, {result: res, count: 1, createTime: Date.now()});
        return res;
    }
}