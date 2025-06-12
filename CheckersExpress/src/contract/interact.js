import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getEscrowContract } from "./getContract.js";
import abi from "./abi.json" with { type: 'json' };
import { CONTRACT_ADDRESS } from "./contract.js";


export const connectWallet = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask!");
    return null;
  }

  try {
    console.log('connect');
    await window.ethereum.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }]
    });

    // account picker
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts", // account selection
    });
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No account selected");
    }

    const selectedAccount = accounts[0]; 

    return selectedAccount;
  } catch (error) {
    console.error("Connection failed:", error);

    if (error.code === 4001) {
      alert("Connection rejected - please connect to continue");
    } else {
      alert("Failed to connect wallet");
    }

    return null;
  }
};

export const getCurrentWallet = async () => {
  if (typeof window.ethereum !== "undefined") {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length > 0) {
        return accounts[0];
      }
      console.error("No accounts found");
      return null;
    } catch {
      console.error("Connect Wallet");
      return null;
    }
  } else {
    console.warn("Ethereum provider not found, Please Install Metmask!");
    return null;
  }
};

export const createGameCon = async (gameId, stakeInEth) => {
  const contract = await getEscrowContract();
  const stake = ethers.parseEther(stakeInEth); // e.g. "0.01"
  const tx = await contract.createGame(gameId, { value: stake });
  await tx.wait();
  console.log("Game created:", tx.hash);
};

export const joinGameCon = async (gameId, stakeInEth) => {
  const contract = await getEscrowContract();
  const stake = ethers.parseEther(stakeInEth);
  const tx = await contract.joinGame(gameId, { value: stake });
  await tx.wait();
  console.log("Joined game:", tx.hash);
};

export const declareWinnerCon = async (gameId, winnerAddress) => {
  const contract = await getEscrowContract();
  const tx = await contract.declareWinner(gameId, winnerAddress);
  await tx.wait();
  console.log("Winner declared");
};

export const declareDrawCon = async (gameId) => {
  const contract = await getEscrowContract();
  const tx = await contract.declareDraw(gameId);
  await tx.wait();
  console.log("Draw declared");
};

export const triggerTimeoutRefundCon = async (gameId) => {
  const contract = await getEscrowContract();
  const tx = await contract.triggerTimeoutRefund(gameId);
  await tx.wait();
  console.log("Timeout refund processed");
};



