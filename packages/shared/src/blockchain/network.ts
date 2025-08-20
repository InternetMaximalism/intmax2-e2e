import { type Chain, createPublicClient, fallback, http, type PublicClient } from "viem";
import chains from "viem/chains";
import { config } from "../config";

const rpcs = config.L1_RPC_URLS.map((rpc) => http(rpc));

export const createNetworkClient = () => {
  const chain = chains[config.NETWORK_CHAIN];

  return createPublicClient({
    batch: {
      multicall: true,
    },
    chain: chain as Chain,
    transport: fallback(rpcs),
  }) as PublicClient;
};
