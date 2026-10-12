// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title SyntectPress
/// @notice Deploy this before the Pons launch. Point the launch's creator-fee
///         recipient at this contract. After Pons returns a token address, the
///         owner calls setSyntect once. That is the switch.
///
///         Pons credits fees to this contract inside its escrow. pull() takes
///         the ETH. A share frozen at activation stays in the gift pot. The
///         rest is the desk reserve. pullToken() takes the pair token after
///         the bond and holds it for the owner.
///
///         claimGift() pays giftWei of ETH to a wallet that holds the token,
///         once per 15 minutes, and only while the pot can cover it. It is not
///         interest. The owner sets the size. The owner cannot withdraw the pot
///         except by holding the token and claiming like anyone else.
contract SyntectPress {
    address public constant ESCROW = 0xd3AFEB2a57f70eF218Aa82451c51B2fb0416Ac9e;

    address public owner;
    address public syntect;
    address public pairToken;

    uint256 public minHold;
    uint256 public giftWei;
    uint16 public giftBps;
    uint256 public window;

    uint256 public pot;
    uint256 public desk;
    mapping(address => uint256) public lastClaim;

    uint256 private locked;

    error NotOwner();
    error AlreadySet();
    error NotLive();
    error TooSoon();
    error NotHolder();
    error Empty();
    error BadBps();
    error Busy();
    error SendFailed();

    event SyntectSet(address indexed token);
    event PairSet(address indexed pair);
    event TermsSet(uint256 giftWei, uint256 minHold, uint16 giftBps, uint256 window);
    event Pulled(uint256 amount, uint256 toPot, uint256 toDesk);
    event TokenPulled(uint256 amount);
    event GiftClaimed(address indexed holder, uint256 amount);
    event DeskWithdrawn(address indexed to, uint256 amount);
    event TokenWithdrawn(address indexed to, uint256 amount);
    event OwnerSet(address indexed owner);

    constructor(address owner_) {
        if (owner_ == address(0)) revert NotOwner();
        owner = owner_;
        giftBps = 2500;
        window = 15 minutes;
        minHold = 1;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier nonReentrant() {
        if (locked != 0) revert Busy();
        locked = 1;
        _;
        locked = 0;
    }

    /// @notice The launch switch. Pass the token address Pons created. Once.
    function setSyntect(address token) external onlyOwner {
        if (token == address(0)) revert Empty();
        if (syntect != address(0)) revert AlreadySet();
        syntect = token;
        emit SyntectSet(token);
    }

    /// @notice The pair token, if fees after the bond arrive as that asset. Once.
    function setPair(address pair) external onlyOwner {
        if (pair == address(0)) revert Empty();
        if (pairToken != address(0)) revert AlreadySet();
        pairToken = pair;
        emit PairSet(pair);
    }

    /// @notice Gift size, minimum balance, and the window. giftBps freezes once setSyntect has been called.
    function setTerms(uint256 giftWei_, uint256 minHold_, uint16 bps, uint256 window_) external onlyOwner {
        if (bps > 10_000) revert BadBps();
        if (window_ == 0) revert Empty();
        if (syntect != address(0) && bps != giftBps) revert AlreadySet();
        giftWei = giftWei_;
        minHold = minHold_;
        giftBps = bps;
        window = window_;
        emit TermsSet(giftWei_, minHold_, bps, window_);
    }

    function transferOwner(address next) external onlyOwner {
        if (next == address(0)) revert Empty();
        owner = next;
        emit OwnerSet(next);
    }

    function pendingEth() external view returns (uint256) {
        return IEscrow(ESCROW).balanceOf(address(this));
    }

    function pendingToken() external view returns (uint256) {
        if (pairToken == address(0)) return 0;
        return IEscrow(ESCROW).balanceOfToken(address(this), pairToken);
    }

    function pull() external nonReentrant returns (uint256 amount) {
        amount = IEscrow(ESCROW).balanceOf(address(this));
        if (amount == 0) revert Empty();
        amount = IEscrow(ESCROW).claim();
        uint256 toPot = (amount * giftBps) / 10_000;
        pot += toPot;
        desk += amount - toPot;
        emit Pulled(amount, toPot, amount - toPot);
    }

    function pullToken() external nonReentrant returns (uint256 amount) {
        if (pairToken == address(0)) revert NotLive();
        amount = IEscrow(ESCROW).balanceOfToken(address(this), pairToken);
        if (amount == 0) revert Empty();
        amount = IEscrow(ESCROW).claimToken(pairToken);
        emit TokenPulled(amount);
    }

    function claimGift() external nonReentrant {
        if (syntect == address(0) || giftWei == 0) revert NotLive();
        if (IERC20(syntect).balanceOf(msg.sender) < minHold) revert NotHolder();
        if (block.timestamp < lastClaim[msg.sender] + window) revert TooSoon();
        if (pot < giftWei) revert Empty();
        lastClaim[msg.sender] = block.timestamp;
        pot -= giftWei;
        (bool ok,) = msg.sender.call{value: giftWei}("");
        if (!ok) revert SendFailed();
        emit GiftClaimed(msg.sender, giftWei);
    }

    function withdrawDesk(address payable to) external onlyOwner nonReentrant {
        if (to == address(0)) revert Empty();
        uint256 amount = desk;
        if (amount == 0) revert Empty();
        desk = 0;
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert SendFailed();
        emit DeskWithdrawn(to, amount);
    }

    function withdrawToken(address to) external onlyOwner nonReentrant {
        if (to == address(0) || pairToken == address(0)) revert Empty();
        uint256 amount = IERC20(pairToken).balanceOf(address(this));
        if (amount == 0) revert Empty();
        if (!IERC20(pairToken).transfer(to, amount)) revert SendFailed();
        emit TokenWithdrawn(to, amount);
    }

    /// @notice ETH sent here directly is not part of the pot or the desk reserve.
    function floatEth() external view returns (uint256) {
        return address(this).balance - pot - desk;
    }

    receive() external payable {}
}

interface IEscrow {
    function balanceOf(address recipient) external view returns (uint256);
    function claim() external returns (uint256);
    function balanceOfToken(address recipient, address token) external view returns (uint256);
    function claimToken(address token) external returns (uint256);
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}
