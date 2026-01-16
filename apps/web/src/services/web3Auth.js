/**
 * Web3 Authentication Utility
 * Handles MetaMask wallet connection and signature-based authentication
 */

import { BrowserProvider } from 'ethers';

// Hub API base URL for web3 auth endpoints
const HUB_API_BASE = 'https://presuite.eu/api';

export class Web3AuthError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'Web3AuthError';
    this.code = code;
  }
}

/**
 * Check if MetaMask (or compatible wallet) is installed
 */
export function isWeb3Available() {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

/**
 * Get the user's wallet address from MetaMask
 */
export async function connectWallet() {
  if (!isWeb3Available()) {
    throw new Web3AuthError(
      'MetaMask or compatible wallet not found. Please install MetaMask to use Web3 login.',
      'NO_WALLET'
    );
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);

    if (!accounts || accounts.length === 0) {
      throw new Web3AuthError('No accounts found. Please connect your wallet.', 'NO_ACCOUNTS');
    }

    return accounts[0];
  } catch (err) {
    if (err instanceof Web3AuthError) throw err;

    // Handle user rejection
    if (err.code === 4001) {
      throw new Web3AuthError('Wallet connection was rejected.', 'USER_REJECTED');
    }

    throw new Web3AuthError('Failed to connect wallet. Please try again.', 'CONNECTION_FAILED');
  }
}

/**
 * Request a nonce from the backend for signing
 */
export async function getNonce(address) {
  const response = await fetch(`${HUB_API_BASE}/auth/web3/nonce?address=${address}`);
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Web3AuthError(
      data.error?.message || 'Failed to get signing challenge',
      data.error?.code || 'NONCE_FAILED'
    );
  }

  return {
    message: data.message,
    nonce: data.nonce,
  };
}

/**
 * Sign a message with MetaMask
 */
export async function signMessage(message) {
  if (!isWeb3Available()) {
    throw new Web3AuthError('Wallet not available', 'NO_WALLET');
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(message);
    return signature;
  } catch (err) {
    if (err.code === 4001) {
      throw new Web3AuthError('Signature request was rejected.', 'USER_REJECTED');
    }
    throw new Web3AuthError('Failed to sign message. Please try again.', 'SIGN_FAILED');
  }
}

/**
 * Verify signature with backend and get authentication token
 */
export async function verifySignature(address, signature, message) {
  const response = await fetch(`${HUB_API_BASE}/auth/web3/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address, signature, message }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Web3AuthError(
      data.error?.message || 'Authentication failed',
      data.error?.code || 'VERIFY_FAILED'
    );
  }

  return {
    success: true,
    user: data.user,
    token: data.token,
    isNewUser: data.isNewUser,
  };
}

/**
 * Complete Web3 login flow
 * 1. Connect wallet
 * 2. Get nonce from backend
 * 3. Sign message
 * 4. Verify with backend
 */
export async function web3Login() {
  // Step 1: Connect wallet
  const address = await connectWallet();

  // Step 2: Get nonce
  const { message } = await getNonce(address);

  // Step 3: Sign message
  const signature = await signMessage(message);

  // Step 4: Verify and get token
  const result = await verifySignature(address, signature, message);

  return result;
}
