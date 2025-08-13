import { logger } from "@intmax2-e2e/shared";
import { INTMAXClient } from "../lib/intmax";
import { formatAndLogAddresses, formatAndLogBalances } from "../lib/utils";

export const performJob = async (): Promise<void> => {
  const intmaxClient = INTMAXClient.getInstance();
  await intmaxClient.login();

  formatAndLogAddresses(intmaxClient.getAddresses());

  const ethBalance = await intmaxClient.fetchEthereumBalance();
  logger.info(`Ethereum Balance: ${ethBalance} ETH`);

  const intmaxBalances = await intmaxClient.fetchINTMAXBalances();
  formatAndLogBalances(intmaxBalances);

  // const depositResult = await intmaxClient.depositNativeToken(0.000001);
  // logger.info(`Deposit Result: ${JSON.stringify(depositResult, null, 2)}`);
};
