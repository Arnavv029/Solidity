# MetaMask Wallet Connection Guide

## What Was Fixed

### 1. **Network Detection & Validation**
   - Added support for multiple blockchain networks (Sepolia, Polygon, Localhost)
   - Automatic network validation when connecting wallet
   - Prompts user to switch networks if on unsupported network

### 2. **Wallet Balance Display**
   - Real-time ETH/MATIC balance fetching from blockchain
   - Improved UI with more prominent balance display
   - Network-aware currency display (ETH vs MATIC)

### 3. **Network Switching Functionality**
   - Easy network switcher in wallet dropdown menu
   - Auto-adds networks to MetaMask if not present
   - Shows current network with visual indicator (green = supported, red = unsupported)

### 4. **Contract Address Management**
   - Dynamic contract address based on network
   - Environment-specific deployments
   - Fallback mechanism for missing networks

### 5. **Error Handling & User Feedback**
   - Clear error messages for connection issues
   - Toast notifications for all wallet events
   - Console logs for debugging

---

## How to Set Up MetaMask

### Step 1: Install MetaMask
1. Go to [metamask.io](https://metamask.io)
2. Install the browser extension
3. Create a wallet or import existing one

### Step 2: Add Supported Networks (if not already present)

#### **Sepolia Testnet** (Recommended for testing)
```
Network Name: Sepolia Testnet
RPC URL: https://sepolia.infura.io/v3/YOUR_INFURA_ID
Chain ID: 11155111
Symbol: ETH
Block Explorer: https://sepolia.etherscan.io
```

#### **Polygon Mainnet**
```
Network Name: Polygon
RPC URL: https://polygon-rpc.com
Chain ID: 137
Symbol: MATIC
Block Explorer: https://polygonscan.com
```

#### **Localhost** (For local development)
```
Network Name: Localhost
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Symbol: ETH
Block Explorer: (none)
```

### Step 3: Get Test Funds (for Sepolia)
1. Go to [Sepolia Faucet](https://sepoliafaucet.com) or [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
2. Enter your wallet address (starts with 0x)
3. Claim test ETH

### Step 4: Connect Your Wallet to AegisEscrow

#### **Method 1: Click "Connect Wallet" Button**
- Navbar shows "Connect Wallet" button
- Click it
- MetaMask popup appears
- Approve the connection
- You're connected!

#### **Method 2: Network Switch**
1. Click your wallet address (after connected)
2. Dropdown menu appears showing:
   - Wallet address
   - Current network & chain ID
   - **Wallet Balance** ← Real-time balance
   - Network status indicator
3. Use "Switch Network" buttons to change networks
4. Current network is highlighted in cyan

---

## Understanding the Wallet Display

### Connected State
```
🟢 [Address: 0x1234...5678]
├─ Network: Sepolia Testnet
├─ Chain ID: 11155111
└─ Balance: 2.5432 ETH ← Your actual blockchain balance
```

### Network Support Indicator
- 🟢 **Green dot** = Supported network (contract available)
- 🔴 **Red dot** = Unsupported network (contract not available here)
- If red: Click "Switch Network" to change to supported network

### Supported Networks
| Network | Chain ID | Status | Testnet? |
|---------|----------|--------|----------|
| Sepolia | 11155111 | ✅ Supported | Yes (Recommended) |
| Polygon | 137 | ✅ Supported | No |
| Localhost | 31337 | ✅ Supported | Yes (Dev only) |

---

## Troubleshooting

### ❌ "MetaMask not detected"
**Solution:** Install MetaMask browser extension

### ❌ "No accounts returned"
**Solution:** 
1. Open MetaMask extension
2. Make sure you're logged in
3. Try connecting again

### ❌ "Unsupported network"
**Solution:**
1. Click wallet dropdown
2. Click "Switch Network" → "Sepolia" (or supported network)
3. MetaMask will ask to switch
4. Approve the switch

### ❌ Balance shows "N/A"
**Solution:**
1. Make sure MetaMask is connected
2. Check you're on a supported network
3. Refresh the page
4. Check your internet connection

### ❌ Cannot switch networks
**Solution:**
1. Make sure you have the network added to MetaMask
2. Try manually adding it (see setup section above)
3. Check you have Infura/Alchemy API key for RPC

### ❌ Contract connection fails
**Solution:**
1. Verify you're on correct network
2. Make sure contract is deployed on this network
3. Check contract address matches deployment

---

## Features Now Available

### ✅ Real Wallet Integration
- Connect actual MetaMask wallet
- View real blockchain balance
- Pay gas fees for transactions

### ✅ Network Switching
- Easy network switcher dropdown
- Automatic network detection
- Support for multiple chains

### ✅ Balance Display
- Real-time balance update
- Currency-aware (ETH vs MATIC)
- Displays in wallet dropdown

### ✅ Error Handling
- User-friendly error messages
- Toast notifications
- Console debug logs

### ✅ Auto Network Add
- MetaMask automatically adds missing networks
- No manual configuration needed
- One-click network switching

---

## Testing the Connection

### Test 1: Connect Wallet
1. Click "Connect Wallet"
2. Should see green indicator
3. Should show your address

### Test 2: View Balance
1. Click connected wallet button
2. Should show dropdown with balance
3. Balance should match MetaMask

### Test 3: Switch Networks
1. Click wallet dropdown
2. Try switching to different supported network
3. Balance should update for new network
4. Chain ID should change

### Test 4: Create Job
1. After connecting, go to "Client Hub"
2. Create a job
3. Should approve transaction in MetaMask
4. Transaction should appear in activity

---

## Environment Variables

Create/update `.env` file with:

```
VITE_INFURA_PROJECT_ID=YOUR_INFURA_ID
VITE_CONTRACT_ADDRESS_SEPOLIA=0x...
VITE_CONTRACT_ADDRESS_POLYGON=0x...
```

---

## Contract Addresses

```javascript
// Currently hardcoded in EscrowContext.jsx
Sepolia:  0x02fA79d6efdD391dF136486e79bb8fda356142dE
Localhost: 0x02fA79d6efdD391dF136486e79bb8fda356142dE
Polygon: 0x02fA79d6efdD391dF136486e79bb8fda356142dE
```

**To update:** Edit `CONTRACT_ADDRESSES` in `src/context/EscrowContext.jsx`

---

## Next Steps

1. ✅ Install MetaMask
2. ✅ Add supported networks
3. ✅ Get test funds (Sepolia)
4. ✅ Click "Connect Wallet"
5. ✅ Check balance displays correctly
6. ✅ Try switching networks
7. ✅ Create test job and approve transaction

**You're all set! 🎉**
