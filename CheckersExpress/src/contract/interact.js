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
  // console.log(gameId,stakeInEth);
  if(!(gameId && stakeInEth)) return console.warn('Pass arguments!', gameId ,stakeInEth)

  try{
    const contract = await getEscrowContract();
    const stake = ethers.parseEther(stakeInEth); // e.g. "0.01"
    // console.log(gameId,stake)

    const tx = await contract.createGame(gameId, { value: stake, gasLimit: 300000 });
    await tx.wait();

    // console.log("Game created:", tx.hash);
    return {ok: true};
  } catch (err) {
    throw new Error(err);
  }
};

export const joinGameCon = async (gameId, stakeInEth) => {
  
  try{
    const contract = await getEscrowContract();
    const stake = ethers.parseEther(stakeInEth);

    const tx = await contract.joinGame(gameId, { value: stake, gasLimit: 300000 });
    await tx.wait();

    // console.log("Joined game:", tx.hash);
    return {ok: true};
  } catch (err) {
    throw new Error(err);
  }
};

export const declareWinnerCon = async (gameId, winnerAddress) => {
  try{
    const contract = await getEscrowContract();
    const tx = await contract.declareWinner(gameId, winnerAddress);
    await tx.wait();
    console.log("Winner declared");
  } catch (err) {    
    console.error(err)
  }
};

export const declareDrawCon = async (gameId) => {
  try{
    const contract = await getEscrowContract();
    const tx = await contract.declareDraw(gameId);
    await tx.wait();
    console.log("Draw declared");
  } catch (err) {
    console.error(err)
  }
};

export const triggerTimeoutRefundCon = async (gameId) => {
  try{
    const contract = await getEscrowContract();
    const tx = await contract.triggerTimeoutRefund(gameId);
    await tx.wait();
    console.log("Timeout refund processed");
  } catch (err) {
    console.error(err)
  }
};



