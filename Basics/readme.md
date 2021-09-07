# Basics

## Introduction to Smart Contracts

### A Simple Smart Contract

#### Storage Example

SimpleStorage 合约是一个拥有简单 `storedData` 变量的简单合约

- 外部不能访问 `storedData` 变量，因为它不是 public
- `storedData` 变量初始值为 0
- set 函数可以改变 `storedData` 变量的值
- 任何人都有权限改变 `storedData` 变量

相关文件

- 合约文件 [SimpleStorage.sol](./contracts/SimpleStorage.sol)
- 测试文件 [SimpleStorage.test.ts](./test/SimpleStorage.test.ts)

#### Subcurrency Example

SubcurrencyExample 合约是一个简单的 token 合约

- `minter` 和 `balances` 变量因为是 public，编译器会自动为其生成 getter 函数
- `balances` 是 mapping 类型，getter 函数需要传入一个索引值
- `mint()` 只能被合约所有者调用，且没有做数值溢出检查
- `send()` 不能发送超过余额的数量，否则会抛错
- `Send` 事件可以用来回溯交易记录

### Blockchain Basics

#### Transaction

> A blockchain is a globally shared, transactional database.

- Everyone can read entries (交易公开透明)
- The change of state is either not done at all or completely applied (交易的原子性)
- transaction is being applied to the database, no other transaction can alter it (交易不可更改)

#### Blocks

> These blocks form a linear sequence in time and that is where the word “blockchain” derives from.

- `double-spend attack`
- it may happen that blocks are reverted from time to time, but only at the “tip” of the chain.
- 交易确认之后，时间越久，越不可更改

### The Ethereum Virtual Machine

> The Ethereum Virtual Machine or EVM is the runtime environment for smart contracts in Ethereum.

#### Overview

- sandbox (不仅仅)是一个沙盒
- no access to network, filesystem or other processes 链内部无法访问外部网络/文件系统/其他程序
- Smart contracts even have limited access to other smart contracts. 智能合约之间也有权限限制

#### Accounts

- External accounts
  - 受公私钥对控制，比如人类持有的
  - 地址由公钥 hash 得出
- contract accounts
  - 由代码和有权限的账户控制
  - 地址由部署者的账户地址和其 nonce 值创建
- EVM 对两种账户一视同仁
- 每个账户都有一个 `mapping(uint256 => uint256)` 的 storage 存储空间
- 每个账户都有 `balance` 字段，以 `Wei` (`1 ether` is `10**18 wei`) 作单位，存储 Ether 的余额数值

#### Transactions

> A transaction is a message that is sent from one account to another account

- Transaction 可以包含二进制数据(`payload`)和 Ether
- 如果目标地址包含代码，会按照 `payload` 作为入参执行代码
- 如果目标账户地址不存在，交易会自动创建一个合约
  - 交易的 `payload` 作为 EVM 的 `bytecode` 执行
  - 交易的输出数据将被永久存储为合约的代码
  - 即创建合约时发送的不是合约代码，而是发送能够产生合约代码的代码
  - 在合约创建的过程中，它的代码还是空的。所以直到构造函数执行结束，都不应该在其中调用合约自己函数。

#### Gas

- 发送 Transaction 的手续费，矿工收益的来源
- `gas price` 发送交易者(sender)设定的 gas 价格
- sender 必须从发送账户中预支付 `gas_price * gas` 数量的 ether，交易执行完成后，会返还多余的 gas
- gas 耗尽会触发 `out-of-gas` 异常，并且回滚交易中所有操作

#### Storage, Memory and the Stack

- storage
  - 每个账户都有一个 `mapping(uint256 => uint256)` 的 storage 存储空间
  - 不可枚举
  - 读写成本很高，需要最小化 storage 的操作
  - 合约不能读写自身以外的 storage
- memory
  - 每次消息调用都会创建一个全新的存储区域
  - 线性的，可寻址的
  - 每次读取固定限制为 256 bits
  - 而写入可以是 8 bits 或 256 bits
  - memory 是以 a word (256 bits) 为单位展开的
  - 当读写操作触及一个从未展开过的 word 时，会展开该 word
  - 展开 word 的开销固定 256 bits (比如写入 8 bit 到未展开的 word，实际开销将是展开 256 bits)
