import type { ClientAddresses } from "./../types";
import { logger } from "@intmax2-e2e/shared";
import type { TokenBalance } from "intmax2-server-sdk";

const formatTokenAmount = (amount: bigint, decimals: number) => {
  const divisor = BigInt(10) ** BigInt(decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;

  if (fractionalPart === 0n) {
    return wholePart.toString();
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  const trimmedFractional = fractionalStr.replace(/0+$/, "");

  if (trimmedFractional === "") {
    return wholePart.toString();
  }

  return `${wholePart}.${trimmedFractional}`;
};

export const formatAndLogINTMAXBalances = (balances: TokenBalance[]) => {
  if (!balances || balances.length === 0) {
    logger.debug("Token Balances: No balances found");
    return;
  }

  let output = "📊 Token Balances:\n";
  output += "─".repeat(80) + "\n";

  balances.forEach((balance, index) => {
    const { token, amount } = balance;
    const readableAmount = formatTokenAmount(amount, token.decimals!);
    const usdValue = token.price ? (parseFloat(readableAmount) * token.price).toFixed(2) : "N/A";

    output += `${index + 1}. ${token.symbol}\n`;
    output += `   Amount: ${readableAmount} ${token.symbol}\n`;
    output += `   USD Value: $${usdValue}\n`;
    output += `   Contract: ${token.contractAddress}\n`;
    output += `   Token Index: ${token.tokenIndex}\n`;
    output += `   Price: $${token.price || "N/A"}\n`;

    if (index < balances.length - 1) {
      output += "─".repeat(40) + "\n";
    }
  });

  output += "─".repeat(80) + "\n";

  const totalUsdValue = balances.reduce((total, balance) => {
    const readableAmount = formatTokenAmount(balance.amount, balance.token.decimals!);
    const usdValue = balance.token.price ? parseFloat(readableAmount) * balance.token.price : 0;
    return total + usdValue;
  }, 0);

  output += `💰 Total Portfolio Value: $${totalUsdValue.toFixed(2)}`;

  logger.info(output);
};

export const logEthereumBalance = (balance: string) => {
  logger.info(`Ethereum Balance: ${balance} ETH`);
};

export const formatAndLogAddresses = (addresses: ClientAddresses | null) => {
  if (!addresses) {
    logger.debug("Client Addresses: Not logged in");
    return;
  }

  const output = `📍 Client Addresses:
ETH Address: ${addresses.ethAddress}
INTMAX Address: ${addresses.intmaxAddress}`;

  logger.info(output);
};
