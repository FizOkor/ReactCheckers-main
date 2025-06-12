import { useState, useEffect } from "react";
import './navbar.css';
// import './index.css';

import { connectWallet, getCurrentWallet } from '../contract/interact.js';

function Navbar({account, setAccount}) {
  // const [account, setAccount] = useState(null);

  const handleConnect = async () => {
    const selectedAccount = await connectWallet();

    setAccount(selectedAccount)
  };

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const currentAccount = await getCurrentWallet();
        setAccount(currentAccount);
      } catch (error) {
        console.error('Error in useEffect:', error);
      }
    };

    fetchWallet();
  }, [setAccount]);

  return (
    <div className="navbar">
        <div></div>
        <button
          className="connect-btn"
          onClick={handleConnect}
        >
          {account ? `Connected: ${account.slice(0, 5)}...${account.slice(-4)}` : "Connect Wallet"}
        </button>
    </div>
  );
}

export default Navbar;
