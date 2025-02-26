FROM node:20

WORKDIR /app

COPY ./packages.* ./

RUN npm install

COPY . .

CMD ["npm", "run", "start"]