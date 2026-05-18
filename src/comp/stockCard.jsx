import { useEffect, useState, useRef } from "react";
import { market } from "../serv/market.js";

export default function StockCard({ symbol })
{
    const [price, setPrice] = useState(null);
    const prevPriceRef = useRef(null);

    useEffect(() => {
        const initialPrice = market.getPrice(symbol);

        if(initialPrice != null)
        {
            setPrice(initialPrice);
            prevPriceRef.current = null;
        }

        const unsubscribe = market.emitter.on(`priceUpdate:${symbol}`, (tick) => {
            setPrice(currentPrice => {
                prevPriceRef.current = currentPrice; 
                return tick.price;
            });
        });

        return () => {
            unsubscribe();
        };
    }, [symbol]);

    if(price === null)
    {
        return <div> loading... </div>;
    }
    
    const color = (prevPriceRef.current === null ? "black" : (price > prevPriceRef.current ? "green" : "red"));

    return (
        <div style = { { border: "1px solid #ccc", padding: "10px", margin: "10px", width: "150px", textAlign: "center" } }>
            <h3>{symbol}</h3>
            <p style={{color, fontWeight: 'bold', fontSize: '1.2rem' }}>
                ${(price === null ? '---' : price.toFixed(2))}
            </p>
            
        </div>
    );
}