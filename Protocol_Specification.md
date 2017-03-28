# DarkHouse前后端交互协议 - v0.0.5

## 服务器发送给客户端协议集 (to_client)

### `pong` - ping pong检测是否在线协议

```json
{
	type: 0 // 协议代号，下同
}
```

客户端发起 `ping` 协议，服务器在接收后第一时间返回 `pong` 协议，客户端可根据客户端发送时间与接收时间差来获得与服务器的延时时间。

### `initialize` - 游戏初始化协议

```json
{
	type: 1,
	currPlayerId: number, // 当前玩家的id号
	players: playerBasicPROT[], // 所有玩家基础协议（章末介绍）
	edge: { // 舞台边界
		point1: point, // 舞台左上角
		point2: point // 舞台右下角
	},
	barricades: { // 所有障碍物
		point1: point, // 障碍物左上角
		point2: point // 障碍物右下角
	}[],
	visableAreas: { // 所有始终可视区域基础协议
		id: number, // 可视区域id号
		position: point, // 可视区域位置
		radius: number // 范围
	}[],
	props: allPropPROTTypes[] // 所有在场道具（章末介绍）
}
```

客户端在与服务器连接，发送初始化协议之后，服务器返回的第一个协议便是该游戏初始化协议，其中包含了游戏所有固定物品与现有物品的数据。

### `mainPROT` - 游戏主协议

```json
{
	type: 2,
	playerPROTs: 	{
		id: number, // 玩家id
		position: point, // 玩家所在位置
		angle: number, // 玩家枪口、行进角度
		hp?: number, // 玩家生命值（如未改，则不传递）
		bullet?: number, // 子弹数（如未改，则不传递）
		maxBullet?: number, // 最大可携带子弹数（如未改，则不传递）

		newEqpts?: allEqptPROTTypes[], // 新装备（章末介绍）
		removedEqptIds?: number[] // 被移除的装备id号
	}[] = [], // 所有玩家主协议
	newPlayerBPROTs?: playerBasicPROT[], // 新加入玩家的基础协议（章末介绍）

	playerIdsInSight?: number[], // 视野中玩家的id号

	visableAreas?: { // 始终可视区域主协议
		id: number, // 区域id
		playerIds: number[] // 区域中玩家id号
	}[],

	attackPROTs?: { // 攻击基础协议，当玩家开始射击时发送给所有玩家
		id: number, // 攻击id号
		attackType: number, // 攻击类型（章末介绍）
		weaponType: number, // 武器类型（章末介绍）
		position: point, // 攻击地点
		angle: number, // 攻击角度
		playerIdsInSight?: number[], // 攻击视野中的玩家id
		attackPlayerId: number, // 发起攻击的玩家id
		bulletPosition: point, // 子弹起始位置
		bulletFlyStep: number, // 子弹飞行间隔（根据服务器刷新率计算）
		sightRadius: number, // 攻击视野范围
		sightTime: number // 攻击视野持续时间
	}[],
	duringAttackPROTs?: { // 攻击中协议，当攻击视野未消失、攻击视野消失与子弹消失时发送给所有玩家。只有当客户端接收到isSightEnd字段与bulletPosition字段时代表该攻击已经完全结束，可以释放资源
		id: number,  // 攻击id号
		playerIdsInSight?: number[], // 攻击视野中的玩家id，如果视野中没有玩家即为空数组时，不传。如果视野消失，不传。

		bulletPosition?: point, // 最终子弹消失位置，意味着子弹不会再继续前进，该攻击结束（但不代表该攻击的视野结束，可能存在子弹已经击中之后攻击视野还未消失）
		attackedPlayerIds?: number[], // 被击中玩家id
		killedPlayerIds?: number[], // 被杀死的玩家id
		isSightEnd?: boolean, // 攻击视野是否已经结束，当视野时间到期，传输此字段为true并仅传输一次，此后不再传输
	}[],
	runningPROTs?: { // 奔跑协议
		playerId: number, // 奔跑玩家id
		playerIdsInSight: number[], // 出现在奔跑视野中的玩家id
	}[],

	newPropPROTs?: allPropPROTTypes[], // 新道具（章末介绍）
	removedPropIds?: number[], // 被移除的道具id号

	rankList: { // 排行榜
		id: number, // 玩家id
		aimTimes: number // 击中次数
	}[]
}
```
服务器根据主循环时间会不停地向客户端发送 `mainPROT` ，客户端根据拿到的游戏主协议进行更新。

