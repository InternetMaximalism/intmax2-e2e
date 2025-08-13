import { INTMAXClient } from "../lib/intmax";
import {
  formatAndLogAddresses,
  formatAndLogINTMAXBalances,
  logEthereumBalance,
} from "../lib/utils";

export const performJob = async (): Promise<void> => {
  const intmaxClient = INTMAXClient.getInstance();
  await intmaxClient.login();

  formatAndLogAddresses(intmaxClient.getAddresses());

  const ethBalance = await intmaxClient.fetchEthereumBalance();
  logEthereumBalance(ethBalance);

  const intmaxBalances = await intmaxClient.fetchINTMAXBalances();
  formatAndLogINTMAXBalances(intmaxBalances);

  // const depositResult = await intmaxClient.depositNativeToken(0.000001);
  // logger.info(`Deposit Result: ${JSON.stringify(depositResult, null, 2)}`);
};
