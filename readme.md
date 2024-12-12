## 简介

本项目实现了一个简单的 HTTP 代理服务，用于与 MQTT 服务器进行交互。该服务支持通过 HTTP 接口订阅 MQTT 主题和发布消息。

## 安装

1. 克隆仓库

```bash
git clone https://github.com/Fano-O/mqtt-proxy-server.git
cd mqtt-proxy-server
```

2. 安装依赖

```bash
npm install
```

## 配置

- 端口号：默认端口号为 3000，可以在 index.js 文件中修改 PORT 变量来更改端口号。
- 最大并发连接数：默认最大并发连接数为 10，可以在 index.js 文件中修改 maxConcurrentConnections 变量来更改最大并发连接数。

## API

### 发布消息

#### 请求

- URL: /publish
- Method: GET
- Query Parameters:
  - url: MQTT 服务器地址（例如：mqtt://xx.com:1883）
  - topic: 要发布的主题
  - message: 要发送的消息内容
  - username (可选): MQTT 服务器的用户名
  - password (可选): MQTT 服务器的密码

#### 响应

- 成功:
  - Status Code: 200
  - Body:

```json
{
  "status": "success",
  "topic": "<topic>",
  "message": "<message>",
  "timestamp": <timestamp>
}
```

- 失败:
  - Status Code: 500

### 订阅消息

#### 请求

- URL: /subscribe
- Method: GET
- Query Parameters:
  - url: MQTT 服务器地址（例如：mqtt://xx.com:1883）
  - topic: 要发布的主题
  - username (可选): MQTT 服务器的用户名
  - password (可选): MQTT 服务器的密码

#### 响应

- 成功:
  - Status Code: 200
  - Body:

```json
{
  "topic": "<topic>",
  "message": "<message>",
  "timestamp": <timestamp>
}
```

- 失败:
  - Status Code: 500

## 示例

### 发布消息

```bash
curl "http://localhost:3000/publish?url=mqtt://xx.com:1883&topic=test/topic&message=Hello%20World"
```

### 响应

```json
{
  "status": "success",
  "topic": "test/topic",
  "message": "Hello World",
  "timestamp": 1634792400000
}
```

### 订阅消息

```bash
curl "http://localhost:3000/subscribe?url=mqtt://xx.com:1883&topic=test/topic"
```

### 响应

```json
{
  "topic": "test/topic",
  "message": "Hello World",
  "timestamp": 1634792400000
}
```

## 运行

1. 启动服务

```bash
node index.js
```

2. 访问 API

> 服务启动后，可以通过浏览器或工具（如 Postman）访问 API。

## 注意事项

- 本项目中的 /subscribe 路由现在支持 Server-Sent Events (SSE)，可以持续接收 MQTT 消息。
- 每次发布消息后，客户端会自动断开连接，并从客户端实例映射中删除。
- 达到最大并发连接数时，新的连接请求将被拒绝。

## 贡献

欢迎贡献代码和提出改进建议！请遵循以下步骤：

1. Fork 仓库
2. 创建一个新的分支：git checkout -b feature/your-feature
3. 提交你的更改：git commit -am 'Add some feature'
4. 推送到你的分支：git push origin feature/your-feature
5. 提交 Pull Request

## 许可

本项目采用 Apache-2.0 许可证，详情见 LICENSE 文件。
