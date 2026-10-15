# 🔗 Angel One SmartAPI Free Portfolio Sync Guide

> **100% Free for Retail Demat Accounts**: Unlike other legacy brokers that charge ₹2,000–₹4,000/month for API access, **Angel One provides SmartAPI completely FREE** to all retail demat account holders.

This guide walks you through connecting your Angel One demat account to **Portfolio Rebalancer** in 2 minutes so your portfolio automatically stays synced with zero manual entry.

---

## 🛡️ Privacy & Security Guarantee

1. **Zero Secret Storage**: Your API Key, Client Code, and JWT token operate purely inside your local browser.
2. **Zero Disk / Git Exposure**: No tokens or passwords are ever saved to disk, committed to Git, or sent to any third-party analytics servers.
3. **Read-Only Capability**: This application only calls portfolio inquiry endpoints (`getAllHolding`). It does **not** execute buy/sell market orders through your broker without your direct knowledge.

---

## ⚡ Method 1: 1-Click JSON / Response Paste (Recommended & Simplest)

If you do not want to configure automated API tokens, you can sync your portfolio in 10 seconds:

1. Open a terminal (PowerShell, Command Prompt, or bash) and run the following curl request:
   ```bash
   curl -X GET "https://apiconnect.angelone.in/rest/secure/angelbroking/portfolio/v1/getAllHolding" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "X-PrivateKey: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -H "Accept: application/json" \
     -H "X-UserType: USER" \
     -H "X-SourceID: WEB" \
     -H "X-ClientLocalIP: 127.0.0.1" \
     -H "X-ClientPublicIP: 127.0.0.1" \
     -H "X-MACAddress: 127.0.0.1"
   ```
2. Copy the resulting JSON output.
3. In Portfolio Rebalancer:
   - Click the **`[🔗 Angel One Sync]`** button in the top cockpit toolbar.
   - Switch to the **`1-Click JSON Paste / Export`** tab.
   - Paste the JSON and click **`[📥 Parse & Update Portfolio]`**.
4. All positions, quantities, purchase prices, and CMP are immediately updated!

---

## 🚀 Method 2: SmartAPI Direct Fetch & 8-Hour Auto-Sync

To enable automated 8-hour background synchronization:

### Step 1: Create Free SmartAPI App (2 minutes)
1. Go to the official Angel One SmartAPI Developer Portal: **[https://smartapi.angelone.in](https://smartapi.angelone.in)**.
2. Sign up or log in using your registered Angel One mobile number.
3. Click **Create An App**.
4. Select App Type: **Historical / Trading API**.
5. Set:
   - **App Name**: `MyPortfolioRebalancer`
   - **Redirect URL**: `http://localhost:5200`
6. Click **Create**. You will receive an **API Key**.

### Step 2: Generate Session JWT Token
1. Generate your session token via Angel One's login endpoint:
   - Endpoint: `POST https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword`
   - Body:
     ```json
     {
       "clientcode": "YOUR_CLIENT_CODE",
       "password": "YOUR_PASSWORD_OR_PIN",
       "totp": "123456"
     }
     ```
2. Copy the `jwtToken` from the response.

### Step 3: Enter in Portfolio Rebalancer
1. Click **`[🔗 Angel One Sync]`** in Portfolio Rebalancer.
2. Enter:
   - **Client Code**: e.g., `A123456`
   - **SmartAPI Key**: your SmartAPI key
   - **JWT Token**: your bearer token
3. Check **`[✔] Auto-Sync with Angel One every 8 hours`**.
4. Click **`[🚀 Fetch & Sync Live Holdings]`**.

---

## 🕒 How the 8-Hour Auto-Sync Engine Works

- Whenever you open Portfolio Rebalancer, it checks the timestamp of `portfolio.lastSyncedAt`.
- If the portfolio has not been updated in **8 hours or more**:
  - If you enabled Auto-Sync with saved credentials, the engine silently pulls fresh holdings in the background and notifies you with:
    `🟢 Auto-synced with Angel One (8-hour freshness trigger)`.
  - If credentials are not configured, an informative banner appears above your holdings table:
    `🕒 Portfolio is 8+ hours old. [Sync Angel One] [Refresh CMP]`.
- This ensures that trades made during the trading day are automatically recognized without cluttering your workflow.

---

## ⚡ In-App Manual Trade Logger

If you bought or sold shares on your phone or terminal and just want to update a single position without syncing the entire account:

1. Click the **`[⚡ Trade]`** button on the stock row in the holdings table (or **`[⚡ Log Trade]`** in the top bar).
2. Choose your action:
   - **🟢 Buy / Add**: Increases quantity and **automatically calculates the exact weighted average purchase price**:
     $$\text{New Avg Buy Price} = \frac{(\text{Existing Qty} \times \text{Existing Avg Price}) + (\text{New Qty} \times \text{Trade Price})}{\text{Existing Qty} + \text{New Qty}}$$
   - **🔴 Sell / Trim**: Reduces quantity. Preserves your original buy price. If you sell 100% of your shares, the position is automatically removed.
   - **✏️ Adjust Exact**: Sets the exact quantity and average buy price (useful for dividend reinvestment or manual broker reconciliation).
3. The live preview updates in real time showing Old &rarr; New values. Click **`Confirm Trade`** to apply!
