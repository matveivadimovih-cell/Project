import { market } from "./market.js"

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class ApiService
{
    constructor(balance = 10000)
    {
        this.userBalance = balance;
        this.userPortfolio = new Map()
        this.authToken = null;
        this.tokenTimeTo = null;

        this.activeOrders = new Map();

        this._subscribeMarketEvents();
    }

    _subscribeMarketEvents()
    {
        market.emitter.on("orderExecuted", (data) => {
            this._handleOrderExecuted(data);
        })
    }

    _handleOrderExecuted({ symbol, order, marketPrice })
    {
        const myOrder = this.activeOrders.get(order.id);

        if(!myOrder)
        {
            return;
        }

        if(myOrder.orderType === "buy")
        {
            const currentAmount = this.userPortfolio.get(symbol) || 0;
            this.userPortfolio.set(symbol, myOrder.amount + currentAmount);
        }
        else if(myOrder.orderType === "sell")
        {
            this.userBalance += order.amount * marketPrice;
        }

        this.activeOrders.delete(order.id);

        market.emitter.emit("portfolioUpdated", this.getPortfolioSync());
    }

    async login(username, password)
    {
        await delay(200);

        if(username === "user" && password === "123")
        {
            this.authToken = `token_${Date.now()}`
            this.tokenTimeTo = Date.now() + 5 * 60 * 1000;
            return {success: true, token: this.authToken};
        }
        throw new Error("Invalid username or password")
    }

    async logout()
    {
        await delay(200);
        this.authToken = null;
        this.tokenTimeTo = null;
    }

    isAuthorized()
    {
        return (this.authToken != null && Date.now() < this.tokenTimeTo);
    }

    async getMarketPrice(symbol)
    {
        await delay(50);

        return market.getPrice(symbol);
    }

    async getAllMarketPrices() 
    {
        await delay(50);

        return market.getAllPrices();
    }

    getPortfolioSync()
    {
        return {
            balance: this.userBalance,
            portfolio: this.userPortfolio
        };
    }

    async getPortfolio()
    {
        await delay(50);
        return this.getPortfolioSync();
    }

    async executeMarketOrder(symbol, amount, orderType)
    {
        await delay(300);

        const currentPrice = market.getPrice(symbol);
        if(!currentPrice) throw new Error(`${symbol} not found`);

        const totalCost = amount * currentPrice;
        if(orderType === "buy")
        {
            if(this.userBalance < totalCost) throw new Error("you don't have money");
            this.userBalance -= totalCost;
            this.userPortfolio.set(symbol, (this.userPortfolio.get(symbol) || 0) + amount);
        }
        else if(orderType === "sell")
        {
            const ownedAmount = this.userPortfolio.get(symbol) || 0;
            if(ownedAmount < amount) throw new Error("you don't such amount");

            this.userBalance += totalCost;
            if(this.userPortfolio.get(symbol) === amount) 
            {
                this.userPortfolio.delete(symbol);
            }
            else 
            {
                this.userPortfolio.set(symbol, ownedAmount - amount);
            }
        }

        market.emitter.emit("portfolioUpdated", (this.getPortfolioSync()));
        return {success: true, message: `${orderType} executed`};
    }

    async placeLimitOrder()
    {
        
    }

    async cancelLimitOrder()
    {

    }

}