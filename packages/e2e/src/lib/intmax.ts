import { config, createNetworkClient, LiquidityAbi, logger } from "@intmax2-e2e/shared";
import { IntMaxNodeClient, TokenType, type Token } from "intmax2-server-sdk";
import { formatEther, type PublicClient, type Abi } from "viem";
import type { Account } from "viem/accounts";
import { privateKeyToAccount } from "viem/accounts";
import type { ClientAddresses, DepositParams, TokenInfo } from "../types";
import { ETH_TOKEN_INDEX } from "../constants";

export class INTMAXClient {
  private client: IntMaxNodeClient;
  private account: Account;
  private isLoggedIn: boolean = false;
  private static instance: INTMAXClient;
  private availableTokens: Token[] = [];
  private ethereumClient: PublicClient;

  constructor() {
    const clientConfig = {
      environment: config.ENVIRONMENT,
      eth_private_key: config.ETH_PRIVATE_KEY as `0x${string}`,
      l1_rpc_url: config.L1_RPC_URL,
      urls: process.env.BALANCE_PROVER_URL
        ? {
            balance_prover_url: process.env.BALANCE_PROVER_URL,
            use_private_zkp_server: false,
          }
        : undefined,
    };

    this.client = new IntMaxNodeClient(clientConfig);
    this.account = privateKeyToAccount(config.ETH_PRIVATE_KEY as `0x${string}`);
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

      logger.info(`ETH Address: ${addresses.ethAddress}`);
      logger.info(`INTMAX Address: ${addresses.intmaxAddress}`);

      await this.loadAvailableTokens();

      return addresses;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to login: ${message}`);
      throw error;
    }
  }

  private async loadAvailableTokens(): Promise<void> {
    try {
      logger.debug("Loading available tokens...");
      const tokens = await this.client.getTokensList();

      if (!tokens || (Array.isArray(tokens) && tokens.length === 0)) {
        logger.info("No tokens available");
        this.availableTokens = [];
        return;
      }

      this.availableTokens = tokens;
      logger.info(`Available tokens loaded: ${tokens.length}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to load available tokens: ${message}`);
      throw error;
    }
  }

  getAvailableTokens(): Token[] {
    return this.availableTokens;
  }

  async fetchEthereumBalance() {
    try {
      const balance = await this.ethereumClient.getBalance({ address: this.account.address });
      const formattedBalance = formatEther(balance);

      return formattedBalance;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to fetch Ethereum balance: ${message}`);
      throw error;
    }
  }

  // TODO: multicall and cache
  private async getTokenInfo(tokenIndex: number) {
    const result = await this.ethereumClient.readContract({
      address: config.LIQUIDITY_CONTRACT_ADDRESS as `0x${string}`,
      abi: LiquidityAbi as Abi,
      functionName: "getTokenInfo",
      args: [BigInt(tokenIndex)],
    });
    return result as TokenInfo;
  }

  async fetchINTMAXBalances() {
    try {
      logger.debug("Fetching INTMAX token balances...");
      const { balances } = await this.client.fetchTokenBalances();

      if (balances.length === 0) {
        logger.info("No token balances found");
        return [];
      }

      logger.info("Token Balances:");
      // TODO: Format
      // console.log("balances", balances);

      return balances;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to fetch INTMAX balances:: ${message}`);
      throw error;
    }
  }

  async depositNativeToken(amount: number = 0.000001) {
    const token = await this.getNativeToken();

    const depositParams: DepositParams = {
      amount,
      token,
      address: this.client.address,
      isMining: false,
    };

    try {
      logger.debug("\nPreparing deposit...");
      const gas = await this.client.estimateDepositGas({
        ...depositParams,
        isGasEstimation: true,
        isMining: false,
      });
      logger.debug(`Estimated gas for deposit: ${gas.toString()}`);

      const deposit = await this.client.deposit(depositParams);
      logger.debug(`Deposit result: ${JSON.stringify(deposit, null, 2)}`);

      return deposit;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to deposit native token: ${message}`);
      throw error;
    }
  }

  async getNativeToken() {
    if (!this.isLoggedIn) {
      throw new Error("Client is not logged in. Please call login() first.");
    }

    if (this.availableTokens.length === 0) {
      throw new Error("No available tokens found.");
    }

    const nativeToken = this.availableTokens.find((token) => token.tokenIndex === ETH_TOKEN_INDEX);
    if (!nativeToken) {
      throw new Error("Native token not found in available tokens.");
    }

    return this.formatToken(nativeToken);
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

  private async getTokenType(tokenIndex: number) {
    if (tokenIndex === ETH_TOKEN_INDEX) {
      return TokenType.NATIVE;
    }

    const { tokenType } = await this.getTokenInfo(tokenIndex);
    return tokenType;
  }

  getAddresses(): ClientAddresses | null {
    if (!this.isLoggedIn) {
      return null;
    }

    return {
      ethAddress: this.account.address,
      intmaxAddress: this.client.address,
      account: this.account,
    };
  }

  getInternalClient() {
    if (!this.isLoggedIn) {
      throw new Error("Client is not logged in. Please call login() first.");
    }

    return this.client;
  }
}
