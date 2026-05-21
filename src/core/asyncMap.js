import { logging, logError } from "./decorators";

async function asMap(arr, asyncFn)
{
    const promises = new Array();
    for(let i = 0; i<arr.length; i++)
    {
        const safePromise = asyncFn(arr[i], i, arr).catch(err => {
            const errorMsg = err instanceof Error ? err.message : String(err);
            logError(`asyncMap item ${i} failed ${errorMsg}`);
            return { status: "error", error: err };
        })
        promises.push(safePromise);
    }
    return await Promise.all(promises);
}

export const asyncMap = logging("DEBUG")(asMap);
