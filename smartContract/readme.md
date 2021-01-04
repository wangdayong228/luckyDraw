# 流程
## 1. 设置白名单，设置抽奖顺序
该操作在部署完成后调用，不需要前端操作
## 2. 用户注册
### 2.1 注册
- 函数：register
- 参数：
- - code 验证码
- - wishes 心愿
- - bleesing 祝福语
```
function register(
    string memory code,
    string memory wishes,
    string memory blessing
)
```
注册完成后有事件产生
```
event Registered(bytes32 codeHash, Player player);
```
### 2.2 查看注册人数
变量`registeredCount`表示注册人数,每有一个用户注册该值加1
### 2.3 查看是否注册
- 1. 获取用户：players[codeHash]
- 2. 查看是否注册：根据player的account字段是否为address(0)判断是否注册。
```
mapping(bytes32 => Player) public players;
struct Player {
    address payable account;
    string wishes;
    string blessing;
    bool hasWinned;
    bool isWhiteList;
}
```
## 3. 抽奖
### 3.1 查看下一轮抽奖情况
- 1. 变量`nextDrawStep`表示下一个drawPlans索引
- 2. 查看下一轮drawPlan: `drawPlans[nextDrawStep]`
### 3.2 抽奖
- 函数：draw
```
function draw()
```
抽奖完成后会有事件产生
```
event DrawedOneRound(DrawInfo drawInfo);
```
同时也会存储结果到drawPlans
```
DrawInfo[] public drawPlans;
```

## 4. [ABI](./abi/luckyDraw_abi.json)