import { cleanEnv, num, str } from "envalid";
import { version } from "../../../../package.json";

export const config = cleanEnv(process.env, {
  // app
  NODE_ENV: str({
    choices: ["development", "production", "test"],
    default: "development",
  }),
  PORT: num({ default: 3000 }),
  LOG_LEVEL: str({
    choices: ["fatal", "error", "warn", "info", "debug", "trace"],
    default: "info",
  }),
  SERVICE_NAME: str({ default: "intmax2-withdrawal-aggregator" }),
  SERVICE_VERSION: str({ default: version }),
  // sdk
  ENVIRONMENT: str({ default: "testnet", choices: ["mainnet", "testnet"] as const }),
  ETH_PRIVATE_KEY: str({ default: "0x1234" as const }),
  L1_RPC_URL: str({}),
  // blockchain
  NETWORK_ENVIRONMENT: str({
    choices: ["mainnet", "sepolia"],
    default: "sepolia",
    desc: "The environment of the blockchain network to connect to",
  }),
  ALCHEMY_API_KEY: str(),
});

export const isProduction = config.NODE_ENV === "production";
