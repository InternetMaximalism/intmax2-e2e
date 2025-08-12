import { config, logger } from "@intmax2-e2e/shared";
import { IntMaxNodeClient } from "intmax2-server-sdk";

export const performJob = async (): Promise<void> => {
  const client = new IntMaxNodeClient({
    environment: config.ENVIRONMENT,
    eth_private_key: config.ETH_PRIVATE_KEY as `0x${string}`,
    l1_rpc_url: config.L1_RPC_URL,
    urls: process.env.BALANCE_PROVER_URL
      ? {
          balance_prover_url: process.env.BALANCE_PROVER_URL,
          use_private_zkp_server: false,
        }
      : undefined,
  });

  // Login
  logger.debug("Logging in to IntMaxNodeClient...");
  await client.login();
  logger.debug("Logged in successfully");
  logger.debug("Address:", client.address);

  console.log("\nFetching balances...");
  const { balances } = await client.fetchTokenBalances();
  console.log("Balances:");
  balances.forEach((balance) => {
    console.log(JSON.stringify(balance, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2));
  });

  // Verify message signature
  const message = "Hello, World!";
  const signature = await client.signMessage(message);
  console.log("Signature: ", signature);

  const isVerified = await client.verifySignature(signature, message);
  console.log("Message verified:", isVerified);

  const tokens = await client.getTokensList();
  console.log("Available tokens:", JSON.stringify(tokens, null, 2));
};
