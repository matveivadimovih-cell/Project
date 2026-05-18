class PriorityQueue
{
    constructor(type = "Bids")
    {
        this.elements = [];

        if(type !== "Bids" && type !== "Asks")
        {
            throw new Error("Use Bids or Asks.");
        }

        this.type = type;
        this.comparator = ("Bids" === type) 
            ? (a, b) => b.price - a.price
            : (a, b) => a.price - b.price;
    }

    enqueue(id, price, amount)
    {
        const element  = { id, price, amount, type: this.type };
        let inserted = false;
        for(let i = 0; i < this.elements.length; i++)
        {
            if(this.comparator(element, this.elements[i]) < 0)
            {
                this.elements.splice(i, 0, element);
                inserted = true;
                break;
            }
        }

        if(!inserted)
        {
            this.elements.push(element);
        }
    }

    dequeue()
    {
        return this.elements.shift();
    }

    find(id)
    {
        return this.elements.find(el => el.id === id) || null;
    }

    peek()
    {
        return this.elements[0] || null;
    }

    cancel(id)
    {
        const index = this.elements.findIndex(el => el.id === id);

        if(index !== -1)
        {   
            this.elements.splice(index, 1);
            return true;
        }
        
        return false;
    }       

    size()
    {
        return this.elements.length;
    }
}

export class OrderBook
{    
    constructor()
    {
        this.bids = new PriorityQueue("Bids");
        this.asks = new PriorityQueue("Asks");
        this.idCounter = 0;
    }

    addBid(price, amount)
    {
        const id = this.idCounter++;
        this.bids.enqueue(id, price, amount);
        return id;
    }

    addAsk(price, amount)
    {
        const id = this.idCounter++;
        this.asks.enqueue(id, price, amount);
        return id;
    }

    peekBestBid()
    {
        return this.bids.peek();
    }

    peekBestAsk()
    {
        return this.asks.peek();
    }

    extractBestBid()
    {
        return this.bids.dequeue();
    }   

    extractBestAsk()
    {
        return this.asks.dequeue();
    }

    cancelOrder(id)
    {
        if(this.bids.cancel(id) || this.asks.cancel(id))
        {
            return true;
        }

        return false;
    }

    getAllBids()
    {
        return [...this.bids.elements];
    }

    getAllAsks()
    {
        return [...this.asks.elements];
    }
}
