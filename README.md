# Krypto Valuta - Blockchain Cryptocurrency Project

Ett blockchain-baserat kryptovaluta system med nätverksfunktionalitet, säkerhet och webbklient.

## Projektöversikt

Detta projekt implementerar en blockchain för en egen kryptovaluta med följande funktioner:

### Kärnfunktioner

- **Blockchain**: Komplett blockkedja med proof-of-work mining
- **Transaktioner**: Säker transaktionshantering med validering
- **Transactionspool**: Hantering av väntande transaktioner
- **Mining**: Belöningstransaktioner för miners
- **Nätverk**: Peer-to-peer kommunikation mellan noder
- **Säkerhet**: JWT-autentisering och skydd mot angrepp
- **Databas**: MongoDB för persistent lagring
- **Webbklient**: React-baserad användargränssnitt

## Installation

### Krav

- Node.js (v18 eller senare)
- MongoDB
- npm eller yarn

### Steg 1: Klona projektet

```bash
git clone <repository-url>
cd krypto-valuta
```

### Steg 2: Installera backend-beroenden

```bash
npm install
```

### Steg 3: Installera klient-beroenden

```bash
cd client
npm install
cd ..
```

### Steg 4: Konfigurera miljövariabler

Skapa en `.env` fil i root-mappen:

```env
NODE_ENV=development
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/smartchain
```

### Steg 5: Starta MongoDB

Säkerställ att MongoDB körs på din dator.

## Användning

### Starta hela applikationen (rekommenderat)

```bash
npm run dev-full
```

Detta startar både backend-servern och React-klienten samtidigt.

### Eller starta separat:

#### Starta endast backend

```bash
npm run dev
```

Backend körs på `http://localhost:3000`

#### Starta endast klient

```bash
npm run client
```

Klient körs på `http://localhost:5173`

### Starta flera noder

För att testa nätverksfunktionalitet:

```bash
npm run dev-node
```

Detta startar en ny nod på en slumpmässig port.

## Funktioner

### Webbklient

1. **Registrering/Inloggning**: Skapa konto och logga in
2. **Dashboard**: Översikt av blockchain-status
3. **Wallet**: Hantera din digitala plånbok
4. **Transaktioner**: Skapa och visa transaktioner
5. **Mining**: Starta mining-processen
6. **Explorer**: Utforska blockchain och block

### API Endpoints

- `POST /api/auth/register` - Registrera användare
- `POST /api/auth/login` - Logga in
- `GET /api/blocks` - Hämta blockchain
- `POST /api/wallet/transaction` - Skapa transaktion
- `POST /api/wallet/mine` - Starta mining

## Teknisk Stack

### Backend

- **Node.js** med ES-moduler
- **Express.js** för API
- **MongoDB** med Mongoose
- **Socket.IO** för WebSocket-kommunikation
- **JWT** för autentisering
- **Vitest** för testning

### Frontend

- **React** med Vite
- **Tailwind CSS** för styling
- **React Router** för navigation

### Säkerhet

- **Helmet** för säkra headers
- **Rate Limiting** mot DDOS
- **Input Sanitization** mot XSS
- **MongoDB Sanitization** mot NoSQL-injektioner

## Testning

Kör alla tester:

```bash
npm test
```
