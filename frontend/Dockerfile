FROM node:16-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

# Environment variables will be set by docker-compose
ENV REACT_APP_API_URL=http://localhost:5000/api
ENV REACT_APP_WS_URL=ws://localhost:5000

EXPOSE 3000

CMD ["npm", "start"]