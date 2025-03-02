FROM node:22

ENV NODE_ENV=production

WORKDIR /app

COPY ./package.* ./

RUN npm install

COPY . .

CMD ["npm", "run", "start"]