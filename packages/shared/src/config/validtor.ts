import { makeValidator } from "envalid";

export const ethPrivateKey = makeValidator<`0x${string}`>((input) => {
  if (typeof input !== "string" || !/^0x[a-fA-F0-9]{64}$/.test(input)) {
    throw new Error("ETH_PRIVATE_KEY must be 0x followed by 64 hex characters");
  }
  return input as `0x${string}`;
});

export const contractAddress = makeValidator<`0x${string}`>((input) => {
  if (typeof input !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(input)) {
    throw new Error("Contract Address must be 0x followed by 40 hex characters");
  }
  return input as `0x${string}`;
});
