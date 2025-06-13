import { ethers } from "ethers";
import abi from "./abi.json" with { type: 'json' };
import { CONTRACT_ADDRESS } from "./contract.js";

export const getEscrowContract = async () => {
  if (typeof window.ethereum === "undefined") {
    alert("MetaMask not found");
    return null;
  }

 try{
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

    return contract;
 } catch (err) {
    throw new Error (err)
 }
};
