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
        if(error) setTimeout(() => setError(""), 1000);
        if(success) setTimeout(() => setSuccess(""), 1000);
    }, [error, success])

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
        }
    };

    return(
        <div style = {{border: "1px solid #333", padding: "20px", maxWidth: "400px", backgroundColor: "#f8f9fa"}}>
            <h2> Trade Panel</h2>
            {error && <div style={{ color: "white", backgroundColor: "red", padding: "5px", marginBottom: "10px" }}>{error}</div>}
            {success && <div style={{ color: "white", backgroundColor: "green", padding: "5px", marginBottom: "10px" }}>{success}</div>}
            <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                <p>Status: {isAuth ? `Authorized (${authStrategy})` : "Unauthorized"}</p>
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

    )
}