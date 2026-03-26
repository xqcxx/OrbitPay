FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
COPY README.md ./README.md

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3001 3002

CMD ["npm", "run", "start:api"]
