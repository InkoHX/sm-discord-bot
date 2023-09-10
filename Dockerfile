FROM node:20 AS deps

WORKDIR /workspace

COPY ./package*.json ./

RUN npm ci --omit=dev --ignore-scripts

# Main
FROM gcr.io/distroless/nodejs20-debian11:nonroot

WORKDIR /app

COPY ./src ./src
COPY --from=deps /workspace/node_modules ./node_modules

CMD [ "./src/index.mjs" ]
