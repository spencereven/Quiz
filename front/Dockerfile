# 使用官方 Node.js 镜像作为基础镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json 文件
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 复制项目中的所有文件到工作目录
COPY . .

# 解决 sh: vite: Permission denied 的问题
RUN chmod -R +x node_modules/.bin

# 构建生产版本
RUN npm run build

# 暴露 Vite 开发服务器和后端服务器的端口
EXPOSE 3000

# 启动开发服务器的命令
CMD npm run dev