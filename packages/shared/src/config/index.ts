import { cleanEnv, str } from "envalid";
import { version } from "../../../../package.json";
import { contractAddress, ethPrivateKey, rpcUrls } from "./validtor";

export const config = cleanEnv(process.env, {
  // app
  NODE_ENV: str({
    choices: ["development", "production", "test"],
    default: "development",
  }),
  LOG_LEVEL: str({
    choices: ["fatal", "error", "warn", "info", "debug", "trace"],
    default: "info",
  }),
  SERVICE_NAME: str({ default: "intmax2-e2e" }),
  SERVICE_VERSION: str({ default: version }),
  // contract
  LIQUIDITY_CONTRACT_ADDRESS: contractAddress(),
  // sdk
  NETWORK_ENVIRONMENT: str({ default: "testnet", choices: ["mainnet", "testnet"] as const }),
  ETH_PRIVATE_KEY: ethPrivateKey(),
  L1_RPC_URLS: rpcUrls(),
  BALANCE_PROVER_URL: str({ default: undefined }),
});

export const isProduction = config.NODE_ENV === "production";
