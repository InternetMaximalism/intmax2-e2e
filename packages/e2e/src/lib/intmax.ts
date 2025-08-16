import { config, createNetworkClient, LiquidityAbi, logger } from "@intmax2-e2e/shared";
import { IntMaxNodeClient, type Token, TokenType, TransactionStatus } from "intmax2-server-sdk";
import { type Abi, formatEther, type PublicClient } from "viem";
import type { Account } from "viem/accounts";
import { privateKeyToAccount } from "viem/accounts";
import { ETH_TOKEN_INDEX, TRANSFER_INTERVAL, WITHDRAW_INTERVAL } from "../constants";
import type {
  ClientAddresses,
  DepositParams,
  TokenInfo,
  TokenInfoMap,
  TransferParams,
  WithdrawParams,
} from "../types";

export class INTMAXClient {
  private static instance: INTMAXClient;
  private client: IntMaxNodeClient;
  private account: Account;
  private isLoggedIn: boolean = false;
  private availableTokens: Token[] = [];
  private tokenInfoMap: TokenInfoMap = new Map();
  private ethereumClient: PublicClient;

  constructor() {
    const clientConfig = {
      environment: config.ENVIRONMENT,
      eth_private_key: config.ETH_PRIVATE_KEY,
      l1_rpc_url: config.L1_RPC_URL,
      ...(config.BALANCE_PROVER_URL && {
        urls: {
          balance_prover_url: config.BALANCE_PROVER_URL,
          use_private_zkp_server: false,
        },
      }),
    };

    this.client = new IntMaxNodeClient(clientConfig);
    this.account = privateKeyToAccount(config.ETH_PRIVATE_KEY);
    this.ethereumClient = createNetworkClient("ethereum");
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
      console.log("balances", balances);

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

  // TODO: pagination
  async fetchDeposits() {
    return this.client.fetchDeposits();
  }

  async fetchTransfers() {
    return this.client.fetchTransfers();
  }

  async fetchTransactions() {
    return this.client.fetchTransactions();
  }

  async fetchWithdrawals() {
    return this.client.fetchWithdrawals();
  }

  async deposit({ tokenIndex, amount }: DepositParams) {
    const token = await this.getToken(tokenIndex);

    const depositRequest = {
      amount,
      token,
      address: this.client.address,
      isMining: false,
    };

    try {
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
    } catch (error) {
      logger.error(
        `Failed to deposit token: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
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
        `Failed to transfer tokens: ${error instanceof Error ? error.message : "Unknown error"}`,
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
        `Failed to withdraw token: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    } finally {
      clearInterval(processingInterval);
    }
  }

  // async claimWithdrawal() {}

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
    const token = this.availableTokens.find((token) => token.tokenIndex === tokenIndex);
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
        this.availableTokens = [];
        return;
      }

      this.availableTokens = tokens;
      logger.debug(`Available tokens loaded: ${tokens.length}`);
    } catch (error) {
      logger.error(
        `Failed to load available tokens: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
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
