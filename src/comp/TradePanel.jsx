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
        };

        try
        {
            const initData = secureApi.api.getPortfolioSync();
            updatePortfolio(initData);
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
            await secureApi.api.login("user", "123");
            setIsAuth(true);
            setSuccess("log JWT");
        }
        catch(e)
        {
            setError(e.massage);
        }
    };

    const handleLoginApiKey = async () => {
        setError("");
        secureApi.setAuthStrategy("API_KEY")
        if(apiKeyInput === "good_key_1")
        {
            secureApi.setApiKey(apiKeyInput);
            setIsAuth(true);
            setSuccess("log API Key");
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
            setError(e.massage);
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
            setError(e.massage);
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
            setError(e.massage);
        }
    };

    return
}