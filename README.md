# intmax2-e2e

End-to-end testing for the INTMAX network using TypeScript and Rust, covering integration, performance, and reliability checks to ensure smooth interaction between dApps and the network, including wallet operations, token transfers, balance queries, and cross-chain interactions.

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
# activity
yarn workspace activity dev

# deposit
yarn workspace deposit dev

# withdraw
yarn workspace withdraw dev

# transfer
yarn workspace transfer dev
```

## Testing

The project uses Vitest for testing. Run tests with the following commands:

```sh
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run tests with coverage report
yarn coverage
```

## Docker

Build and run the project in a Docker container:

```sh
docker build -f docker/Dockerfile -t intmax2-e2e .
docker run --rm -p 3000:3000 --env-file .env intmax2-e2e workspace activity start
```