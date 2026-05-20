import { useEffect, useState } from "react";
import { secureApi } from "../core/proxy";
import { market } from "../serv/market";
import { OrderBook } from "../core/priorityQueue";

export default function TradePanel()
{
    const [isAuth, setIsAuth] = useState(false);
    const [authStrategy, setAuthStrategy] = useState("JWT");
    const [apiKeyInput, setApiKeyInput] = useState("");
    const [balance, setBalance] = useState(0);
    const [portfolio, setPortfolio] = useState({});
    const [symbol, setSymbol] = useState("AAA");
    const [amount, setAmount] = useState(1);
    const [limitPrice, setLimitPrice] = useState(150);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [activeOrders, setActiveOrders] = useState([]);

    useEffect(() =>
    {
        const updatePortfolio = (data) => {
            setBalance(data.balance);
            setPortfolio(Object.fromEntries(data.portfolio));
            try { setActiveOrders(secureApi.api.getActiveOrdersSync() || []); } catch(e){}
        };

        try
        {
            const initData = secureApi.api.getPortfolioSync();
            if (initData) 
            {
                setBalance(initData.balance);
                setPortfolio(Object.fromEntries(initData.portfolio));
                setActiveOrders(secureApi.api.getActiveOrdersSync() || []);
            }
        }
        catch(e){}

        market.emitter.on("portfolioUpdated", updatePortfolio);

        return () => {
            market.emitter.off("portfolioUpdated", updatePortfolio);
        };

    }, []);

    useEffect(() => {
        const currentPrice = market.getPrice(symbol);
        if (currentPrice) setLimitPrice(currentPrice);
    }, [symbol]);

    useEffect(() => {
        let timerId;
        if(error) 
        {
            timerId = setTimeout(() => setError(""), 1000);
        }
        return () => clearTimeout(timerId);
    }, [error]);

    useEffect(() => {
        let timerId;
        if(success) 
        {
            timerId = setTimeout(() => setSuccess(""), 1000);
        }
        return () => clearTimeout(timerId);
    }, [success]);

    const handleLoginJWT = async () => {
        try
        {
            setError("");
            secureApi.setAuthStrategy("JWT");
            setAuthStrategy("JWT");
            await secureApi.api.login("user", "123");
            setIsAuth(true);
            setSuccess("log JWT");

            const data = secureApi.api.getPortfolioSync();
            if(data) {
                setBalance(data.balance);
                setPortfolio(Object.fromEntries(data.portfolio));
                setActiveOrders(secureApi.api.getActiveOrdersSync() || []);
            }
        }
        catch(e)
        {
            setError(e.message);
        }
    };

    const handleLoginApiKey = async () => {
        setError("");
        secureApi.setAuthStrategy("API_KEY");
        setAuthStrategy("API_KEY");
        if(apiKeyInput === "good_key_1")
        {
            secureApi.setApiKey(apiKeyInput);
            setIsAuth(true);
            setSuccess("log API Key");
            const data = secureApi.api.getPortfolioSync();
            if(data) 
            {
                setBalance(data.balance);
                setPortfolio(Object.fromEntries(data.portfolio));
                setActiveOrders(secureApi.api.getActiveOrdersSync() || [])
            }
        }
        else
        {
            setError("Invalid API Key");
            setIsAuth(false);
        }
    };

    const handleLogout = async () => {
        try 
        {
            await secureApi.api.logout();
            secureApi.setAuthStrategy("JWT");
            setIsAuth(false);
            setSuccess("logout");
        } catch (e) 
        {
            setError(e.message);
        }
    };

    const handleMarketOrder = async (orderType) => {
        try
        {
            setError("");
            const res = await secureApi.api.executeMarketOrder(symbol, Number(amount), orderType);
            setSuccess(res.message);
        }
        catch(e)
        {
            setError(e.message);
            if(e.message === "Unauthorized") setIsAuth(false); 
        }
    };

    const handleLimitOrder = async (orderType) => {
        try 
        {
            setError("");
            const res = await secureApi.api.placeLimitOrder(symbol, Number(limitPrice), Number(amount), orderType);
            setSuccess(`Limit order placed! ID: ${res.orderId}`);
        } catch (e) 
        {
            setError(e.message);
            if(e.message === "Unauthorized") setIsAuth(false); 
        }
    }

    const handleCancelOrder = async (symbol, orderId) => {
        try 
        {
            setError("");
            const res = await secureApi.api.cancelLimitOrder(symbol, orderId);
            setSuccess(res.message);
            setActiveOrders(secureApi.api.getActiveOrdersSync());
        } catch (e) 
        {
            setError(e.message);
            if(e.message === "Unauthorized") setIsAuth(false); 
        }
    };

    return(
        <div style = {{border: "1px solid #333", padding: "20px", maxWidth: "400px", backgroundColor: "#1978d6"}}>
            <h2> Trade Panel</h2>
            {error && <div style={{ color: "white", backgroundColor: "red", padding: "5px", marginBottom: "10px" }}>{error}</div>}
            {success && <div style={{ color: "white", backgroundColor: "green", padding: "5px", marginBottom: "10px" }}>{success}</div>}
            <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                <p>Status: {isAuth ? `Authorized (${authStrategy})` : "Unauthorized"}</p>
                <div style={{ marginTop: "10px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {!isAuth ? (
                            <>
                                <button onClick={handleLoginJWT}>Login JWT</button>
                                <div style={{ display: "flex" }}>
                                    <input 
                                        placeholder="API Key" 
                                        value={apiKeyInput} 
                                        onChange={(e) => setApiKeyInput(e.target.value)} 
                                        style={{ width: "100px" }}
                                    />
                                    <button onClick={handleLoginApiKey}>Login API</button>
                                </div>
                            </>
                        ) : (
                            <button onClick={handleLogout}>Logout</button>
                    )}
                </div>
            </div>

            {isAuth && (
                <div style={{ marginBottom: "20px" }}>
                    <h3 style={{ margin: "0 0 5px 0" }}>Account</h3>
                    <div>Balance: ${balance.toFixed(2)}</div>
                    <div style={{ marginTop: "5px" }}>Portfolio: 
                        {Object.entries(portfolio).length === 0 ? " Empty" : 
                            Object.entries(portfolio).map(([sym, amt]) => (
                                <span key={sym} style={{ marginLeft: "10px", backgroundColor: "#e0e0e0", padding: "2px 5px", borderRadius: "3px" }}>
                                    {sym}: {amt}
                                </span>
                            ))
                        }
                    </div>
                </div>
            )}

            {isAuth && (
                <div style={{ marginBottom: "20px", padding: "10px", border: "1px solid #ccc", backgroundColor: "white" }}>
                    <h3 style={{ marginTop: 0 }}>Trade</h3>
                    
                    <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                        <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                            <option value="AAA">AAA</option>
                            <option value="BBB">BBB</option>
                            <option value="CCC">CCC</option>
                        </select>
                        <input 
                            type="number" 
                            placeholder="Amount" 
                            value={amount} 
                            min="1"
                            onChange={(e) => setAmount(e.target.value)} 
                            style={{ width: "70px" }}
                        />
                    </div>

                    <div style={{ marginBottom: "10px" }}>
                        <button 
                            onClick={() => handleMarketOrder("buy")} 
                            style={{ backgroundColor: "#d4edda", marginRight: "10px", cursor: "pointer" }}
                        >
                            Market Buy
                        </button>
                        <button 
                            onClick={() => handleMarketOrder("sell")}
                            style={{ backgroundColor: "#f8d7da", cursor: "pointer" }}
                        >
                            Market Sell
                        </button>
                    </div>

                    <div style={{ borderTop: "1px solid #eee", paddingTop: "10px" }}>
                        <div style={{ marginBottom: "10px" }}>
                            <input 
                                type="number" 
                                placeholder="Limit Price" 
                                value={limitPrice} 
                                onChange={(e) => setLimitPrice(e.target.value)} 
                                style={{ width: "100px", marginRight: "10px" }}
                            />
                        </div>
                        <button 
                            onClick={() => handleLimitOrder("buy")}
                            style={{ backgroundColor: "#c3e6cb", marginRight: "10px", cursor: "pointer" }}
                        >
                            Limit Buy
                        </button>
                        <button 
                            onClick={() => handleLimitOrder("sell")}
                            style={{ backgroundColor: "#f5c6cb", cursor: "pointer" }}
                        >
                            Limit Sell
                        </button>
                    </div>
                </div>
            )}

            {isAuth && (
                <div>
                    <h3 style={{ marginTop: 0 }}>Active Limit Orders</h3>
                    {activeOrders.length === 0 ? (
                        <div style={{ color: "#eaeaea", fontSize: "0.9em" }}>No active orders</div>
                    ) : (
                        <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                            {activeOrders.map(order => (
                                <li key={order.id} style={{ display: "flex", justifyContent: "space-between", alignItems:"center", marginBottom: "5px", backgroundColor: "#fff", padding: "5px", border: "1px solid #ddd", borderRadius: "3px" }}>
                                    <span style={{fontSize: "0.9em"}}>
                                        {order.orderType.toUpperCase()} {order.amount} {order.symbol} @ ${order.price}
                                    </span>
                                    <button 
                                        onClick={() => handleCancelOrder(order.symbol, order.id)}
                                        style={{ backgroundColor: "#dc3545", color: "white", border: "none", cursor: "pointer", borderRadius: "3px", padding: "2px 6px" }}
                                    >
                                        X
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}