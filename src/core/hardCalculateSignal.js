import { memo } from './memoize.js';

function _hardCalculateSignal(currentPrice, initialPrice, volatility)
{
    const changePercent = ((currentPrice - initialPrice) / initialPrice) * 100;

    let signal = 'HOLD';

    if(changePercent > volatility * 100 * 2)
    {
        signal = 'SELL';
    }
    else if(changePercent < -volatility * 100 * 2)
    {
        signal = 'BUY';
    }

    return { signal, changePercent: changePercent.toFixed(2) };
}

const memoHardCalculateSignal = memo(_hardCalculateSignal, 100);

export const hardCalculateSignal = logging('DEBUG')(memoHardCalculateSignal);