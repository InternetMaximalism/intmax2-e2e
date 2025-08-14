import { logger } from "@intmax2-e2e/shared";
import { INTMAXClient } from "../lib/intmax";
import {
  formatAndActivities,
  formatAndLogAddresses,
  formatAndLogINTMAXBalances,
  logEthereumBalance,
} from "../lib/utils";
import { ETH_TOKEN_INDEX } from "../constants";

export const performJob = async (): Promise<void> => {
  const intmaxClient = INTMAXClient.getInstance();
  await intmaxClient.login();

  formatAndLogAddresses(intmaxClient.getAddresses());

  const ethBalance = await intmaxClient.fetchEthereumBalance();
  logEthereumBalance(ethBalance);

  const intmaxBalances = await intmaxClient.fetchINTMAXBalances();
  formatAndLogINTMAXBalances(intmaxBalances);

  await fetchAllAccountActivity(intmaxClient);

  const depositResult = await intmaxClient.deposit(ETH_TOKEN_INDEX, 0.00001);
  logger.info(`Deposit TxHash: ${depositResult.txHash}`);
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
    transfers: transfers.pagination.total_count,
    transactions: transactions.pagination.total_count,
  };

  formatAndActivities(accountSummary);

  return {
    deposits,
    withdrawals,
    transfers,
    transactions,
  };
};
