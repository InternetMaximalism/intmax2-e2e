import {
  type ContractWithdrawal,
  type FetchTransactionsRequest,
  type FetchWithdrawalsResponse,
  IntMaxNodeClient,
  type Token,
  TokenType,
  TransactionStatus,
} from "intmax2-server-sdk";
import { type Abi, formatEther, type PublicClient } from "viem";
import type { Account } from "viem/accounts";
import { privateKeyToAccount } from "viem/accounts";
import { LiquidityAbi } from "../abi";
import { config } from "../config";
import { ETH_TOKEN_INDEX, MAX_LIMIT, TRANSFER_INTERVAL, WITHDRAW_INTERVAL } from "../constants";
import type {
  ClientAddresses,
  DepositParams,
  TokenInfo,
  TokenInfoMap,
  TransferParams,
  WithdrawParams,
} from "../types";
import { createNetworkClient } from "./blockchain";
import { logger } from "./logger";

export class INTMAXClient {
  private static instance: INTMAXClient;
  private static readonly RPC_ERROR_PATTERNS = [
    /network error/i,
    /connection error/i,
    /timeout/i,
    /rate limit/i,
    /too many requests/i,
    /service unavailable/i,
    /internal server error/i,
    /bad gateway/i,
    /gateway timeout/i,
    /HTTP request failed/i,
  ];
  private client: IntMaxNodeClient;
  private account: Account;
  private isLoggedIn: boolean = false;
  private availableTokens: Map<number, Token> = new Map();
  private tokenInfoMap: TokenInfoMap = new Map();
  private ethereumClient: PublicClient;
  private currentRpcIndex: number = 0;
  private maxRetries: number = 3;

  constructor() {
    const clientConfig = {
      environment: config.NETWORK_ENVIRONMENT,
      eth_private_key: config.E2E_ETH_PRIVATE_KEY,
      l1_rpc_url: config.L1_RPC_URLS[this.currentRpcIndex],
      ...(config.BALANCE_PROVER_URL && {
        urls: {
          balance_prover_url: config.BALANCE_PROVER_URL,
          use_private_zkp_server: false,
        },
      }),
    };

    this.client = new IntMaxNodeClient(clientConfig);
    this.account = privateKeyToAccount(config.E2E_ETH_PRIVATE_KEY);
    this.ethereumClient = createNetworkClient();
  }

  static getInstance() {
    if (!INTMAXClient.instance) {
      INTMAXClient.instance = new INTMAXClient();
    }
    return INTMAXClient.instance;
  }

