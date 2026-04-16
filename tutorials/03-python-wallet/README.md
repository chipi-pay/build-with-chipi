# Tutorial 03: Python — Server Wallet + Transfers

This tutorial demonstrates how to build a server-side application with wallet management and token transfers using the Chipi Python SDK and FastAPI.

## Features

- ✅ Create wallets for users (server-side)
- ✅ Retrieve wallet information
- ✅ Transfer USDC tokens (gasless)
- ✅ Check token balances
- ✅ Query transaction status
- ✅ FastAPI REST API endpoints

## Prerequisites

### System Dependencies

The Chipi Python SDK depends on `starknet.py`, which requires system libraries.

#### macOS
```bash
brew install cmake gmp
```

**Apple Silicon (M1/M2/M3):** You may need additional flags. See installation section.

#### Linux (Ubuntu/Debian)
```bash
sudo apt install -y libgmp3-dev
```

#### Windows
Requires MinGW via chocolatey:
```bash
choco install mingw
```

For more details, see the [starknet.py installation guide](https://starknetpy.readthedocs.io/en/latest/installation.html).

## Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd tutorial-03-python-server-wallet
```

2. **Create a virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

**Apple Silicon Installation:**
If you encounter issues on Apple Silicon:
```bash
CFLAGS=-I`brew --prefix gmp`/include LDFLAGS=-L`brew --prefix gmp`/lib pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your Chipi API keys from [dashboard.chipipay.com](https://dashboard.chipipay.com/api-keys).

## Usage

### Start the server

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

### API Documentation

Interactive API docs: `http://localhost:8000/docs`

### API Endpoints

#### 1. Create Wallet
```bash
POST /wallets/create
{
  "user_id": "user-123",
  "pin": "secure-pin-1234"
}
```

#### 2. Get Wallet
```bash
GET /wallets/{user_id}
```

#### 3. Get Token Balance
```bash
GET /wallets/{user_id}/balance?token=USDC
```

#### 4. Transfer Tokens
```bash
POST /transfer
{
  "sender_user_id": "user-123",
  "recipient_address": "0x...",
  "amount": "10.5",
  "pin": "secure-pin-1234",
  "token": "USDC"
}
```

#### 5. Get Transaction
```bash
GET /transactions/{hash_or_id}
```

#### 6. Get Transaction Status
```bash
GET /transactions/{tx_hash}/status
```

## Example Usage

### Using cURL

**Create a wallet:**
```bash
curl -X POST http://localhost:8000/wallets/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user-123", "pin": "secure-pin-1234"}'
```

**Get balance:**
```bash
curl http://localhost:8000/wallets/user-123/balance?token=USDC
```

**Transfer USDC:**
```bash
curl -X POST http://localhost:8000/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "sender_user_id": "user-123",
    "recipient_address": "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb",
    "amount": "1.5",
    "pin": "secure-pin-1234",
    "token": "USDC"
  }'
```

## Security Notes

- **Never commit `.env` file** - it contains your secret API keys
- **Store encryption PINs securely** - use proper password hashing in production
- **Use HTTPS in production** - never transmit PINs over unencrypted connections
- **Validate user inputs** - always validate addresses, amounts, and user IDs

## Project Structure

```
.
├── main.py              # FastAPI application with all endpoints
├── requirements.txt     # Python dependencies
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## Methods Used

This tutorial demonstrates all core Chipi SDK methods:

- ✅ `create_wallet` - Create new user wallets
- ✅ `get_wallet` - Retrieve wallet information
- ✅ `transfer` - Transfer tokens (gasless)
- ✅ `get_token_balance` - Check token balances
- ✅ `get_transaction` - Get transaction details
- ✅ `get_transaction_status` - Query on-chain status

## Supported Tokens

- USDC (Native)
- USDC_E (Bridged)
- ETH
- STRK
- USDT
- DAI
- WBTC

## Learn More

- [Chipi Documentation](https://docs.chipipay.com)
- [Python SDK Reference](https://docs.chipipay.com/sdk/python/quickstart)
- [Dashboard](https://dashboard.chipipay.com)
- [Telegram Community](https://t.me/chipipay)

## Support

Need help? Join our [Telegram Community](https://t.me/chipipay) for support.