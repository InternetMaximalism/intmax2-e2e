import { logger } from "@intmax2-e2e/shared";
import { INTMAXClient } from "../lib/intmax";

export const performJob = async (): Promise<void> => {
  const intmaxClient = INTMAXClient.getInstance();
  await intmaxClient.login();

  const ethBalance = await intmaxClient.fetchEthereumBalance();
  logger.info(`Ethereum Balance: ${ethBalance} ETH`);

  const availableTokens = await intmaxClient.fetchAvailableTokens();
  logger.info(`Available tokens: ${availableTokens.length}`);
};
