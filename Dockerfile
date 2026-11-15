FROM node:26-bookworm-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV DATA_DIR=/data
EXPOSE 3000

CMD ["npm", "start"]
