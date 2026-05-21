import { EventEmitter } from "./eventEmitter.js"

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

let assignedLogLevel = LOG_LEVELS.INFO;
let logStorage = [];

const MAX_LOG_STORAGE = 1000;

export const loggerEmitter = new EventEmitter();

function emitAndAddLog(logEntry)
{
    if (logStorage.length >= MAX_LOG_STORAGE)
    {
        logStorage.shift();
    }

    logStorage.push(logEntry);

    loggerEmitter.emit('logAdded', logEntry);
}

export function setLogLevel(level)
{
    assignedLogLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;
}

export function getLogs()
{
    return [...logStorage];
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

export function logWarn(message, data = {})
{
    if(LOG_LEVELS.WARN < assignedLogLevel)
    {
        return;
    }
    const timestamp = new Date().toISOString();
    emitAndAddLog({ timestamp, logLevel: 'WARN', functionName: '', timeTaken: 0, result: null, message, ...data });
}

export function logInfo(message, data = {})
{
    if(LOG_LEVELS.INFO < assignedLogLevel)
    {
        return;
    }
    const timestamp = new Date().toISOString();
    emitAndAddLog({ timestamp, logLevel: 'INFO', functionName: '', timeTaken: 0, result: null, message, ...data });
}

export function logError(message, data = {})
{
    if(LOG_LEVELS.ERROR < assignedLogLevel)
    {
        return;
    }
    const timestamp = new Date().toISOString();
    emitAndAddLog({ timestamp, logLevel: 'ERROR', functionName: '', timeTaken: 0, result: null, message, ...data });
}

export function logging(logLevel = 'INFO') 
{
    const currentLogLevel = LOG_LEVELS[logLevel] || LOG_LEVELS.INFO;
    return function(fn)
    {
        return function(...args)
        {
            if(currentLogLevel < assignedLogLevel)
            {
                const result = fn.apply(this, args);
                return result;
            }

            const timestamp = new Date().toISOString();
            const starttime = Date.now();
            const fnName = fn.name || 'anonymous';
            
            try
            {
                const result = fn.apply(this, args);

                if(result instanceof Promise)
                {
                    result.then(asyncResult => {
                        const timeTaken = Date.now() - starttime;

                        if(logLevel != 'ERROR')
                        {
                            const successMessage = `[${timestamp}] [${logLevel}] [${fnName}] Success in ${timeTaken}ms and called with args: ${args.map(stringifyArg).join(', ')}`;
                            emitAndAddLog({ timestamp, logLevel, functionName: fnName, timeTaken, result: asyncResult, message: successMessage });
                        }
                    })
                    .catch(error => {
                        const timeTaken = Date.now() - starttime;
                        const errorMessage = `[${timestamp}] [${logLevel}] [${fnName}] Failed in ${timeTaken}ms with error: ${error.message}`;

                        emitAndAddLog({ timestamp, logLevel, functionName: fnName, timeTaken, result: null, message: errorMessage });

                        console.error(errorMessage);

                        throw error;
                    });
                    return result;
                }
                else
                {
                    const timeTaken = Date.now() - starttime;

                    if(logLevel != 'ERROR')
                    {
                        const successMessage = `[${timestamp}] [${logLevel}] [${fnName}] Success in ${timeTaken}ms and called with args: ${args.map(stringifyArg).join(', ')}`;
                        emitAndAddLog({ timestamp, logLevel, functionName: fnName, timeTaken, result, message: successMessage });
                    }

                    return result;
                }
            }
            catch(error)
            {
                const timeTaken = Date.now() - starttime;
                const errorLogLevel = 'ERROR';
                const errorMessage = `[${timestamp}] [${logLevel}] [${fnName}] Failed in ${timeTaken}ms with error: ${error.message}`;

                emitAndAddLog({ timestamp, logLevel: errorLogLevel, functionName: fnName, timeTaken, result: null, message: errorMessage });

                console.error(errorMessage);
                throw error;
            }
        }
    }
}