import { useEffect, useState } from "react";
import { market } from "../serv/market.js";

export default function StockCard({ symbol })
{
    const [price, setPrice] = useState(null);
    const [prevPrice, setPrevPrice] = useState(null);

    useEffect(() => {
        const initialPrice = market.getPrice(symbol);

        if(initialPrice != null)
        {
            setPrice(initialPrice);
            setPrevPrice(null);
        }

        const unsubscribe = market.emitter.on(`priceUpdate:${symbol}`, (tick) => {
            setPrice(currentPrice => {
                setPrevPrice(currentPrice); 
                return tick.price;
            });
        });

        return () => {
            unsubscribe();
        };
    }, [symbol]);

    const color = (prevPrice === null ? "black" : (price > prevPrice ? "green" : "red"));

    return (
        <div style = { { border: "1px solid #ccc", padding: "10px", margin: "10px", width: "150px", textAlign: "center" } }>
            <h3>{symbol}</h3>
            <p style={{color, fontWeight: 'bold', fontSize: '1.2rem' }}>
                ${(price === null ? '---' : price.toFixed(2))}</p>
        </div>
    );
}