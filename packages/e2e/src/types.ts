import type { Token } from "intmax2-server-sdk";
import type { Account } from "viem/accounts";

export interface Balance {
  [key: string]: any;
}

export interface DepositParams {
  amount: number;
  token: Token;
  address: string;
  isMining: boolean;
}

export interface ClientAddresses {
  ethAddress: string;
  intmaxAddress: string;
  account: Account;
}

export interface TokenInfo {
  tokenType: number;
  tokenAddress: string;
  tokenId: BigInt;
}
