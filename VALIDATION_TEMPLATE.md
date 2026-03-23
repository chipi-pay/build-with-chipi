# Validation Report — Tutorial XX: [Title]

**Tester:** [Your name]
**Date:** [YYYY-MM-DD]
**Framework:** [Next.js / React / Expo / Python]
**Auth Provider:** [Clerk / Firebase / Supabase / Better Auth / Custom]
**SDK Version:** [@chipi-stack/nextjs@X.X.X or chipi-python@X.X.X]
**Tutorial Issue:** [link to GitHub issue]

---

## Docs Pages Validation

For each docs page followed, mark PASS or FAIL. If FAIL, link the bug issue.

| # | Docs Page | Status | Bug Issue | Notes |
|---|-----------|--------|-----------|-------|
| 1 | [page title](URL) | PASS / FAIL | #link | |
| 2 | [page title](URL) | PASS / FAIL | #link | |
| 3 | [page title](URL) | PASS / FAIL | #link | |

### Per-page details

#### Page 1: [Title]
- [ ] Install commands worked
- [ ] Code examples compiled without changes
- [ ] Feature worked when tested in browser/terminal
- [ ] Instructions were clear (no missing steps)
- Notes: 

#### Page 2: [Title]
- [ ] Install commands worked
- [ ] Code examples compiled without changes
- [ ] Feature worked when tested in browser/terminal
- [ ] Instructions were clear (no missing steps)
- Notes: 

---

## Features Validation

| Feature | Status | Notes |
|---------|--------|-------|
| Wallet creation with passkey | PASS / FAIL | |
| View USDC balance | PASS / FAIL | |
| Send USDC gaslessly | PASS / FAIL | |
| Transaction history | PASS / FAIL | |
| [add more per task] | PASS / FAIL | |

---

## Hooks / Methods Exercised

| Hook/Method | Used in file | Works? |
|-------------|-------------|--------|
| useCreateWallet | src/components/wallet-create.tsx | YES / NO |
| useGetWallet | src/components/wallet-dashboard.tsx | YES / NO |
| useGetTokenBalance | src/components/wallet-balance.tsx | YES / NO |
| [add more per task] | | |

---

## Bugs Found

| Bug | Repo | Issue | Status |
|-----|------|-------|--------|
| [description] | chipi-pay/sdks | #link | Open |
| [description] | chipi-pay/chipi-back | #link | Open |

---

## Build Verification

```bash
# From clean clone:
git clone [repo-url]
cd tutorials/XX-slug
npm install   # or pip install -r requirements.txt
npm run build # or python main.py
npm test      # if tests exist
```

- [ ] Clean install works (no manual steps needed)
- [ ] Build passes
- [ ] App runs at localhost

---

## Recording

- [ ] Video recorded (5-8 min)
- [ ] Video link: [URL]
