import { logger } from "@intmax2-e2e/shared";
import { ETH_TOKEN_INDEX } from "../constants";
import { INTMAXClient } from "../lib/intmax";
import {
  formatAndActivities,
  formatAndLogAddresses,
  formatAndLogINTMAXBalances,
  logEthereumBalance,
} from "../lib/intmaxPrinter";

export const performJob = async (): Promise<void> => {
  const intmaxClient = INTMAXClient.getInstance();
  await intmaxClient.login();

  formatAndLogAddresses(intmaxClient.getAddresses());

  const ethBalance = await intmaxClient.fetchEthereumBalance();
  logEthereumBalance(ethBalance);

  const intmaxBalances = await intmaxClient.fetchINTMAXBalances();
  formatAndLogINTMAXBalances(intmaxBalances);

  await fetchAllAccountActivity(intmaxClient);

  // const depositResult = await intmaxClient.deposit({
  //   tokenIndex: ETH_TOKEN_INDEX,
  //   amount: 0.01,
  // });
  // logger.info(`Deposit TxHash: ${depositResult.txHash}`);

  // NOTE: It sometimes takes 6 minutes.
  // const withdrawResult = await intmaxClient.withdraw({
  //   tokenIndex: ETH_TOKEN_INDEX,
  //   amount: 0.000001,
  //   recipient: intmaxClient.getAddresses()?.ethAddress,
  // });
  // logger.info(`TxRoot ${withdrawResult.txTreeRoot}`);

  // const transferResult = await intmaxClient.transfer([
  //   {
  //     amount: 0.00001,
  //     tokenIndex: ETH_TOKEN_INDEX,
  //     recipient: intmaxClient.getAddresses()?.intmaxAddress,
  //   },
  // ]);
  // logger.info(`TxRoot ${transferResult.txTreeRoot}`);
};

const fetchAllAccountActivity = async (intmaxClient: INTMAXClient) => {
  const [deposits, withdrawals, transfers, transactions] = await Promise.all([
    intmaxClient.fetchDeposits(),
    intmaxClient.fetchWithdrawals(),
    intmaxClient.fetchTransfers(),
    intmaxClient.fetchTransactions(),
  ]);

  const withdrawalsSummary = {
    failed: withdrawals.withdrawals.failed?.length || 0,
    need_claim: withdrawals.withdrawals.need_claim?.length || 0,
    relayed: withdrawals.withdrawals.relayed?.length || 0,
    requested: withdrawals.withdrawals.requested?.length || 0,
    success: withdrawals.withdrawals.success?.length || 0,
  };

  const accountSummary = {
    deposits: deposits.pagination.total_count,
    withdrawals: withdrawalsSummary,
    transfers: transfers.pagination.total_count, // receive
    transactions: transactions.pagination.total_count, // send
  };

  formatAndActivities(accountSummary);

  return {
    deposits,
    withdrawals,
    transfers,
    transactions,
  };
};
