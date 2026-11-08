// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DogeProfession} from "../src/DogeProfession.sol";

contract DogeProfessionTest is Test {
    DogeProfession prof;
    uint256 constant FEE = 0.05 ether;
    // literals, not prof.WARRIOR() calls: an extra external call would consume vm.prank/vm.expectRevert
    uint8 constant WARRIOR = 1;
    uint8 constant ARCHER = 2;
    uint8 constant HEALER = 3;
    address treasury = address(0xBEEF);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        prof = new DogeProfession(FEE, treasury);
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    function test_ConstantsMatch() public view {
        assertEq(prof.WARRIOR(), WARRIOR);
        assertEq(prof.ARCHER(), ARCHER);
        assertEq(prof.HEALER(), HEALER);
        assertEq(prof.fee(), FEE);
        assertEq(prof.treasury(), treasury);
    }

    function test_ChooseSetsProfessionAndCounts() public {
        vm.prank(alice);
        prof.choose{value: FEE}(ARCHER);
        assertEq(prof.professionOf(alice), ARCHER);
        assertTrue(prof.hasProfession(alice));
        (uint256 w, uint256 a, uint256 h) = prof.roster();
        assertEq(w, 0);
        assertEq(a, 1);
        assertEq(h, 0);
        assertEq(prof.totalChosen(), 1);
        assertEq(prof.proceeds(), FEE);
    }

    function test_OnePerWallet() public {
        vm.prank(alice);
        prof.choose{value: FEE}(WARRIOR);
        vm.prank(alice);
        vm.expectRevert(DogeProfession.AlreadyChosen.selector);
        prof.choose{value: FEE}(HEALER);
        assertEq(prof.professionOf(alice), WARRIOR);
    }

    function test_WrongFeeReverts() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(DogeProfession.WrongFee.selector, FEE + 1, FEE));
        prof.choose{value: FEE + 1}(WARRIOR);
    }

    function test_BadProfessionReverts() public {
        vm.prank(alice);
        vm.expectRevert(DogeProfession.BadProfession.selector);
        prof.choose{value: FEE}(0);
        vm.prank(alice);
        vm.expectRevert(DogeProfession.BadProfession.selector);
        prof.choose{value: FEE}(4);
    }

    function test_MultipleWalletsSameClass() public {
        vm.prank(alice);
        prof.choose{value: FEE}(HEALER);
        vm.prank(bob);
        prof.choose{value: FEE}(HEALER);
        (,, uint256 h) = prof.roster();
        assertEq(h, 2);
        assertEq(prof.totalChosen(), 2);
    }

    function test_TreasuryWithdrawPullPayment() public {
        vm.prank(alice);
        prof.choose{value: FEE}(WARRIOR);
        vm.prank(bob);
        prof.choose{value: FEE}(ARCHER);
        uint256 before = treasury.balance;
        vm.prank(treasury);
        prof.withdraw();
        assertEq(treasury.balance, before + 2 * FEE);
        assertEq(prof.proceeds(), 0);
    }

    function test_OnlyTreasuryWithdraws() public {
        vm.prank(alice);
        prof.choose{value: FEE}(WARRIOR);
        vm.prank(alice);
        vm.expectRevert(DogeProfession.NotTreasury.selector);
        prof.withdraw();
    }

    function testFuzz_AnyValidClassSticks(uint8 cls) public {
        cls = uint8(bound(cls, 1, 3));
        vm.prank(alice);
        prof.choose{value: FEE}(cls);
        assertEq(prof.professionOf(alice), cls);
    }
}
