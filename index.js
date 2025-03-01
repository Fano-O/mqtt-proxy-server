const express = require('express');
const mqtt = require('mqtt');
const crypto = require('crypto');
const app = express();
const PORT = 3000; // HTTP代理端口

// 使用Map对象存储每个MQTT连接的客户端实例
const clients = new Map();
const maxConcurrentConnections = 10;
let currentConnections = 0;

// 生成唯一的客户端ID
function generateClientId() {
    return `proxy_${crypto.randomBytes(8).toString('hex').substring(0, 8)}`;
}

// 返回 YY-MM-DD HH:mm:ss 格式的时间
function returnTime() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${h}:${m}:${s}`;
}

// 连接到MQTT服务器并订阅主题
function connectAndSubscribe(clientId, url, topic, username, password) {
    return new Promise((resolve, reject) => {
        // 如果已经存在连接，则先断开
        const existingClient = clients.get(clientId);
        if (existingClient) {
            existingClient.end();
            clients.delete(clientId);
        }
        if (currentConnections >= maxConcurrentConnections) {
            maxConcurrentConnections = 0;
            currentConnections = 0
            // return reject('达到最大并发连接数');
        }

        // 连接逻辑...
        currentConnections++;
        // 创建新的MQTT客户端实例
        const client = mqtt.connect(url, {
            username,
            password,
            clientId
        });

        client.on('connect', () => {
            console.log('MQTT客户端已连接');
            client.subscribe(topic, (err) => {
                if (err) {
                    console.error('订阅主题时出错：', err);
                    reject('订阅主题时出错');
                } else {
                    console.log(`已成功订阅主题： ${topic}`);
                    resolve(client);
                }
            });
        });

        client.on('error', (err) => {
            console.error('MQTT连接错误:', err);
            reject('连接到MQTT服务器时出错');
        });

        // 存储客户端实例
        clients.set(clientId, client);
    });
}

// 订阅主题消息的路由
app.get('/subscribe', (req, res) => {
    const { url, topic, username, password } = req.query;
    const clientId = generateClientId();

    connectAndSubscribe(clientId, url, topic, username, password)
        .then(client => {
            // 设置响应头，使响应保持打开状态
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive'
            });

            // 当接收到消息时，通过HTTP响应返回给前端
            client.on('message', (msgTopic, message) => {
                if (msgTopic.toString() === topic) {
                    const response = {
                        topic: msgTopic.toString(),
                        message: message.toString(),
                        time: returnTime()
                    };
                    res.write(`data: ${JSON.stringify(response)}\n\n`);
                }
            });

            // 处理客户端断开连接的情况
            req.on('close', () => {
                console.log('客户端断开连接');
                client.end();
                clients.delete(clientId);
                currentConnections--;
            });
        })
        .catch(err => {
            res.status(500).send(err);
        });
});

// 发送消息到MQTT主题
app.get('/publish', (req, res) => {
    const { url, topic, message, username, password } = req.query; // 从请求正文中获取参数
    const clientId = generateClientId();

    connectAndSubscribe(clientId, url, topic, username, password)
        .then(client => {
            // 发送消息到MQTT主题
            client.publish(topic, message, { qos: 1 }, (err) => {
                if (err) {
                    console.error('发送消息时出错：', err);
                    res.status(500).send('发送消息时出错');
                } else {
                    let time = returnTime();
                    console.log(`${time}   ${username} 已发送 ${message} 到主题： ${topic}`);
                    const response = {
                        status: 'success',
                        topic: topic.toString(),
                        message: message,
                        time: returnTime()
                    };
                    res.json(response);
                    // 发送消息后断开连接
                    client.end();
                    // 从客户端实例映射中删除
                    clients.delete(clientId);
                    console.log('删除前连接数：' + currentConnections);
                    currentConnections--;
                    console.log('删除后连接数：' + currentConnections);
                }
            });
        })
        .catch(err => {
            res.status(500).send(err);
        });
});

app.listen(PORT, () => {
    console.log(`代理服务器已经运行在端口 ${PORT}`);
});