### `gameOver` - 游戏结束协议

```json
{
	type: 3,
	records: {
		attackTimes: number, // 攻击次数
		attackInAimTimes: number, // 击中次数
		attackedTimes: number, // 被击中次数
		killTimes: number // 杀死次数
	}
}
```
------

### *interface* `playerBasicPROT` - 玩家基础协议

```json
{
	id: number, // 玩家id
	name: string, // 名称
	position: point, // 所在位置
	angle: number, // 角度
	hp: number, // 生命值
	bullet: number, // 子弹数
	maxBullet: number, // 最大子弹数
	eqpts: allEqptPROTTypes[] // 所有装备
}
```

### *interface* `point` - 坐标

```json
{
	x: number,
	y: number
}
```

### 道具有关协议

#### *interface* `hpPROT` - 生命值道具协议

```json
{
	type: 0,
	hp: number // 增加的生命值
}
```

#### *interface* `weaponPROT` - 武器道具协议

```json
{
	type: 1,
	attackType: number, // 攻击类型（章末介绍）
	weaponType: number, // 武器类型（章末介绍）
}
```

#### *interface* `silencerPROT` - 消音器道具协议

```json
{
	type: 2,
}
```

#### *interface* `visableSightPROT` - 扩大视野道具协议

```json
{
	type: 3,
	radius: number // 视野范围
}
```

#### *type* `allPropPROTTypes`

`hpPROT | weaponPROT | silencerPROT | visableSightPROT`

### 装备有关协议

#### *interface* `visableSightPROT` - 扩大视野装备协议

```json
{
	type: 0,
	radius: number, // 视野范围
	lastTime: number // 装备持续时间
}
```

#### *type* `allEqptPROTTypes`

`visableSightPROT`

### *enum* `attackType`

```json
{
	gun = 0, // 枪械
	melee = 1 // 近战武器
}
```

### *enum* `weaponType`

#### 枪械( `attackType = 0` )

```json
{
	pistol = 0, // 手枪
	rifle = 1, // 步枪
	rocket = 2 // 火箭筒
}
```

#### 近战武器( `attackType = 1` )

```json
{
	fist = 0, // 拳头
}
```

## 客户端发送给服务器协议集 (from_client)

### `ping` - ping pong检测是否在线协议

```json
{
	type: 0
}
```

### `initialize` - 客户端请求初始化游戏

```json
{
	type: 1,
	name: string
}
```

### `startRunning` - 开始、停止奔跑协议

```json
{
	type: 2,
	active: boolean // 是否开始奔跑
}
```

协议中 `active` 参数指示玩家是否开始奔跑， `true` 为开始奔跑， `false` 为停止奔跑。开始与停止奔跑指令发送一次即可。

### `stopMoving` - 停止、开始移动协议

```json
{
	type: 3,
	active: boolean // 是否停止移动
}
```

### `rotate` - 旋转

```json
{
	type: 4,
	angle: number // 玩家旋转到的角度
}
```

### `startShoot` - 开始、停止射击协议

```json
{
	type: 5,
	active: boolean // 是否开始射击
}
```

### `startCombat` - 开始、停止近战攻击协议

```json
{
	type: 6,
	active: boolean // 是否开始近战攻击
}
```

### `useProp` - 使用道具

```json
{
	type: 7
}
```

玩家移动到道具上之后如果准备使用该道具客户端需要发送该指令，服务器会自动使用当前玩家位置上的所有可用道具。如果服务器检测此时没有玩家能够使用的道具则此指令不生效。

## 说明

服务器发送给客户端的所有协议尽可能减少数据字节。所有协议带有 `?` 的表示服务器可能不传输该字段。如：

```json
{
	removedPropIds?: number[]
}
```

所有删除的道具id值。如果该数组为空即当前没有被删除的道具，则服务器不会传递一个空数组，而是直接删除了该字段，以节省不必要的数据浪费。