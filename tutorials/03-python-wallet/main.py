"""
Tutorial 03: Python — Server Wallet + Transfers
Demonstrates server-side wallet management and token transfers using Chipi SDK
"""

import os
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from chipi_sdk import (
    ChipiSDK,
    ChipiSDKConfig,
    CreateWalletParams,
    GetWalletParams,
    TransferParams,
    GetTokenBalanceParams,
    WalletType,
    ChainToken,
    Chain,
    WalletData,
    ChipiApiError,
    ChipiTransactionError,
)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Chipi Wallet API",
    description="Server-side wallet management and token transfers",
    version="1.0.0",
)

# Initialize Chipi SDK
sdk = ChipiSDK(
    config=ChipiSDKConfig(
        api_public_key=os.getenv("CHIPI_PUBLIC_KEY"),
        api_secret_key=os.getenv("CHIPI_SECRET_KEY"),
    )
)


# Request/Response Models
class CreateWalletRequest(BaseModel):
    user_id: str = Field(..., description="Your application's unique user ID")
    pin: str = Field(..., description="User's secure PIN for wallet encryption")


class TransferRequest(BaseModel):
    sender_user_id: str = Field(..., description="Sender's user ID")
    recipient_address: str = Field(..., description="Recipient wallet address (0x...)")
    amount: str = Field(..., description="Amount to transfer")
    pin: str = Field(..., description="Sender's PIN")
    token: str = Field(default="USDC", description="Token type (USDC, ETH, STRK, etc.)")


class WalletResponse(BaseModel):
    public_key: str
    wallet_type: str
    is_deployed: bool
    created_at: str


class BalanceResponse(BaseModel):
    token: str
    balance: str
    decimals: int
    contract_address: str


class TransferResponse(BaseModel):
    success: bool
    tx_hash: str
    amount: str
    token: str
    recipient: str
    starkscan_url: str


# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Chipi Wallet API",
        "status": "running",
        "docs": "/docs",
    }


@app.post("/wallets/create", response_model=WalletResponse)
async def create_wallet(request: CreateWalletRequest):
    """
    Create a new wallet for a user.
    
    This method:
    - Creates a new wallet on Starknet
    - Uses gasless deployment (sponsored by Chipi)
    - Returns the wallet address and encrypted private key
    """
    try:
        wallet_response = sdk.create_wallet(
            params=CreateWalletParams(
                encrypt_key=request.pin,
                external_user_id=request.user_id,
                wallet_type=WalletType.CHIPI,
            )
        )

        print(f"✅ Wallet created for user: {request.user_id}")
        print(f"   Address: {wallet_response.public_key}")
        print(f"   Starkscan: https://starkscan.co/contract/{wallet_response.public_key}")

        return WalletResponse(
            public_key=wallet_response.public_key,
            wallet_type=wallet_response.wallet_type,
            is_deployed=wallet_response.is_deployed,
            created_at=wallet_response.created_at,
        )

    except ChipiApiError as e:
        print(f"❌ API error: {e.message}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/wallets/{user_id}", response_model=WalletResponse)
async def get_wallet(user_id: str):
    """
    Retrieve wallet information for a user.
    
    Returns wallet details including address, type, and deployment status.
    """
    try:
        wallet_response = sdk.get_wallet(
            params=GetWalletParams(external_user_id=user_id)
        )

        if wallet_response is None:
            raise HTTPException(
                status_code=404,
                detail=f"Wallet not found for user: {user_id}"
            )

        print(f"✅ Wallet found for user: {user_id}")
        print(f"   Address: {wallet_response.public_key}")

        return WalletResponse(
            public_key=wallet_response.public_key,
            wallet_type=wallet_response.wallet_type,
            is_deployed=wallet_response.is_deployed,
            created_at=wallet_response.created_at,
        )

    except HTTPException:
        raise
    except ChipiApiError as e:
        print(f"❌ API error: {e.message}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/wallets/{user_id}/balance", response_model=BalanceResponse)
async def get_token_balance(user_id: str, token: str = "USDC"):
    """
    Get token balance for a user's wallet.
    
    Supported tokens: USDC, USDC_E, ETH, STRK, USDT, DAI, WBTC
    """
    try:
        # Map token string to ChainToken enum
        token_map = {
            "USDC": ChainToken.USDC,
            "USDC_E": ChainToken.USDC_E,
            "ETH": ChainToken.ETH,
            "STRK": ChainToken.STRK,
            "USDT": ChainToken.USDT,
            "DAI": ChainToken.DAI,
            "WBTC": ChainToken.WBTC,
        }

        chain_token = token_map.get(token.upper())
        if not chain_token:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported token: {token}. Supported: {list(token_map.keys())}"
            )

        balance_response = sdk.get_token_balance(
            params=GetTokenBalanceParams(
                chain_token=chain_token,
                chain=Chain.STARKNET,
                external_user_id=user_id,
            )
        )

        print(f"✅ Balance for user {user_id}:")
        print(f"   Token: {balance_response.chain_token}")
        print(f"   Balance: {balance_response.balance}")

        return BalanceResponse(
            token=balance_response.chain_token,
            balance=balance_response.balance,
            decimals=balance_response.decimals,
            contract_address=balance_response.chain_token_address,
        )

    except HTTPException:
        raise
    except ChipiApiError as e:
        print(f"❌ API error: {e.message}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transfer", response_model=TransferResponse)
