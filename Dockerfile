FROM node:18 AS deps

WORKDIR /workspace

COPY ./package*.json ./

RUN npm ci --omit=dev

# Main
FROM gcr.io/distroless/nodejs:18

WORKDIR /app

COPY ./src ./src
COPY --from=deps /workspace/node_modules ./node_modules

CMD [ "./src/index.mjs" ]
