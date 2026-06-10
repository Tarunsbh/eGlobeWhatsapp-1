FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --frozen-lockfile
COPY . .
ARG VITE_API_URL=/api/v1
RUN VITE_API_URL=$VITE_API_URL npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy all nginx configs — docker-compose selects which one to mount at runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-hotel.conf /etc/nginx/nginx-hotel.conf
COPY nginx-admin.conf /etc/nginx/nginx-admin.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
