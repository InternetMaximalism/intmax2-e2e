import { type Chain, createPublicClient, fallback, http, type PublicClient } from "viem";
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

const rpcs = config.L1_RPC_URLS.map((rpc) => http(rpc));

export const createNetworkClient = () => {
  const { chain } = networkConfig[config.NETWORK_ENVIRONMENT];

  return createPublicClient({
    batch: {
      multicall: true,
    },
    chain: chain as Chain,
    transport: fallback(rpcs),
  }) as PublicClient;
};
