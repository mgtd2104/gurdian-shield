FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN apk add --no-cache python3 py3-pip

COPY requirements.txt ./

RUN python3 -m pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5001

CMD ["npm", "start"]
