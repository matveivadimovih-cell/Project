import { useEffect, useState } from "react";
import { market } from "../serv/market";
import StockCard from "./stockCard.jsx";
import LogConsole from "./LogConsole.jsx";

export default function Dashboard()
{
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        market.start(1000);
        setIsRunning(true);

        return () => {
            market.stop();
            setIsRunning(false);
        };
    }, []);

    const handleStop = () => {
        market.stop();
        setIsRunning(false);
    };

    const handleStart = () => {
        market.start();
        setIsRunning(true);
    };

    return (
        <div style = {{ padding: '20px' }}>
            <h1>Stock Market Dashboard</h1>
            <div style={{ marginBottom: '20px' }}>
                <button onClick={handleStop} disabled={!isRunning} style={{ marginRight: '10px' }}>
                    Stop Market
                </button>
                <button onClick={handleStart} disabled={isRunning}>
                    Start Market
                </button>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                <StockCard symbol="AAA" />
                <StockCard symbol="BBB" />
                <StockCard symbol="CCC" />
            </div>
            <LogConsole/>
        </div>
    );
} 