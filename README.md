# CertChain

CertChain is a decentralized certificate and Credential management system on Ethereum. Institutions mint tamper-proof academic credentials as soulbound NFTs. Students hold them in their wallets. Employers verify them in seconds — no emails, no phone calls, no trust required.

---

## The problem it aims to solve

Fake degrees are widespread and easy to produce. CertChain makes certificates self-verifying — anyone with the token ID can confirm validity directly against the Ethereum blockchain within a few seconds.

---

## How it works

```
Institution uploads PDF → IPFS stores the file permanently → Ethereum stores the proof hash
Student receives NFT in their wallet → shares Token ID with employers
Employer pastes Token ID → blockchain confirms: VALID / REVOKED / EXPIRED
```

Certificates are **soulbound** — the smart contract blocks all transfers. A degree can't be sold, gifted, or stolen. It's permanently linked to the wallet it was issued to.

---

## Live demo

| | |
|---|---|
| **App** | https://certchain.vercel.app |
| **Contract** | https://sepolia.etherscan.io/address/ |
| **Sample verify** | https://certchain.vercel.app/verify/1 |

---

## Pages

| Route | What it does | Auth needed |
|---|---|---|
| `/` | Verify any certificate by Token ID | None — anyone can verify |
| `/verify/[tokenId]` | SSR result page with rich link preview | None |
| `/issue` | Upload PDF to IPFS + mint NFT to student | Authorized issuer wallet |
| `/admin` | View, add, and remove authorized institutions | View: anyone · Edit: contract owner |

---

## Tech stack

**Smart contract**
- Solidity ^0.8.20, ERC-721 (soulbound — transfers blocked)
- OpenZeppelin ERC721URIStorage + Ownable
- Foundry for compile, test, fuzz, deploy, verify

**Frontend**
- Next.js 14 App Router
- Server Components for the verify route (enables SSR + social link previews)
- Client Components for wallet interactions (MetaMask / ethers.js v6)
- Next.js API route for IPFS uploads (keeps Pinata keys server-side)

**Storage & infrastructure**
- IPFS via Pinata for certificate PDFs and metadata JSON
- Sepolia testnet
- Vercel for frontend deployment

---

## Local setup

**Prerequisites:** Node.js 18+, MetaMask browser extension, a deployed `CertificateNFT` contract on Sepolia.

### 1. Install dependencies

```bash
git clone https://github.com/yourusername/cert-dapp
cd cert-dapp/frontend
npm install
```

### 2. Configure contract address

Open `lib/contract.js` and replace the placeholder:

```js
export const CONTRACT_ADDRESS = "";
```

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Then fill in `.env.local`:

```bash
# Pinata — for IPFS uploads on the /issue page
# Get these at: app.pinata.cloud → API Keys → New Key → Admin
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here

# Your production URL — used for OG / social link preview tags
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> These keys are read only by `app/api/upload/route.js`, which runs on the server. They are never exposed to the browser.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying the smart contract

The contract lives in the `contracts/` folder (Foundry project).

```bash
cd contracts

# Install OpenZeppelin
forge install OpenZeppelin/openzeppelin-contracts 

# Compile
forge build

# Run all tests (48 tests + fuzz)
forge test -vv

# Deploy to Sepolia
source .env
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL  --broadcast --verify -vvvv
```

Copy the printed contract address into `lib/contract.js`.

---

## Smart contract: key design decisions

**Soulbound.** `transferFrom`, `safeTransferFrom`, and `approve` are all overridden to `revert("Non-transferable")`. A certificate cannot leave the wallet it was issued to — ever.

**Revocation on-chain.** Revoked certificates don't get burned. The `isRevoked` flag is set to `true` with a permanent reason string. This creates an immutable audit trail — you can prove a cert was revoked, not just that it doesn't exist.

**IPFS for documents.** The certificate PDF lives on IPFS (content-addressed, permanent). The on-chain record stores the IPFS hash. If the file is tampered with, its CID changes and the link breaks — the blockchain reference stays valid as proof of the original.

**Issuer deauthorization.** If an institution is removed from the authorized list, `verifyCertificate()` returns `ISSUER_DEAUTHORIZED` for all certificates they issued — not `VALID`. This lets the platform respond to institutional fraud without being able to alter or delete the underlying NFT.

---

## Environment variables reference

| Variable | Where it's used | Where to get it |
|---|---|---|
| `PINATA_API_KEY` | `app/api/upload/route.js` (server only) | app.pinata.cloud → API Keys |
| `PINATA_SECRET_KEY` | `app/api/upload/route.js` (server only) | app.pinata.cloud → API Keys |
| `NEXT_PUBLIC_SITE_URL` | `lib/contract.js` — OG tag base URL | Your Vercel project URL |
| `SEPOLIA_RPC_URL` | Foundry deploy script only, not frontend | alchemy.com → Create App |
| `PRIVATE_KEY` | Foundry deploy script only, never frontend | MetaMask → Export Private Key |
| `ETHERSCAN_API_KEY` | Foundry `--verify` flag only | etherscan.io/myapikey |

> `PRIVATE_KEY` and `SEPOLIA_RPC_URL` only live in `contracts/.env`. 

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make changes — if touching the contract, add tests in `test/CertificateNFT.t.sol`
4. Run `forge test` and `npm run build` — both must pass
5. Open a pull request

---

## License

MIT
