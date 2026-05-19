const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

let assignedLogLevel = LOG_LEVELS.INFO;
let logStorage = [];
const MAX_LOG_STORAGE = 1000;

export function setLogLevel(level)
{
    assignedLogLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;
}

export function getLogs()
{
    return logStorage;
}

function stringifyArg(arg)
{
    try
    {
        return JSON.stringify(arg);
    }
    catch
    {
        return String(arg);
    }
}

export function Logging(logLevel = 'INFO') 
{
    const currentLogLevel = LOG_LEVELS[logLevel] || LOG_LEVELS.INFO;
    return function(fn)
    {
        return async function(...args)
        {
            if(currentLogLevel < assignedLogLevel)
            {
                const result = await fn(...args);
                return result;
            }

            const timestamp = new Date().toISOString();
            const starttime = Date.now();
            
            try
            {
                const result = await fn(...args);
                const timeTaken = Date.now() - starttime;
                const successMessage = `[${timestamp}] [${logLevel}] [${fn.name}] Success in ${timeTaken}ms and called with args: ${args.map(stringifyArg).join(', ')}`;

                logStorage.push({ timestamp, logLevel, functionName: fn.name, timeTaken, result, message: successMessage });

                if (logStorage.length > MAX_LOG_STORAGE)
                {
                    logStorage.shift();
                }

                return result;
            }
            catch(error)
            {
                const timeTaken = Date.now() - starttime;
                const errorMessage = `[${timestamp}] [${logLevel}] [${fn.name}] Failed in ${timeTaken}ms with error: ${error.message}`;

                logStorage.push({ timestamp, logLevel, functionName: fn.name, timeTaken, result: null, message: errorMessage });
                if (logStorage.length > MAX_LOG_STORAGE)
                {
                    logStorage.shift();
                }

                console.error(errorMessage);
                throw error;
            }
        }
    }

}