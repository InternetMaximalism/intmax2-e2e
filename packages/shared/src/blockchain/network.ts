import { type Chain, createPublicClient, http, type PublicClient } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { config } from "../config";

export const networkConfig = {
  mainnet: {
    chain: mainnet,
  },
  testnet: {
    chain: sepolia,
  },
};

export const createNetworkClient = () => {
  const { chain } = networkConfig[config.NETWORK_ENVIRONMENT];

  return createPublicClient({
    batch: {
      multicall: true,
    },
    chain: chain as Chain,
    transport: http(config.L1_RPC_URL),
  }) as PublicClient;
};
