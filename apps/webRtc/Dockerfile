FROM node:20-bullseye

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ./package.json  ./package.json
COPY ./package-lock.json  ./package-lock.json

RUN npm install

COPY . .

RUN npm run build

EXPOSE 8080
EXPOSE 40000-41999/udp
EXPOSE 40000-41999/tcp
EXPOSE 5000-6999/udp

CMD ["npm","run","dev"]