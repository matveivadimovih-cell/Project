import { useEffect, useState } from "react";
import { secureApi } from "../core/proxy";
import { market } from "../serv/market";

export default function TradePanel()
{
    const [isAuth, setIsAuth] = useState(false);
    const [authStrategy, setAuthStrategy] = useState("JWT");
    const [apiKeyInput, setApiKeyInput] = useState("");
    const [balance, setBalance] = useState(0);
    const [portfolio, setPortfolio] = useState({});

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




    return
}