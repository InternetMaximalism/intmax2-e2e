import { cleanEnv, num, str } from "envalid";
import { version } from "../../../../package.json";
import { contractAddress, ethPrivateKey, rpcUrls } from "./validtor";

export const config = cleanEnv(process.env, {
  // app
  NODE_ENV: str({
    choices: ["development", "production", "test"],
    default: "development",
    desc: "Application environment mode",
  }),
  LOG_LEVEL: str({
    choices: ["fatal", "error", "warn", "info", "debug", "trace"],
    default: "info",
    desc: "Logging level for application output",
  }),
  SERVICE_NAME: str({
    default: "intmax2-e2e",
    desc: "Name of the service for identification",
  }),
  SERVICE_VERSION: str({
    default: version,
    desc: "Version of the service from package.json",
  }),
  // blockchain
  L1_CHAIN: str({
    default: "sepolia",
    choices: ["mainnet", "sepolia"] as const,
    desc: "Layer 1 blockchain network to connect to",
  }),
  // contract
  LIQUIDITY_CONTRACT_ADDRESS: contractAddress({
    desc: "Address of the liquidity contract on L1",
  }),
  // sdk
  NETWORK_ENVIRONMENT: str({
    default: "testnet",
    choices: ["mainnet", "testnet"] as const,
    desc: "INTMAX network environment for SDK connection",
  }),
  E2E_ETH_PRIVATE_KEY: ethPrivateKey({
    desc: "Private key for Ethereum account used in E2E tests",
  }),
  L1_RPC_URLS: rpcUrls({
    desc: "Comma-separated list of RPC URLs for L1 blockchain connection",
  }),
  BALANCE_PROVER_URL: str({
    default: undefined,
    desc: "Optional URL for custom balance prover service",
  }),
  DEPOSIT_AMOUNT: num({
    default: 0.01,
    desc: "Default amount for deposit transactions in ETH",
  }),
  WITHDRAW_AMOUNT: num({
    default: 0.00001,
    desc: "Default amount for withdrawal transactions in ETH",
  }),
  TRANSFER_AMOUNT: num({
    default: 0.00001,
    desc: "Default amount for transfer transactions in ETH",
  }),
  RECIPIENT_INTMAX2_ADDRESS: str({
    default: undefined,
    desc: "Default recipient address for INTMAX2 transfers",
  }),
});

export const isProduction = config.NODE_ENV === "production";
