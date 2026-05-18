export class PriorityQueue
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
        this.id = 0;
    }

    enqueue(price, amount)
    {
        const element  = { id: this.id++, price, amount, type: this.type };
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
