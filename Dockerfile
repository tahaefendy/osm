# Microsoft'un içinde tüm Playwright kütüphaneleri olan resmi imajı
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Çalışma dizini oluştur
WORKDIR /app

# Bağımlılıkları kopyala ve yükle
COPY package*.json ./
RUN npm install

# Tüm kodları kopyala
COPY . .

# Railway için port ayarı
ENV PORT=8080
EXPOSE 8080

# Botu başlat
CMD [ "npm", "start" ]
