# Servidor de Renderização MP4

Servidor Express que renderiza vídeos MP4 usando Remotion.

## Como usar

1. Faça upload destes arquivos para um repositório no GitHub
2. No Render.com, crie um "Web Service" conectado ao repositório
3. O Render detecta o Dockerfile automaticamente
4. Adicione a variável de ambiente `RENDER_TOKEN` com uma senha forte
5. Aguarde o deploy ficar "Live"

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `RENDER_TOKEN` | Senha de autenticação (obrigatória) |
| `PORT` | Porta do servidor (padrão: 3000) |

## Endpoints

- `GET /` — Status do servidor
- `POST /render` — Iniciar renderização
- `GET /status?renderId=xxx` — Verificar progresso
