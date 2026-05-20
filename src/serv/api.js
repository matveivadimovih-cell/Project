import { market } from "./market.js"
import { logging, logWarn } from "../core/decorators.js"

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

    getActiveOrdersSync()
    {
        return Array.from(this.activeOrders.entries()).map(([id, data]) => ({
            id,
            ...data
        }));
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

    async placeLimitOrder(symbol, price, amount, orderType)
    {
        await delay(300);

        const totalCost = amount * price;

        if(orderType === "buy")
        {
            if(this.userBalance < totalCost) throw new Error("you don't have money");
            this.userBalance -= totalCost;
        }
        else if(orderType === "sell")
        {
            const ownedAmount = this.userPortfolio.get(symbol) || 0;
            if(ownedAmount < amount) throw new Error("you don't such amount");

            if(this.userPortfolio.get(symbol) === amount) 
            {
                this.userPortfolio.delete(symbol);
            }
            else 
            {
                this.userPortfolio.set(symbol, ownedAmount - amount);
            }
        }

        const orderId = market.addOrder(symbol, price, amount, orderType);
        this.activeOrders.set(orderId, { symbol, price, amount, orderType });
        return {success: true, orderId};
    }

    async cancelLimitOrder(symbol, orderId)
    {
        await delay(150);

        const myOrder = this.activeOrders.get(orderId);
        if(!myOrder) throw new Error("Order not found in myOrder");

        const success = market.removeOrder(symbol, orderId);
        if(!success)
        {
            throw new Error("Order not found in market")
        }

        const totalCost = myOrder.price * myOrder.amount;
        if(myOrder.orderType === "buy")
        {
            this.userBalance += totalCost;
        }
        else if(myOrder.orderType === "sell")
        {
            const currentAmount = this.userPortfolio.get(symbol) || 0;
            this.userPortfolio.set(symbol, myOrder.amount + currentAmount);
        }

        this.activeOrders.delete(orderId);

        market.emitter.emit("portfolioUpdated", this.getPortfolioSync());

        return {success: true, message: `Order ${orderId} cancelled`}
    }
}

ApiService.prototype.login = logging('INFO')(ApiService.prototype.login);
ApiService.prototype.logout = logging('INFO')(ApiService.prototype.logout);
ApiService.prototype.executeMarketOrder = logging('INFO')(ApiService.prototype.executeMarketOrder);
ApiService.prototype.placeLimitOrder = logging('INFO')(ApiService.prototype.placeLimitOrder);
ApiService.prototype.cancelLimitOrder = logging('INFO')(ApiService.prototype.cancelLimitOrder);

ApiService.prototype.isAuthorized = logging('DEBUG')(ApiService.prototype.isAuthorized);
ApiService.prototype.getMarketPrice = logging('DEBUG')(ApiService.prototype.getMarketPrice);
ApiService.prototype.getAllMarketPrices = logging('DEBUG')(ApiService.prototype.getAllMarketPrices);
ApiService.prototype.getPortfolio = logging('DEBUG')(ApiService.prototype.getPortfolio);
ApiService.prototype.getPortfolioSync = logging('DEBUG')(ApiService.prototype.getPortfolioSync);
ApiService.prototype._handleOrderExecuted = logging('DEBUG')(ApiService.prototype._handleOrderExecuted); 