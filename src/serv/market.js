import { EventEmitter } from "../core/eventEmitter.js";
import { simPrice } from "../core/generator.js";
import { OrderBook } from "../core/priorityQueue.js";

class Market
{
    constructor()
    {
        this.emitter = new EventEmitter();
        this.currentPrices = new Map();
        this.intervals = new Map();
        this.tickInterval = 1000;
        this.allStocks = new Map();
        this.orderBooks = new Map();
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

        this.orderBooks.set(symbol, new OrderBook());

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

    addOrder(symbol, price, amount, orderType)
    {
        const orderBook = this.orderBooks.get(symbol);
        if(!orderBook)
        {
            console.warn(`Stock ${symbol} doesn't exist`);
            return;
        }

        if(orderType !== "buy" && orderType !== "sell")
        {
            console.warn(`Use buy or sell.`);
            return;
        }

        let orderId;
        if(orderType === "buy")
        {
            orderId = orderBook.addBid(price, amount);
        }
        else
        {
            orderId = orderBook.addAsk(price, amount);
        }

        this.emitter.emit("orderAdded", { symbol,
            bids: orderBook.getAllBids(),
            asks: orderBook.getAllAsks()
        });

        this._tryMatchOrder(symbol);

        return orderBook.idCounter - 1;
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
        this.orderBooks.delete(symbol);

        this.emitter.emit("stockRemoved", symbol);
    }

    removeOrder(symbol, orderId)
    {
        const orderBook = this.orderBooks.get(symbol);
        if(!orderBook)
        {
            console.warn(`Order ${orderId} for ${symbol} doesn't exist`);
            return;
        }

        const orderCancelled = orderBook.cancelOrder(orderId);
        if(orderCancelled)
        {
            this.emitter.emit("orderCancelled", { symbol, 
                bids: orderBook.getAllBids(),
                asks: orderBook.getAllAsks()
             });
        }

        return orderCancelled;
    }

    _tryMatchOrder(symbol)
    {
        const orderBook = this.orderBooks.get(symbol);
        const currentPrice = this.currentPrices.get(symbol);
        if(!orderBook || !currentPrice)
        {
            console.warn(`Stock ${symbol} doesn't exist`);
            return;
        }

        while(orderBook.peekBestBid() && orderBook.peekBestBid().price >= currentPrice)
        {
            const executedBid = orderBook.extractBestBid();
            this.emitter.emit("orderExecuted", { symbol, order: executedBid, marketPrice: currentPrice });
        }

        while(orderBook.peekBestAsk() && orderBook.peekBestAsk().price <= currentPrice)
        {
            const executedAsk = orderBook.extractBestAsk();
            this.emitter.emit("orderExecuted", { symbol, order: executedAsk, marketPrice: currentPrice });
        }
    }

    _updatePrice(tickResults)
    {
        this.currentPrices.set(tickResults.symbol, tickResults.price);

        this._tryMatchOrder(tickResults.symbol);
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

            const initPrice = this.allStocks.get(symbol)?.price || price;

            const generator = simPrice(symbol, initPrice, options, price);

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
        this.allStocks.clear();
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