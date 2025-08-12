# intmax2-e2e

The withdrawal aggregator is responsible for consolidating withdrawals and managing requests to the ZKP (Zero-Knowledge Proof).

## Setup

Before running any service, make sure to:

```sh
# Install dependencies
yarn

# Copy environment variables
cp .env.example .env

# Build shared packages
yarn build:shared
```

## Development

Start the processor or job service in development mode:

```sh
# collector
yarn workspace e2e dev
```