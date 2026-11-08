// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DogeStaking} from "../src/DogeStaking.sol";

contract DogeStakingTest is Test {
    DogeStaking st;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        st = new DogeStaking();
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(address(this), 100 ether);
    }

    function _reward(uint256 amt) internal {
        (bool ok,) = address(st).call{value: amt}(""); // receive() => _addReward
        require(ok, "reward failed");
    }

    function test_StakeRewardClaimUnstake() public {
        vm.prank(alice);
        st.stake{value: 1 ether}();
        assertEq(st.totalStaked(), 1 ether);
        _reward(1 ether);
        assertEq(st.pendingRewards(alice), 1 ether);
        uint256 b0 = alice.balance;
        vm.prank(alice);
        st.claim();
        assertEq(alice.balance - b0, 1 ether);
        assertEq(st.pendingRewards(alice), 0);
        // principal still staked; unstake returns it
        uint256 b1 = alice.balance;
        vm.prank(alice);
        st.unstake(1 ether);
        assertEq(alice.balance - b1, 1 ether);
        assertEq(st.totalStaked(), 0);
    }

    function test_ProRataSplit() public {
        vm.prank(alice);
        st.stake{value: 1 ether}();
        vm.prank(bob);
        st.stake{value: 3 ether}();
        _reward(4 ether); // 1:3 split -> alice 1, bob 3
        assertEq(st.pendingRewards(alice), 1 ether);
        assertEq(st.pendingRewards(bob), 3 ether);
    }

    function test_RewardWithNoStakersBecomesResidualThenPaid() public {
        _reward(1 ether); // nobody staked yet
        assertEq(st.residual(), 1 ether);
        assertEq(st.pendingRewards(alice), 0);
        vm.prank(alice);
        st.stake{value: 2 ether}(); // folds residual in to current stake
        assertEq(st.residual(), 0);
        assertEq(st.pendingRewards(alice), 1 ether);
    }

    function test_LateStakerDoesNotStealPastRewards() public {
        vm.prank(alice);
        st.stake{value: 1 ether}();
        _reward(1 ether); // all to alice
        vm.prank(bob);
        st.stake{value: 1 ether}(); // bob joins after the reward
        assertEq(st.pendingRewards(alice), 1 ether);
        assertEq(st.pendingRewards(bob), 0);
        _reward(2 ether); // now 1:1
        assertEq(st.pendingRewards(alice), 2 ether);
        assertEq(st.pendingRewards(bob), 1 ether);
    }

    function test_ClaimRevertsWhenNothing() public {
        vm.prank(alice);
        vm.expectRevert(DogeStaking.ZeroAmount.selector);
        st.claim();
    }

    function test_UnstakeTooMuchReverts() public {
        vm.prank(alice);
        st.stake{value: 1 ether}();
        vm.prank(alice);
        vm.expectRevert(DogeStaking.NotEnoughStaked.selector);
        st.unstake(2 ether);
    }

    function testFuzz_PrincipalAlwaysReturnable(uint96 a, uint96 b, uint96 r) public {
        uint256 as_ = bound(a, 1, 10 ether);
        uint256 bs = bound(b, 1, 10 ether);
        uint256 rw = bound(r, 0, 10 ether);
        vm.prank(alice);
        st.stake{value: as_}();
        vm.prank(bob);
        st.stake{value: bs}();
        if (rw > 0) _reward(rw);
        // both can always withdraw their full principal
        vm.prank(alice);
        st.unstake(as_);
        vm.prank(bob);
        st.unstake(bs);
        assertEq(st.totalStaked(), 0);
        assertLe(address(st).balance, rw + 2); // only (unclaimed) rewards remain, give or take rounding dust
    }
}
