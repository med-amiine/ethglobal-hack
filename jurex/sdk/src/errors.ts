export class JurexError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JurexError";
  }
}

/** Thrown when a required wallet (private key) is not configured. */
export class WalletRequiredError extends JurexError {
  constructor() {
    super("A private key is required for this operation. Pass `privateKey` to createJurex().");
    this.name = "WalletRequiredError";
  }
}

/** Thrown when the Jurex API returns an error response. */
export class ApiError extends JurexError {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(`API ${status}: ${message}`);
    this.name = "ApiError";
  }
}

/** Thrown when a contract transaction reverts. */
export class ContractError extends JurexError {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ContractError";
    this.cause = cause;
  }
}

/** Thrown when an agent is not registered in CourtRegistry. */
export class NotRegisteredError extends JurexError {
  constructor(address: string) {
    super(`Agent ${address} is not registered. Call jurex.register() first.`);
    this.name = "NotRegisteredError";
  }
}

/** Thrown when the faucet cooldown has not elapsed. */
export class FaucetCooldownError extends JurexError {
  constructor(public readonly secondsRemaining: number) {
    const h = Math.floor(secondsRemaining / 3600);
    const m = Math.floor((secondsRemaining % 3600) / 60);
    super(`Faucet cooldown active — ${h}h ${m}m remaining.`);
    this.name = "FaucetCooldownError";
  }
}
