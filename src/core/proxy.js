import { ApiService } from "../serv/api";

const PUBLIC_METHODS = ["login", "getMarketPrice", "getAllMarketPrices"];
const PRIVATE_METHODS = ["logout", "getPortfolio", "getPortfolioSync", "executeMarketOrder", "placeLimitOrder", "cancelLimitOrder"];

const apiService = new ApiService();

