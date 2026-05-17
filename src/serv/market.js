import { EventEmitter } from "../core/eventEmitter.js";
import { simPrice } from "../core/generator.js";

class Market
{
    constructor()
    {
        this.emitter = new EventEmitter();
        this.currentPrices = new Map();
        this.intervals = new Map();
        this.tickInterval = 1000;
        this.allStocks = new Map();
    }

    start(tickInterval = 1000)
    {
        this.tickInterval = tickInterval;

        if(this.allStocks.size === 0)
        {
            this.addStock("AAA", 150, { volatility: 0.05 });
            this.addStock("BBB", 2800, { volatility: 0.07 });
            this.addStock("CCC", 3400, { volatility: 0.01 });
        }
        else
        {
            this._resume();
        }
    }

    addStock(symbol, initPrice, options = {})
    {
        if(this.intervals.has(symbol))
        {
            console.warn(`${symbol} exists`);
            return;
        }

        this.allStocks.set(symbol, { symbol, price: initPrice, options });

        const generator = simPrice(symbol, initPrice, options);

        const firstTick = generator.next().value;
        this._updatePrice(firstTick);

        const intervalId = setInterval(() => {
            const tick = generator.next().value;
            this._updatePrice(tick);
        }, this.tickInterval);

        this.intervals.set(symbol, intervalId);

        this.emitter.emit("stockAdded", firstTick);
    }

    removeStock(symbol)
    {
        if(!this.intervals.has(symbol))
        {
            console.warn(`${symbol} doesn't exist`);
            return; 
        }

        clearInterval(this.intervals.get(symbol));
        this.intervals.delete(symbol);
        this.currentPrices.delete(symbol);
        this.allStocks.delete(symbol);

        this.emitter.emit("stockRemoved", symbol);
    }

    _updatePrice(tickResults)
    {
        this.currentPrices.set(tickResults.symbol, tickResults.price);
        this.emitter.emit("priceUpdate", tickResults);
        this.emitter.emit(`priceUpdate:${tickResults.symbol}`, tickResults);
    }

    stop()
    {
        if(this.intervals.size === 0)
        {
            console.log("Market is already stopped");
            return;
        }

        this.intervals.forEach((intervalId) => clearInterval(intervalId));
        this.intervals.clear();
        this.emitter.emit("marketStopped", null);
        console.log("Market stopped");
    }

    _resume()
    {
        if(this.intervals.size > 0)
        {
            console.warn("Market is already running");
            return;
        }

        this.currentPrices.forEach((price, symbol) => {
            const options = this.allStocks.get(symbol)?.options || {};

            const generator = simPrice(symbol, price, options);

            const intervalId = setInterval(() => {
                const tick = generator.next().value;
                this._updatePrice(tick);
            }, this.tickInterval);

            this.intervals.set(symbol, intervalId);
        });

        this.emitter.emit("marketResumed", null);
        console.log("Market resumed");
    }

    reset()
    {
        this.stop();
        this.currentPrices.clear();
        this.allStocks = new Map();
        this.emitter.emit("marketReset", null);
        console.log("Market reset");
    }

    getPrice(symbol)
    {
        return this.currentPrices.get(symbol) || null;
    }

    getAllPrices()
    {
        const prices = {};
        this.currentPrices.forEach((price, symbol) => {
            prices[symbol] = price;
        });
        return prices;
    }
}

export const market = new Market();