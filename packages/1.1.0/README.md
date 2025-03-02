# IFLV 1.1.0 瀹夎鍖?

鏈洰褰曞寘鍚獻FLV 1.1.0鐗堟湰鐨勫畨瑁呭寘锛岄€傜敤浜庝互涓嬫灦鏋勶細

| 鏋舵瀯 | 鏂囦欢鍚?|
|------|----------|
| x86_64 | luci-app-iflv_1.1.0_x86_64.ipk |
| arm_cortex-a7 | luci-app-iflv_1.1.0_arm_cortex-a7.ipk |
| arm_cortex-a9 | luci-app-iflv_1.1.0_arm_cortex-a9.ipk |
| mipsel_24kc | luci-app-iflv_1.1.0_mipsel_24kc.ipk |

## 瀹夎璇存槑

1. 涓嬭浇閫傚悎鎮ㄨ澶囨灦鏋勭殑瀹夎鍖?
2. 灏嗘枃浠朵笂浼犲埌璺敱鍣ㄧ殑/tmp鐩綍
3. 閫氳繃SSH鐧诲綍璺敱鍣ㄥ苟鎵ц锛?
   `ash
   opkg update
   opkg install /tmp/luci-app-iflv_1.1.0_*.ipk
   `

濡傞渶纭畾鎮ㄧ殑璺敱鍣ㄦ灦鏋勶紝璇峰湪SSH涓墽琛岋細
`ash
opkg print-architecture
`

璇︾粏瀹夎鎸囧崡瑙乕瀹夎鏂囨。](../../docs/installation.md)
