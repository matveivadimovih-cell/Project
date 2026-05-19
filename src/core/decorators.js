const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

let assignedLogLevel = LOG_LEVELS.INFO;

export function setLogLevel(level)
{
    assignedLogLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;
}


async function withLogging(logLevel = 'INFO') 
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
            console.log(`Calling ${fn.name} with arguments: ${JSON.stringify(args)}`);
            try
            {
                    const result = await fn(...args);
                    console.log(`Result from ${fn.name}: ${JSON.stringify(result)}`);
                    return result;
            }
            catch(error)
            {
                    console.error(`Error in ${fn.name}: ${error.message}`);
                    throw error;
            }
        }
    }

}