#!/usr/bin/env bash
# DOGEON — LIVE end-to-end DeFi loop on DogeOS Chikyū (D-039)
#
#   DEPLOY_KEY=0x... bash scripts/e2e-chikyu.sh
#
# Proves, against the REAL deployed contracts (not mocks), the whole loop the game exposes:
#   stake DOGE -> mint item NFTs -> approve -> create LP pool -> swap DOGE->item -> swap item->DOGE
#   -> protocol fee accrues (0.2% treasury / 0.8% stakers) -> flush to staking -> staker reward -> claim
#   -> withdraw proceeds -> remove LP -> unstake
# Spends a little testnet DOGE (mint fees go to the treasury). The key is read from the environment and is
# NEVER printed or written anywhere. Testnet throwaway keys only.
set -uo pipefail
: "${DEPLOY_KEY:?set DEPLOY_KEY (testnet throwaway key) in the environment}"

R="${RPC:-https://rpc.testnet.dogeos.com}"
CAST="${CAST:-$(command -v cast || echo "$HOME/.foundry/bin/cast")}"
ITEMS=0xbF858f66251005D1d20c92B9359A7dbD0E6Dd6C4
DEX=0x6E26235E3b359f9b78e5c420e8AfdF4140EE7590
STAKE=0x4a1BF177c842bD55d933f49ee8297Ec6D190e12d
KEY_FISH=769          # (type 3 RAW FISH << 8) | level 1
PAUSE="${PAUSE:-2}"  # the public RPC rate-limits bursts ("Too many connections")

pass=0; fail=0
ok()  { printf '  \033[32mPASS\033[0m %s\n' "$1"; pass=$((pass+1)); }
bad() { printf '  \033[31mFAIL\033[0m %s\n' "$1"; fail=$((fail+1)); }
call(){ sleep "$PAUSE"; "$CAST" call "$@" --rpc-url "$R" 2>&1 | awk '{print $1}'; }
send(){ sleep "$PAUSE"; "$CAST" send "$@" --private-key "$DEPLOY_KEY" --rpc-url "$R" --json 2>&1 | grep -o '"status":"0x[01]"' | head -1; }
num(){ printf '%s' "$1" | tr -dc '0-9'; }

ME=$("$CAST" wallet address --private-key "$DEPLOY_KEY")
echo "== DOGEON live E2E on chain $("$CAST" chain-id --rpc-url "$R") as ${ME:0:6}..${ME: -4} =="

# 1. stake first, so this wallet is a staker when fees arrive
[[ "$(send "$STAKE" 'stake()' --value 0.01ether)" == *0x1* ]] && ok "stake 0.01 DOGE" || bad "stake"
S=$(num "$(call "$STAKE" 'staked(address)(uint256)' "$ME")")
awk "BEGIN{exit !(${S:-0}+0 >= 10000000000000000)}" && ok "staked() reflects deposit ($S wei)" || bad "staked()" # awk: bash int overflows past 2^63 when the shared vault holds a lot

# 2. mint three RAW FISH item NFTs (exact 0.1 DOGE fee each)
FEE=$(num "$(call "$ITEMS" 'mintFee()(uint256)')")
n0=$(num "$(call "$ITEMS" 'balanceOf(address)(uint256)' "$ME")")
for i in 1 2 3; do [[ "$(send "$ITEMS" 'mint(address,uint8,uint8)' "$ME" 3 1 --value "$FEE")" == *0x1* ]] || bad "mint #$i"; done
n1=$(num "$(call "$ITEMS" 'balanceOf(address)(uint256)' "$ME")")
[[ $((n1-n0)) -eq 3 ]] && ok "minted 3 RAW FISH NFTs (fee $FEE wei each)" || bad "mint count $n0 -> $n1"
# 2b. mint one DOGE SWORD (type 7) — proves the new gear types mint on the redeployed contract (D-058/D-060)
[[ "$(send "$ITEMS" 'mint(address,uint8,uint8)' "$ME" 7 1 --value "$FEE")" == *0x1* ]] && ok "minted a DOGE SWORD NFT (gear type 7)" || bad "DOGE SWORD mint"
ID1=$(num "$(call "$ITEMS" 'tokenOfOwnerByIndex(address,uint256)(uint256)' "$ME" $((n1-3)))")
ID2=$(num "$(call "$ITEMS" 'tokenOfOwnerByIndex(address,uint256)(uint256)' "$ME" $((n1-2)))")
ID3=$(num "$(call "$ITEMS" 'tokenOfOwnerByIndex(address,uint256)(uint256)' "$ME" $((n1-1)))")
echo "     token ids: $ID1 $ID2 $ID3"