  async login() {
    try {
      await this.client.login();
      this.isLoggedIn = true;
      logger.debug("Logged in successfully");

      const addresses: ClientAddresses = {
        ethAddress: this.account.address,
        intmaxAddress: this.client.address,
        account: this.account,
      };

      await this.loadAvailableTokens();

      return addresses;
    } catch (error) {
      logger.error(`Failed to login: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  }

  async fetchEthereumBalance() {
    try {
      const balance = await this.ethereumClient.getBalance({ address: this.account.address });
      const formattedBalance = formatEther(balance);

      return formattedBalance;
    } catch (error) {
      logger.error(
        `Failed to fetch Ethereum balance: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  async fetchINTMAXBalances() {
    try {
      logger.debug("Fetching INTMAX token balances...");
      const { balances } = await this.client.fetchTokenBalances();

      if (balances.length === 0) {
        logger.info("No token balances found");
        return [];
      }

      return balances;
    } catch (error) {
      logger.error(
        `Failed to fetch INTMAX balances: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  async fetchDeposits(params?: FetchTransactionsRequest) {
    return this.client.fetchDeposits(params);
  }

  async fetchAllDeposits() {
    const allDeposits = [];
    let cursor: string | null = null;
    let response;

    do {
      response = await this.fetchDeposits({ cursor, limit: MAX_LIMIT });

      if (response.items && response.items.length > 0) {
        allDeposits.push(...response.items);
      }

      cursor = response.pagination.next_cursor || null;
    } while (response.pagination.has_more && response.items.length === MAX_LIMIT);

    return allDeposits;
  }

  async fetchTransfers(params?: FetchTransactionsRequest) {
    return this.client.fetchTransfers(params);
  }

  async fetchAllTransfers() {
    const allTransfers = [];
    let cursor: string | null = null;
    let response;

    do {
      response = await this.fetchTransfers({ cursor, limit: MAX_LIMIT });

      if (response.items && response.items.length > 0) {
        allTransfers.push(...response.items);
      }

      cursor = response.pagination.next_cursor || null;
    } while (response.pagination.has_more && response.items.length === MAX_LIMIT);

    return allTransfers;
  }

  async fetchTransactions(params?: FetchTransactionsRequest) {
    return this.client.fetchTransactions(params);
  }

  async fetchAllTransactions() {
    const allTransactions = [];
    let cursor: string | null = null;
    let response;

    do {
      response = await this.fetchTransactions({ cursor, limit: MAX_LIMIT });

      if (response.items && response.items.length > 0) {
        allTransactions.push(...response.items);
      }

      cursor = response.pagination.next_cursor || null;
    } while (response.pagination.has_more && response.items.length === MAX_LIMIT);

    return allTransactions;
  }

  async fetchWithdrawals(params?: FetchTransactionsRequest) {
    return this.client.fetchWithdrawals(params);
  }

  async fetchAllWithdrawals() {
    const allWithdrawals: {
      failed: ContractWithdrawal[];
      need_claim: ContractWithdrawal[];
      relayed: ContractWithdrawal[];
      requested: ContractWithdrawal[];
      success: ContractWithdrawal[];
    } = {
      failed: [],
      need_claim: [],
      relayed: [],
      requested: [],
      success: [],
    };
    let cursor: bigint | null = null;
    let response: FetchWithdrawalsResponse;

    do {
      response = await this.fetchWithdrawals({ cursor, limit: MAX_LIMIT });

      if (response?.withdrawals) {
        (Object.keys(allWithdrawals) as Array<keyof typeof allWithdrawals>).forEach((status) => {
          if (response.withdrawals[status]?.length) {
            allWithdrawals[status].push(...response.withdrawals[status]);
          }
        });
      }

      cursor = response?.pagination?.next_cursor || null;
    } while (response?.pagination?.has_more);

    return allWithdrawals;
  }

  async deposit({ tokenIndex, amount }: DepositParams) {
    return this.executeWithRetry(async () => {
      const token = await this.getToken(tokenIndex);

      const depositRequest = {
        amount,
        token,
        address: this.client.address,
        isMining: false,
      };

      const gas = await this.client.estimateDepositGas({
        ...depositRequest,
        isGasEstimation: true,
        isMining: false,
      });
      logger.debug(`Estimated gas for deposit: ${gas.toString()}`);

      const depositResult = await this.client.deposit(depositRequest);
      if (depositResult.status !== TransactionStatus.Completed) {
        throw new Error("Deposit failed");
      }

      return depositResult;
    }, "deposit");
  }

  async transfer(transferParams: TransferParams[]) {
    await this.fetchTokenInfos(transferParams.map(({ tokenIndex }) => tokenIndex));

    const transferPromises = transferParams.map(async ({ amount, tokenIndex, recipient }) => ({
      amount,
      token: await this.getToken(tokenIndex),
      address: recipient,
    }));
    const transferRequests = await Promise.all(transferPromises);

    const processingInterval = setInterval(() => {
      logger.debug("transfer processing...");
    }, TRANSFER_INTERVAL);

    try {
      const transferResult = await this.client.broadcastTransaction(transferRequests);
      return transferResult;
    } catch (error) {
      logger.error(
        `Failed to transfer: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    } finally {
      clearInterval(processingInterval);
    }
  }

  async withdraw({ tokenIndex, amount, recipient }: WithdrawParams) {
    const token = await this.getToken(tokenIndex);
    const withdrawRequest = {
      amount,
      token,
      address: recipient,
    };

    const processingInterval = setInterval(() => {
      logger.debug("withdrawal processing...");
    }, WITHDRAW_INTERVAL);

    try {
      const withdrawResult = await this.client.withdraw(withdrawRequest);
      return withdrawResult;
    } catch (error) {
      logger.error(
        `Failed to withdrawal: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    } finally {
      clearInterval(processingInterval);
    }
  }

  async claimWithdrawal(needClaims: ContractWithdrawal[]) {
    const processingInterval = setInterval(() => {
      logger.debug("claim withdrawal processing...");
    }, WITHDRAW_INTERVAL);

    try {
      const claimWithdrawResult = await this.client.claimWithdrawal(needClaims);
      return claimWithdrawResult;
    } catch (error) {
      logger.error(
        `Failed to claim withdrawal: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    } finally {
      clearInterval(processingInterval);
    }
  }

  async fetchTokenInfos(tokenIndices: number[]) {
    const uniqueIndices = Array.from(new Set(tokenIndices));

    const missingIndices = uniqueIndices.filter((index) => !this.tokenInfoMap.has(index));

    if (missingIndices.length === 0) {
      return this.tokenInfoMap;
    }

    const results = await this.ethereumClient.multicall({
      contracts: missingIndices.map((tokenIndex) => ({
        address: config.LIQUIDITY_CONTRACT_ADDRESS,
        abi: LiquidityAbi as Abi,
        functionName: "getTokenInfo",
        args: [BigInt(tokenIndex)],
      })),
    });

    if (results.some((result) => result.status !== "success")) {
      throw new Error("One or more token info requests failed");
    }

    results.forEach((result) => {
      const tokenInfo = result.result as TokenInfo;
      this.tokenInfoMap.set(Number(tokenInfo.tokenId), {
        tokenType: tokenInfo.tokenType,
      });
    });

    return this.tokenInfoMap;
  }

  async getToken(tokenIndex: number) {
    const token = this.availableTokens.get(tokenIndex);
    if (!token) {
      throw new Error(`Token with index ${tokenIndex} not found`);
    }

    return this.formatToken(token);
  }

  getAddresses() {
    if (!this.isLoggedIn) {
      throw new Error("Client is not logged in");
    }

    return {
      ethAddress: this.account.address,
      intmaxAddress: this.client.address,
      account: this.account,
    };
  }

  private async getTokenType(tokenIndex: number) {
    if (tokenIndex === ETH_TOKEN_INDEX) {
      return TokenType.NATIVE;
    }

    const tokenInfoMap = await this.fetchTokenInfos([tokenIndex]);
    const tokenType = tokenInfoMap.get(tokenIndex)?.tokenType;
    if (!tokenType) {
      throw new Error(`Token type for index ${tokenIndex} not found`);
    }

    return tokenType;
  }

  private async loadAvailableTokens() {
    try {
      logger.debug("Loading available tokens...");
      const tokens = await this.client.getTokensList();

      if (!tokens || (Array.isArray(tokens) && tokens.length === 0)) {
        logger.info("No tokens available");
        this.availableTokens.clear();
        return;
      }

      this.availableTokens.clear();
      tokens.forEach((token) => {
        this.availableTokens.set(token.tokenIndex, token);
      });

      logger.debug(`Available tokens loaded: ${tokens.length}`);
    } catch (error) {
      logger.error(
        `Failed to load available tokens: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  private isRpcError(error: Error) {
    const errorMessage = error.message.toLowerCase();
    return INTMAXClient.RPC_ERROR_PATTERNS.some((pattern) => pattern.test(errorMessage));
  }

  private async rotateRPC() {
    if (config.L1_RPC_URLS.length <= 1) {
      logger.warn("Only one RPC URL available, cannot rotate");
      return false;
    }

    const previousIndex = this.currentRpcIndex;
    this.currentRpcIndex = (this.currentRpcIndex + 1) % config.L1_RPC_URLS.length;

    logger.info(
      `Rotating RPC from ${config.L1_RPC_URLS[previousIndex]} to ${config.L1_RPC_URLS[this.currentRpcIndex]}`,
    );

    const clientConfig = {
      environment: config.NETWORK_ENVIRONMENT,
      eth_private_key: config.E2E_ETH_PRIVATE_KEY,
      l1_rpc_url: config.L1_RPC_URLS[this.currentRpcIndex],
      ...(config.BALANCE_PROVER_URL && {
        urls: {
          balance_prover_url: config.BALANCE_PROVER_URL,
          use_private_zkp_server: false,
        },
      }),
    };

    this.client = new IntMaxNodeClient(clientConfig);
    await this.client.login();

    return true;
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    let lastError: Error;
    let attempts = 0;

    while (attempts < this.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        attempts++;

        logger.warn(
          `${operationName} failed (attempt ${attempts}/${this.maxRetries}): ${lastError.message}`,
        );

        if (this.isRpcError(lastError) && attempts < this.maxRetries) {
          const rotated = await this.rotateRPC();
          if (!rotated) {
            break;
          }
          logger.info(`Retrying ${operationName} with new RPC endpoint`);
        } else if (attempts < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        }
      }
    }

    logger.error(`${operationName} failed after ${this.maxRetries} attempts`);
    throw lastError!;
  }

  private async formatToken({ tokenIndex, decimals, contractAddress, price }: Token) {
    const tokenType = await this.getTokenType(tokenIndex);

    return {
      tokenType,
      tokenIndex,
      decimals,
      contractAddress,
      price,
    };
  }
}
