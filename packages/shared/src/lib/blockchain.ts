import { createPublicClient, fallback, http, type PublicClient } from "viem";
import * as chains from "viem/chains";
import { config } from "../config";

const rpcs = config.L1_RPC_URLS.map((rpc) => http(rpc));

export const createNetworkClient = () => {
  const chain = chains[config.L1_CHAIN];

  return createPublicClient({
    batch: {
      multicall: true,
    },
    chain,
    transport: fallback(rpcs),
  }) as PublicClient;
};