async def transfer_tokens(request: TransferRequest):
    """
    Transfer tokens from one wallet to another.
    
    This method:
    - Uses gasless transactions (sponsored by Chipi)
    - Supports multiple tokens (USDC, ETH, STRK, etc.)
    - Returns transaction hash for tracking
    """
    try:
        # Validate recipient address
        if not request.recipient_address.startswith("0x") or len(request.recipient_address) != 66:
            raise HTTPException(
                status_code=400,
                detail="Invalid recipient address format. Must be 0x followed by 64 hex characters."
            )

        # Get sender's wallet
        wallet_response = sdk.get_wallet(
            params=GetWalletParams(external_user_id=request.sender_user_id)
        )

        if wallet_response is None:
            raise HTTPException(
                status_code=404,
                detail=f"Wallet not found for user: {request.sender_user_id}"
            )

        # Map token string to ChainToken enum
        token_map = {
            "USDC": ChainToken.USDC,
            "USDC_E": ChainToken.USDC_E,
            "ETH": ChainToken.ETH,
            "STRK": ChainToken.STRK,
            "USDT": ChainToken.USDT,
            "DAI": ChainToken.DAI,
            "WBTC": ChainToken.WBTC,
        }

        chain_token = token_map.get(request.token.upper())
        if not chain_token:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported token: {request.token}. Supported: {list(token_map.keys())}"
            )

        # Execute transfer
        print(f"Initiating transfer of {request.amount} {request.token}...")
        print(f"  From: {wallet_response.public_key}")
        print(f"  To: {request.recipient_address}")

        tx_hash = sdk.transfer(
            params=TransferParams(
                encrypt_key=request.pin,
                wallet=WalletData(
                    public_key=wallet_response.public_key,
                    encrypted_private_key=wallet_response.encrypted_private_key,
                ),
                token=chain_token,
                recipient=request.recipient_address,
                amount=request.amount,
            )
        )

        starkscan_url = f"https://starkscan.co/tx/{tx_hash}"

        print(f"✅ Transfer successful!")
        print(f"   TX Hash: {tx_hash}")
        print(f"   Starkscan: {starkscan_url}")

        return TransferResponse(
            success=True,
            tx_hash=tx_hash,
            amount=request.amount,
            token=request.token,
            recipient=request.recipient_address,
            starkscan_url=starkscan_url,
        )

    except HTTPException:
        raise
    except ChipiTransactionError as e:
        print(f"❌ Transaction error: {e.message}")
        raise HTTPException(status_code=400, detail=f"Transaction failed: {e.message}")
    except ChipiApiError as e:
        print(f"❌ API error: {e.message}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/transactions/{hash_or_id}")
async def get_transaction(hash_or_id: str):
    """
    Get transaction details by hash or internal ID.
    
    Returns transaction information including status, amount, and addresses.
    """
    try:
        transaction = sdk.get_transaction(hash_or_id=hash_or_id)

        print(f"✅ Transaction found: {hash_or_id}")
        print(f"   Status: {transaction.status}")

        return {
            "id": transaction.id,
            "transaction_hash": transaction.transaction_hash,
            "status": transaction.status,
            "sender_address": transaction.sender_address,
            "destination_address": transaction.destination_address,
            "amount": transaction.amount,
            "token": transaction.token,
            "created_at": transaction.created_at,
            "updated_at": transaction.updated_at,
        }

    except ChipiApiError as e:
        print(f"❌ API error: {e.message}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/transactions/{tx_hash}/status")
async def get_transaction_status(tx_hash: str):
    """
    Get on-chain transaction status from Starknet.
    
    Returns the current status of the transaction:
    - RECEIVED: Transaction received by sequencer
    - PENDING: Transaction pending in mempool
    - ACCEPTED_ON_L2: Accepted on L2
    - ACCEPTED_ON_L1: Finalized on L1
    - REJECTED: Transaction rejected
    - REVERTED: Transaction reverted
    """
    try:
        status_response = sdk.get_transaction_status(hash=tx_hash)

        print(f"✅ Transaction status: {status_response.status}")

        result = {
            "transaction_hash": status_response.transaction_hash,
            "status": status_response.status,
            "block_number": status_response.block_number,
        }

        if status_response.revert_reason:
            result["revert_reason"] = status_response.revert_reason
            print(f"   ⚠️  Reverted: {status_response.revert_reason}")

        return result

    except ChipiApiError as e:
        print(f"❌ API error: {e.message}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    
    print("=" * 60)
    print("🚀 Chipi Wallet API Server")
    print("=" * 60)
    print(f"Server: http://{host}:{port}")
    print(f"Docs: http://{host}:{port}/docs")
    print("=" * 60)
    
    uvicorn.run(app, host=host, port=port)