# 3. approve the DEX, create the pool with 2 items + 0.02 DOGE
[[ "$(send "$ITEMS" 'setApprovalForAll(address,bool)' "$DEX" true)" == *0x1* ]] && ok "setApprovalForAll(dex)" || bad "approve"
[[ "$(send "$DEX" 'addLiquidity(uint256[],uint256)' "[$ID1,$ID2]" 0 --value 0.02ether)" == *0x1* ]] && ok "create pool: 2 RAW FISH + 0.02 DOGE" || bad "addLiquidity"
call "$DEX" 'allPools()(uint256[])' | grep -q "$KEY_FISH" && ok "pool key $KEY_FISH listed by allPools()" || bad "allPools"

# 4. swap DOGE -> item at the quoted price (quote includes the 1% protocol fee)
BQ=$(num "$(call "$DEX" 'buyQuote(uint256)(uint256)' $KEY_FISH)")
[[ "$(send "$DEX" 'buyFromPool(uint256)' $KEY_FISH --value "$BQ")" == *0x1* ]] && ok "swap DOGE->item for $BQ wei" || bad "buyFromPool"

# 5. swap item -> DOGE with the quote as slippage guard
SQ=$(num "$(call "$DEX" 'sellQuote(uint256)(uint256)' $KEY_FISH)")
[[ "$(send "$DEX" 'sellToPool(uint256,uint256)' "$ID3" "$SQ")" == *0x1* ]] && ok "swap item->DOGE, net $SQ wei" || bad "sellToPool"

# 6. protocol fee: stakers' 0.8% accrued on the DEX, then flushed into staking
SF=$(num "$(call "$DEX" 'stakerFees()(uint256)')")
[[ "$SF" -gt 0 ]] && ok "stakerFees accrued: $SF wei (0.8% share)" || bad "stakerFees == 0"
[[ "$(send "$DEX" 'flushStakerFees()')" == *0x1* ]] && ok "flushStakerFees() -> staking vault" || bad "flush"
[[ "$(num "$(call "$DEX" 'stakerFees()(uint256)')")" -eq 0 ]] && ok "DEX stakerFees reset to 0" || bad "stakerFees not reset"

# 7. staker reward + claim
PR=$(num "$(call "$STAKE" 'pendingRewards(address)(uint256)' "$ME")")
[[ "$PR" -gt 0 ]] && ok "pendingRewards: $PR wei" || bad "no staker reward (other stakers may dilute it)"
[[ "$PR" -gt 0 ]] && { [[ "$(send "$STAKE" 'claim()')" == *0x1* ]] && ok "claim() staking reward" || bad "claim"; }

# 8. withdraw DEX proceeds (sell payout + 0.2% project share, since this wallet is the treasury)
PD=$(num "$(call "$DEX" 'proceeds(address)(uint256)' "$ME")")
[[ "$PD" -gt 0 ]] && { [[ "$(send "$DEX" 'withdraw()')" == *0x1* ]] && ok "withdraw() $PD wei proceeds" || bad "withdraw"; } || bad "no proceeds"

# 9. clean up: remove our LP (slippage guards 0 here: we are the only LP) and unstake
SH=$(call "$DEX" 'lpShares(uint256,address)(uint256)' $KEY_FISH "$ME" | tr -dc '0-9')
[[ -n "$SH" && "$SH" != 0 ]] && { [[ "$(send "$DEX" 'removeLiquidity(uint256,uint256,uint256,uint256)' $KEY_FISH "$SH" 0 0)" == *0x1* ]] && ok "removeLiquidity (all $SH shares)" || bad "removeLiquidity"; }
[[ "$(send "$DEX" 'withdraw()')" == *0x1* ]] && ok "withdraw LP DOGE" || true
[[ "$(send "$STAKE" 'unstake(uint256)' 10000000000000000)" == *0x1* ]] && ok "unstake 0.01 DOGE" || bad "unstake"

echo
echo "== $pass passed, $fail failed =="
exit "$fail"
