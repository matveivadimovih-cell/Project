import { EventEmitter } from "../core/eventEmitter.js";
import { simPrice } from "../core/generator.js";
import { hardCalculateSignal } from "../core/hardCalculateSignal.js";
import { OrderBook } from "../core/priorityQueue.js";
import { logging, logWarn, logInfo } from "../core/decorators.js";

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
        this.globalOrderIdCounter = 0;
    }

    start(tickInterval = 1000)
    {
        if(this.intervals.size > 0)
        {
            logWarn("Market is already running");
            return;
        }
        
        this.tickInterval = tickInterval;

        if(this.allStocks.size === 0)
        {
            this.addStock("AAA", 150, { volatility: 0.05 });
            this.addStock("BBB", 2800, { volatility: 0.01 });
            this.addStock("CCC", 3400, { volatility: 0.001 });
        }
        else
        {
            this._resume();
        }
    }

    async fetchAndInitStocks()
    {
        const stocksFromDB = [
            { symbol: "AAA", initPrice: 150, options: { volatility: 0.05 } },
            { symbol: "BBB", initPrice: 2800, options: { volatility: 0.01 } },
            { symbol: "CCC", initPrice: 3400, options: { volatility: 0.001 } }
        ];

        const results = await asyncMap(stocksFromDB, async (stock) => {
            await new Promise(resolve => setTimeout(resolve, 100));
            this.addStock(stock.symbol, stock.initPrice, stock.options);
            return stock.symbol;
        });

        logInfo(`Init with ${results.filter(r => r.status !== 'error').join(', ')}`);
    }

    addStock(symbol, initPrice, options = {})
    {
        if(this.intervals.has(symbol))
        {
            logWarn(`${symbol} exists`);
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
            logWarn(`Stock ${symbol} doesn't exist`);
            return;
        }

        if(orderType !== "buy" && orderType !== "sell")
        {
            logWarn(`Use buy or sell.`);
            return;
        }

        let orderId = this.globalOrderIdCounter++;
        let newOrder;
        if(orderType === "buy")
        {
            newOrder = orderBook.addBid(orderId, price, amount);
        }
        else
        {
            newOrder = orderBook.addAsk(orderId, price, amount);
        }

        this.emitter.emit("orderAdded", { symbol, order: newOrder });

        this._tryMatchOrder(symbol);

        return orderId;
    }

    removeStock(symbol)
    {
        if(!this.intervals.has(symbol))
        {
            logWarn(`${symbol} doesn't exist`);
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
            logWarn(`Order ${orderId} for ${symbol} doesn't exist`);
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
            logWarn(`Stock ${symbol} doesn't exist`);
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

        const stockInfo = this.allStocks.get(tickResults.symbol);
        const priceForSignal = Math.round(tickResults.price * 5) / 5;
        const signalData = hardCalculateSignal(priceForSignal, stockInfo.price, stockInfo.options.volatility || 0.05);

        const tickresultsWithSignal = { ...tickResults, ...signalData };

        this.emitter.emit("priceUpdate", tickresultsWithSignal);
        this.emitter.emit(`priceUpdate:${tickResults.symbol}`, tickresultsWithSignal);
    }

    stop()
    {
        if(this.intervals.size === 0)
        {
            logInfo("Market is already stopped");
            return;
        }

        this.intervals.forEach((intervalId) => clearInterval(intervalId));
        this.intervals.clear();
        this.emitter.emit("marketStopped", null);
        logInfo("Market stopped");
    }

    _resume()
    {
        if(this.intervals.size > 0)
        {
            logWarn("Market is already running");
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
        logInfo("Market resumed");
    }

    reset()
    {
        this.stop();
        this.currentPrices.clear();
        this.allStocks.clear();
        this.emitter.emit("marketReset", null);
        logInfo("Market reset");
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

Market.prototype.addOrder = logging('INFO')(Market.prototype.addOrder);
Market.prototype.removeOrder = logging('INFO')(Market.prototype.removeOrder);
Market.prototype.addStock = logging('INFO')(Market.prototype.addStock);
Market.prototype.removeStock = logging('INFO')(Market.prototype.removeStock);
Market.prototype.start = logging('INFO')(Market.prototype.start);
Market.prototype.stop = logging('INFO')(Market.prototype.stop);
Market.prototype.reset = logging('INFO')(Market.prototype.reset);
Market.prototype._updatePrice = logging('DEBUG')(Market.prototype._updatePrice);
Market.prototype._tryMatchOrder = logging('DEBUG')(Market.prototype._tryMatchOrder);

export const market = new Market();