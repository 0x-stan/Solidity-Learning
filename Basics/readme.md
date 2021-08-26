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
- `balances` 是mapping类型，getter函数需要传入一个索引值
- `mint` 只能被合约所有者调用，且没有做数值溢出检查
- `Send` 事件可以用来回溯交易记录

### Blockchain Basics

### The Ethereum Virtual Machine

## Installing the Solidity Compiler

## Solidity By Example