- stack
  - EVM 是基于堆栈的 （非寄存器）
  - 栈最大有 1024 个元素，每个元素长度是一个字（256 位）
  - 只能操作栈顶（栈顶中的前 16 元素），取其中一到两个元素，运算完成后，将结果压入栈顶

#### Instruction Set

- EVM 的指令集应尽量少
- 所有指令针对 word 操作
- 常用的算术、位、逻辑和比较操作
- 有条件和无条件跳转
- 访问当前区块的相关属性，比如 blockNumber 和 timestamp

#### Message Calls

- Message Calls 和 Transacation 非常类似，它们都有一个发送者、目标地址、数据、Ether、gas 和返回数据
- 每个都有 top-level message ，它同时也可以创建更多的 message call
- 合约可以决定 gas 的去留，当发生 `out-of-gas` 错误时（或其他错误），会将错误信息压入栈顶，这时，只有和 message call 一起发过来的 gas 会被耗尽
- 调用合约默认会主动将异常冒泡 `bubble up`
- `Calls` 被限制深度 1024，这意味着对于复杂操作应该优先使用循环而不是递归
- 一个 message call 只能转发 63/64th 的 gas，所以实际的深度比 1024 要小

#### Delegatecall / Callcode and Libraries

- `delegatecall`
  - 是 message call 的变体
  - 目标地址的代码将在发起调用的合约的上下文中执行，`msg.sender` 和 `msg.value` 不变(和调用者相同)
  - 这使得 Solidity 可以实现可复用的代码库 `Libraries`

#### Logs

- 一种特殊的可索引的数据结构，其存储的数据可以一路映射直到区块层级
- Solidity 用其实现 event，合约创建之后无法访问日志，但是这些可以从区块链外高效访问
- 通过 `Bloom filter` 可以高效加密安全的搜索日志
- 轻客户端可以访问日志

#### Creat

- 合约可以被特殊的 opcode 创建，即不是通过交易简单的调用零地址创建
- `create calls` 和普通 message calls 的区别是执行完 `payload` 会将结果存储为代码(合约代码)，创建者会在堆栈上接收新合约的地址

#### Deactivate and Self-destruct

- `selfdestruct` 是销毁合约的唯一方法，该合约地址的 Ether 会被发送到指定目标，然后其存储值和代码将从状态中删除
- 如果有人发送给 Ether 到已删除的合约地址，Ether 就会消失了
- 即使合约被销毁，链上仍然会由历史数据
- 即使合约代码中没有显示的调用 `selfdestruct` 的方法，它仍有可能通过 `delegatecall` 和 `callcode` 执行自毁

## Installing the Solidity Compiler

略

## Solidity By Example

### Voting

简单的实习投票功能的合约，有三种角色

- 主席
  - 合约拥有者为主席
  - 只有主席拥有分配投票权的能力
    - 不能分配给已投票的选民新的投票权
- 候选人
  - 得票最多的候选人将胜出
- 选民
  - 每个选民投票权重 = 1
  - voted 记录投票状态：未投、已投
  - 当为投票时，可以将投票权委托给其他选民
    - 当被委托者也未投票，委托给他的权重将在投票时一起累加
    - 当被委托者已投票时，权重将直接累加

相关文件

- 合约文件 [BallotVoting.sol](./contracts/BallotVoting.sol)
- 测试文件 [BallotVoting.test.ts](./test/BallotVoting.test.ts)

### Subcurrency

实现了一个简单的代币合约

相关文件

- 合约文件 [SubcurrencyExample.sol](./contracts/SubcurrencyExample.sol)
- 测试文件 [SubcurrencyExample.test.ts](./test/SubcurrencyExample.test.ts)

### Simple Open Auction

公开拍卖合约。每个人都可以看到进行的投标，然后将此合同扩展为盲拍卖，在投标期结束之前无法看到实际出价。

- 投标期间，每个人都可以发送投标。投标将包含转账金额和出价人信息绑定
- 如果投标的最高价格提高，则退回之前投标人的钱
- 投标结束后，投标受益人（卖家）必须手动调用合约，才能收到钱