# 安全政策

## 支持的版本

| 版本 | 支持情况 |
| --- | --- |
| 1.x | 正在支持 |

## 报告漏洞

如果你发现了安全漏洞，请**不要**通过公开 Issue 披露。

请通过 GitHub 私有渠道联系仓库维护者（例如通过 [GitHub Security Advisories](https://github.com/security/advisories) 私密上报，或私信仓库所有者），并在报告中尽量包含：

- 漏洞类型与影响范围；
- 复现步骤或概念验证（PoC）；
- 相关的运行端（H5 / 小程序 / App）与环境信息。

维护者会在收到报告后尽快确认并跟进修复，修复发布后会在本文件与 Release 说明中致谢报告者（除非你希望匿名）。

## 安全基线建议

部署或二次开发本项目时，请注意：

- 后端地址统一在 `config/index.js` 配置，生产环境必须使用 HTTPS 地址（`PROD_BASE_URL`）；
- 不要将 token、密钥等敏感信息硬编码进源码，环境变量文件（`.env`、`.env.local`）已在 `.gitignore` 中忽略；
- 小程序端需在对应平台后台配置 request / socket 合法域名。
