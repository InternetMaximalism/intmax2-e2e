import { cleanEnv, num, str } from "envalid";
import { version } from "../../../../package.json";
import { contractAddress, ethPrivateKey } from "./utils";

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
  SERVICE_NAME: str({ default: "intmax2-e2e" }),
  SERVICE_VERSION: str({ default: version }),
  // blockchain
  NETWORK_ENVIRONMENT: str({
    choices: ["mainnet", "sepolia"],
    default: "sepolia",
    desc: "The environment of the blockchain network to connect to",
  }),
  ALCHEMY_API_KEY: str(),
  // contract
  LIQUIDITY_CONTRACT_ADDRESS: contractAddress(),
  // sdk
  ENVIRONMENT: str({ default: "testnet", choices: ["mainnet", "testnet"] as const }),
  ETH_PRIVATE_KEY: ethPrivateKey(),
  L1_RPC_URL: str(),
  BALANCE_PROVER_URL: str({ default: undefined }),
});

export const isProduction = config.NODE_ENV === "production";
