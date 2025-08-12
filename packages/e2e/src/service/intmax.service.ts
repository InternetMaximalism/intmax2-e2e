import { config, createNetworkClient, logger } from "@intmax2-e2e/shared";
import { IntMaxNodeClient } from "intmax2-server-sdk";
import { privateKeyToAccount } from "viem/accounts";
import type { Account } from "viem/accounts";
import { formatEther } from "viem";

interface Balance {
  [key: string]: any;
}

export const initializeClient = () => {
  const clientConfig = {
    environment: config.ENVIRONMENT,
    eth_private_key: config.ETH_PRIVATE_KEY as `0x${string}`,
    l1_rpc_url: config.L1_RPC_URL,
    urls: process.env.BALANCE_PROVER_URL
      ? {
          balance_prover_url: process.env.BALANCE_PROVER_URL,
          use_private_zkp_server: false,
        }
      : undefined,
  };

  return new IntMaxNodeClient(clientConfig);
};

export const loginAndLogAddresses = async (client: IntMaxNodeClient) => {
  await client.login();
  logger.debug("Logged in successfully");

  const account = privateKeyToAccount(config.ETH_PRIVATE_KEY as `0x${string}`);

  logger.debug(`ETH Address: ${account.address}`);
  logger.debug(`INTMAX Address: ${client.address}`);

  return {
    account,
  };
};

export const fetchEthereumBalance = async (account: Account) => {
  try {
    const ethereumClient = createNetworkClient("ethereum");

    const balance = await ethereumClient.getBalance({ address: account.address });
    logger.info(`Ethereum Balance: ${formatEther(balance)} ETH`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Failed to fetch Ethereum balance: ${message}`);
    throw error;
  }
};

export const fetchINTMAXBalances = async (client: IntMaxNodeClient): Promise<void> => {
  try {
    logger.info("Fetching INTMAX token balances...");
    const { balances } = await client.fetchTokenBalances();

    console.log("balances", balances);

    if (balances.length === 0) {
      logger.info("No token balances found");
      return;
    }

    logger.info("Token Balances:");
    balances.forEach((balance: Balance, index: number) => {
      const formattedBalance = JSON.stringify(
        balance,
        (_, v) => (typeof v === "bigint" ? v.toString() : v),
        2,
      );
      logger.info(`Balance ${index + 1}: ${formattedBalance}`);
    });
  } catch (error) {
    logger.error("Failed to fetch IntMax balances:", error);
    throw error;
  }
};

export const fetchAvailableTokens = async (client: IntMaxNodeClient): Promise<void> => {
  try {
    logger.info("Fetching available tokens...");
    const tokens = await client.getTokensList();

    if (!tokens || (Array.isArray(tokens) && tokens.length === 0)) {
      logger.info("No tokens available");
      return;
    }

    logger.info(`Available tokens: ${tokens.length}`);
  } catch (error) {
    logger.error("Failed to fetch available tokens:", error);
    throw error;
  }
};
