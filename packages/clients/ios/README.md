# IFLV iOS客户端

此目录包含IFLV的iOS客户端应用程序安装说明。

## 安装说明

由于App Store政策限制，IFLV iOS客户端需要通过TestFlight进行分发，或使用自签名证书安装。

### TestFlight安装（推荐）

1. 在iOS设备上安装TestFlight应用
2. 点击以下邀请链接加入测试：[TestFlight邀请](https://testflight.apple.com/join/iflvbeta)
3. 按照TestFlight中的提示完成安装

### 开发者账号自签名安装

如果您拥有Apple开发者账号，可以按照以下步骤自行签名安装：

1. 下载[IFLV_1.1.0_iOS.ipa](IFLV_1.1.0_iOS.ipa)文件
2. 使用Apple Configurator 2或其他签名工具进行重签名
3. 通过iTunes或其他工具将签名后的IPA安装到设备上

## 功能说明

- 支持iPhone和iPad（通用应用）
- 支持iOS/iPadOS 12.0及以上版本
- 自动发现同一网络内的IFLV服务器
- 支持HLS、RTSP等流媒体协议
- 支持EPG电子节目单显示
- 支持画中画模式和AirPlay投屏
- 支持深色模式
- 支持频道收藏和历史记录

## 常见问题

- **问题**: TestFlight邀请码过期
  **解决方案**: 请访问[IFLV官网](https://iflv.io)获取最新邀请链接

- **问题**: 应用无法连接到IFLV服务
  **解决方案**: 确保iOS设备与IFLV服务在同一网络中

- **问题**: 播放卡顿或缓冲频繁
  **解决方案**: 尝试在设置中增加缓冲时间，或检查Wi-Fi信号强度

更多常见问题解答，请参考[常见问题文档](../../../docs/faq.md)。 