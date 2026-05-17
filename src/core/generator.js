export function* simPrice(symbol, initPrice, options = {})
{
    let currPrice = initPrice;

    const
    {
        max = initPrice * 1.5,
        min = initPrice * 0.5,
        volatility = 0.02
    } = options;

    while (true)
    {
        let percentChange = (Math.random() - 0.5) * 2 * volatility;
        let delta = currPrice * percentChange;

        if(currPrice > max)
        {
            delta = -Math.abs(delta) * 1.5;
        } 
        else if(currPrice < min)
        {
            delta = Math.abs(delta) * 1.5;
        }
        else
        {
            delta -= (currPrice - initPrice) * 0.01;
        }

        currPrice = Math.max(0.01, currPrice + delta);

        yield {
            symbol: symbol,
            price: Math.round(currPrice * 100) / 100,
            timestamp: Date.now()
        };
    }
}