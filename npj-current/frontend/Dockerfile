FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Usar npm install em vez de npm ci (quando não há package-lock.json)
RUN npm install

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

EXPOSE 5173

# Usar preview para servir os arquivos buildados
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]