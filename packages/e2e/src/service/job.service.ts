import { logger } from "@intmax2-e2e/shared";
import { INTMAXClient } from "../lib/intmax";

export const performJob = async (): Promise<void> => {
  const intmaxClient = INTMAXClient.getInstance();
  await intmaxClient.login();

  const ethBalance = await intmaxClient.fetchEthereumBalance();
  logger.info(`Ethereum Balance: ${ethBalance} ETH`);

  const intmaxBalance = await intmaxClient.fetchINTMAXBalances();
  // logger.info(`INTMAX Balance: ${JSON.stringify(intmaxBalance, null, 2)}`);

  const depositResult = await intmaxClient.depositNativeToken();
  logger.info(`Deposit Result: ${JSON.stringify(depositResult, null, 2)}`);
};
