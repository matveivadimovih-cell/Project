const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

async function withLogging(fn) 
{
    return async function(...args)
    {
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